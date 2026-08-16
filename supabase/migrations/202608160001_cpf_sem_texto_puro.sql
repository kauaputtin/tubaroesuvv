-- =============================================================================
-- O CPF cru deixa de chegar ao banco
-- =============================================================================
--
-- Antes, `create_pending_order` recebia o CPF completo dentro de `p_customer`
-- e derivava as duas colunas ali dentro:
--
--   cpf_hash  = encode(digest(p_customer->>'cpf', 'sha256'), 'hex')
--   cpf_last4 = right(p_customer->>'cpf', 4)
--
-- Dois problemas nisso.
--
-- Primeiro, o hash não protegia nada. SHA-256 sem sal é rápido de propósito, e
-- o CPF tem só ~10^9 valores válidos (11 dígitos, dois deles verificadores).
-- Uma tabela com todos os CPFs válidos e seus hashes é computável em minutos
-- numa GPU comum. Com `cpf_last4` na mesma linha, a busca cai para ~10^5. Ou
-- seja: qualquer dump do banco devolvia os CPFs em claro.
--
-- Segundo, o CPF completo viajava como parâmetro da função — aparecendo em
-- logs de consulta lenta, em plano de execução e em qualquer auditoria de SQL.
--
-- Agora o servidor calcula HMAC-SHA256(CPF) com uma chave secreta que vive só
-- na aplicação (CPF_HASH_KEY) e manda pronto. Sem essa chave, a tabela
-- arco-íris não serve para nada, porque o atacante não consegue gerar os
-- hashes candidatos. E o CPF cru nunca entra no Postgres: segue direto para o
-- gateway e morre no fim da requisição.
--
-- Trocar para bcrypt/argon2 aqui não resolveria bem: o domínio é pequeno
-- demais, e um fator de custo alto o bastante para compensar isso deixaria o
-- checkout lento. O que falta é segredo, não lentidão — daí HMAC.
-- =============================================================================

create or replace function create_pending_order(
  p_customer jsonb,
  p_address jsonb,
  p_items jsonb,
  p_fulfillment text,
  p_payment_method text,
  p_notes text,
  p_coupon_code text,
  p_subtotal numeric,
  p_discount numeric,
  p_shipping numeric,
  p_total numeric,
  p_reservation_minutes integer default 30
) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare
  v_customer_id uuid;
  v_course_id uuid;
  v_address_id uuid;
  v_order_id uuid := gen_random_uuid();
  v_public_number text;
  v_tracking_token text := encode(gen_random_bytes(32), 'hex');
  v_item jsonb;
  v_product products%rowtype;
  v_variant product_variants%rowtype;
  v_unit_price numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_total numeric(12,2);
  v_coupon coupons%rowtype;
  v_method shipping_methods%rowtype;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Carrinho vazio'; end if;
  if p_fulfillment not in ('pickup','local_delivery','shipping') then raise exception 'Modalidade inválida'; end if;
  if p_payment_method not in ('pix','card') then raise exception 'Pagamento inválido'; end if;

  -- Falha fechado: sem o hash pronto, o pedido não nasce. Isso impede que uma
  -- chamada antiga (mandando 'cpf') grave hash nulo sem ninguém perceber.
  if nullif(p_customer->>'cpf_hash','') is null or nullif(p_customer->>'cpf_last4','') is null then
    raise exception 'Identificação do cliente ausente';
  end if;
  if p_customer ? 'cpf' then
    raise exception 'CPF em texto puro não deve ser enviado ao banco';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = v_item->>'productId' and active for update;
    if not found then raise exception 'Produto indisponível: %', v_item->>'productId'; end if;
    if (v_item->>'quantity')::integer < 1 or (v_item->>'quantity')::integer > 20 then raise exception 'Quantidade inválida'; end if;
    if exists(select 1 from product_options po where po.product_id=v_product.id and po.required and not exists(select 1 from product_option_values pov where pov.option_id=po.id and pov.value=coalesce(v_item->'options'->>po.name,''))) then
      raise exception 'Variação obrigatória inválida para %', v_product.name;
    end if;
    v_variant := null;
    if nullif(v_item->>'variantId','') is not null then
      select * into v_variant from product_variants where id=v_item->>'variantId' and product_id=v_product.id and active for update;
      if not found then raise exception 'Variação indisponível para %',v_product.name; end if;
      if exists(select 1 from variant_option_values vov join product_option_values pov on pov.id=vov.option_value_id join product_options po on po.id=pov.option_id where vov.variant_id=v_variant.id and coalesce(v_item->'options'->>po.name,'')<>pov.value) then raise exception 'Combinação de variação inválida'; end if;
      if not v_product.allow_backorder and v_variant.stock-v_variant.reserved_stock<(v_item->>'quantity')::integer then raise exception 'Estoque insuficiente para %',v_product.name; end if;
      v_unit_price:=coalesce(v_variant.price,v_product.price);
    else
      if exists(select 1 from product_variants where product_id=v_product.id and active) then raise exception 'Selecione uma variação disponível para %',v_product.name; end if;
      if not v_product.allow_backorder and v_product.stock-v_product.reserved_stock<(v_item->>'quantity')::integer then raise exception 'Estoque insuficiente para %',v_product.name; end if;
      v_unit_price:=v_product.price;
    end if;
    v_subtotal := v_subtotal + v_unit_price * (v_item->>'quantity')::integer;
  end loop;

  select * into v_method from shipping_methods where type = p_fulfillment::fulfillment_type and active;
  if not found then raise exception 'Modalidade de entrega indisponível'; end if;
  v_shipping := case when p_fulfillment = 'pickup' then 0 when v_method.free_above is not null and v_subtotal >= v_method.free_above then 0 else v_method.price end;

  if nullif(trim(p_coupon_code), '') is not null then
    select * into v_coupon from coupons
      where code = p_coupon_code and active
      and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now())
      and minimum_order <= v_subtotal for update;
    if not found then raise exception 'Cupom inválido ou expirado'; end if;
    if v_coupon.total_usage_limit is not null and (select count(*) from coupon_uses where coupon_id = v_coupon.id) >= v_coupon.total_usage_limit then raise exception 'Limite do cupom atingido'; end if;
    v_discount := case when v_coupon.type = 'percentage' then round(v_subtotal * v_coupon.value / 100, 2) else least(v_coupon.value, v_subtotal) end;
    if v_coupon.maximum_discount is not null then v_discount := least(v_discount, v_coupon.maximum_discount); end if;
    if v_coupon.free_shipping then v_shipping := 0; end if;
  end if;
  v_total := greatest(0, v_subtotal - v_discount + v_shipping);

  if abs(v_subtotal - p_subtotal) > .01 or abs(v_discount - p_discount) > .01 or abs(v_shipping - p_shipping) > .01 or abs(v_total - p_total) > .01 then
    raise exception 'Os valores do pedido foram alterados; recarregue o checkout';
  end if;

  select id into v_course_id from courses where name = p_customer->>'course' and active;
  if v_course_id is null then raise exception 'Curso inválido'; end if;

  -- Hash e últimos dígitos chegam prontos do servidor (HMAC com CPF_HASH_KEY).
  insert into customers (full_name, email, phone, cpf_hash, cpf_last4, privacy_consent_at)
  values (p_customer->>'full_name', lower(p_customer->>'email'), p_customer->>'phone', p_customer->>'cpf_hash', p_customer->>'cpf_last4', now())
  on conflict (email) do update set full_name = excluded.full_name, phone = excluded.phone, cpf_hash = excluded.cpf_hash, cpf_last4 = excluded.cpf_last4, privacy_consent_at = now()
  returning id into v_customer_id;

  if p_address is not null then
    insert into addresses (customer_id, postal_code, street, number, complement, district, city, state)
    values (v_customer_id, p_address->>'postal_code', p_address->>'street', p_address->>'number', nullif(p_address->>'complement',''), p_address->>'district', p_address->>'city', upper(p_address->>'state'))
    returning id into v_address_id;
  end if;

  v_public_number := 'TUVV-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');
  insert into orders (id, public_number, tracking_token, customer_id, course_id, address_id, coupon_id, fulfillment_type, subtotal, discount, shipping_amount, total, customer_notes, stock_reserved_at, reservation_expires_at)
  values (v_order_id, v_public_number, v_tracking_token, v_customer_id, v_course_id, v_address_id, v_coupon.id, p_fulfillment::fulfillment_type, v_subtotal, v_discount, v_shipping, v_total, nullif(p_notes,''), now(), now() + make_interval(mins => greatest(5, least(p_reservation_minutes, 120))));

  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product from products where id = v_item->>'productId';
    v_variant := null;
    if nullif(v_item->>'variantId','') is not null then select * into v_variant from product_variants where id=v_item->>'variantId'; end if;
    v_unit_price:=coalesce(v_variant.price,v_product.price);
    insert into order_items (order_id, product_id, variant_id, product_name, sku, selected_options, unit_price, quantity)
    values (v_order_id, v_product.id, v_variant.id, v_product.name, coalesce(v_variant.sku,v_product.sku), coalesce(v_item->'options','{}'::jsonb), v_unit_price, (v_item->>'quantity')::integer);
    if v_variant.id is not null then
      update product_variants set reserved_stock=reserved_stock+(v_item->>'quantity')::integer where id=v_variant.id;
      insert into inventory_movements (product_id,variant_id,order_id,type,quantity,balance_after,reason,idempotency_key) values (v_product.id,v_variant.id,v_order_id,'reservation',(v_item->>'quantity')::integer,v_variant.stock-v_variant.reserved_stock-(v_item->>'quantity')::integer,'Reserva para pagamento','reserve:'||v_order_id||':'||v_variant.id);
    else
      update products set reserved_stock=reserved_stock+(v_item->>'quantity')::integer where id=v_product.id;
      insert into inventory_movements (product_id,order_id,type,quantity,balance_after,reason,idempotency_key) values (v_product.id,v_order_id,'reservation',(v_item->>'quantity')::integer,v_product.stock-v_product.reserved_stock-(v_item->>'quantity')::integer,'Reserva para pagamento','reserve:'||v_order_id||':'||v_product.id);
    end if;
  end loop;

  if v_coupon.id is not null then
    insert into coupon_uses (coupon_id, customer_id, order_id, discount_amount) values (v_coupon.id, v_customer_id, v_order_id, v_discount);
  end if;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_public_number, 'tracking_token', v_tracking_token);
end;
$fn$;

-- A função nasce com EXECUTE concedido a PUBLIC; sem isto, qualquer visitante
-- criaria pedidos direto pela API REST, sem passar pelo checkout.
revoke all on function create_pending_order(jsonb,jsonb,jsonb,text,text,text,text,numeric,numeric,numeric,numeric,integer) from public, anon, authenticated;

comment on column customers.cpf_hash is
  'HMAC-SHA256 do CPF com CPF_HASH_KEY (segredo da aplicação, fora do banco). Sem a chave não é possível reverter por força bruta.';
