-- Tubarões UVV — schema inicial
-- Execute com `supabase db push` ou pelo SQL Editor do Supabase.

create extension if not exists pgcrypto;
create extension if not exists citext;

create type payment_status as enum ('pending', 'processing', 'approved', 'rejected', 'cancelled', 'refunded');
create type fulfillment_status as enum ('received', 'preparing', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled');
create type fulfillment_type as enum ('pickup', 'local_delivery', 'shipping');
create type inventory_movement_type as enum ('reservation', 'release', 'sale', 'restock', 'adjustment');
create type coupon_type as enum ('fixed', 'percentage');

create sequence order_number_seq start 1001;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_id uuid not null references roles(id),
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_profile_fk foreign key (user_id) references profiles(id) on delete cascade
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_url text,
  icon text,
  sort_order integer not null default 0,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text,
  description text,
  main_image_url text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  sku text not null unique,
  internal_code text unique,
  weight_grams integer not null default 0 check (weight_grams >= 0),
  width_cm numeric(8,2),
  height_cm numeric(8,2),
  length_cm numeric(8,2),
  stock integer not null default 0 check (stock >= 0),
  reserved_stock integer not null default 0 check (reserved_stock >= 0 and reserved_stock <= stock),
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  active boolean not null default true,
  featured boolean not null default false,
  is_new boolean not null default false,
  allow_backorder boolean not null default false,
  seo_title text,
  seo_description text,
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table product_categories (
  product_id text not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table product_options (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  name text not null,
  required boolean not null default true,
  sort_order integer not null default 0,
  unique (product_id, name)
);

create table product_option_values (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references product_options(id) on delete cascade,
  value text not null,
  sort_order integer not null default 0,
  unique (option_id, value)
);

create table product_variants (
  id text primary key default gen_random_uuid()::text,
  product_id text not null references products(id) on delete cascade,
  sku text not null unique,
  price numeric(12,2) check (price is null or price >= 0),
  cost numeric(12,2) check (cost is null or cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  reserved_stock integer not null default 0 check (reserved_stock >= 0 and reserved_stock <= stock),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table variant_option_values (
  variant_id text not null references product_variants(id) on delete cascade,
  option_value_id uuid not null references product_option_values(id) on delete cascade,
  primary key (variant_id, option_value_id)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email citext not null unique,
  phone text not null,
  cpf_hash text not null,
  cpf_last4 char(4) not null,
  marketing_consent boolean not null default false,
  privacy_consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  postal_code text not null,
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state char(2) not null,
  created_at timestamptz not null default now()
);

create table carts (
  id uuid primary key default gen_random_uuid(),
  session_hash text not null unique,
  customer_id uuid references customers(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  variant_id text references product_variants(id) on delete cascade,
  quantity integer not null check (quantity > 0 and quantity <= 20),
  selected_options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (cart_id, product_id, variant_id, selected_options)
);

create table shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type fulfillment_type not null unique,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  free_above numeric(12,2),
  region_rules jsonb not null default '[]'::jsonb,
  pickup_location text,
  pickup_hours text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  type coupon_type not null,
  value numeric(12,2) not null check (value > 0),
  minimum_order numeric(12,2) not null default 0,
  maximum_discount numeric(12,2),
  total_usage_limit integer,
  per_customer_limit integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  free_shipping boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coupon_products (
  coupon_id uuid not null references coupons(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  primary key (coupon_id, product_id)
);

create table coupon_categories (
  coupon_id uuid not null references coupons(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (coupon_id, category_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  public_number text not null unique,
  tracking_token text not null unique,
  customer_id uuid not null references customers(id),
  course_id uuid references courses(id) on delete set null,
  address_id uuid references addresses(id) on delete set null,
  coupon_id uuid references coupons(id) on delete set null,
  payment_status payment_status not null default 'pending',
  fulfillment_status fulfillment_status not null default 'received',
  fulfillment_type fulfillment_type not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  total numeric(12,2) not null check (total >= 0),
  customer_notes text,
  internal_notes text,
  tracking_code text,
  stock_reserved_at timestamptz,
  reservation_expires_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text references products(id) on delete set null,
  variant_id text references product_variants(id) on delete set null,
  product_name text not null,
  sku text not null,
  selected_options jsonb not null default '{}'::jsonb,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  total numeric(12,2) generated always as (unit_price * quantity) stored,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  method text not null check (method in ('pix', 'card')),
  status payment_status not null default 'pending',
  amount numeric(12,2) not null check (amount >= 0),
  installments integer not null default 1 check (installments > 0),
  idempotency_key uuid not null unique,
  raw_response jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  provider_payment_id text,
  order_id uuid references orders(id) on delete set null,
  event_type text,
  payload jsonb not null,
  processed_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table coupon_uses (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id),
  customer_id uuid not null references customers(id),
  order_id uuid not null unique references orders(id) on delete cascade,
  discount_amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id text references products(id) on delete set null,
  variant_id text references product_variants(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  type inventory_movement_type not null,
  quantity integer not null check (quantity <> 0),
  balance_after integer,
  reason text not null,
  idempotency_key text unique,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null)
);

create table store_settings (
  key text primary key,
  value jsonb not null,
  draft_value jsonb,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table homepage_sections (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text,
  content jsonb not null default '{}'::jsonb,
  draft_content jsonb,
  sort_order integer not null default 0,
  visible boolean not null default true,
  published boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  mobile_image_url text,
  alt_text text not null,
  link_url text,
  button_label text,
  position text not null default 'hero',
  sort_order integer not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  previous_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  active boolean not null default true,
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index products_active_featured_idx on products (active, featured, created_at desc);
create index products_stock_idx on products (stock, minimum_stock) where active;
create index products_search_idx on products using gin (to_tsvector('portuguese', name || ' ' || coalesce(description, '')));
create index categories_parent_sort_idx on categories (parent_id, sort_order) where active;
create index variants_product_active_idx on product_variants (product_id, active);
create index inventory_product_created_idx on inventory_movements (product_id, created_at desc);
create index customers_cpf_hash_idx on customers (cpf_hash);
create index orders_created_idx on orders (created_at desc);
create index orders_status_idx on orders (payment_status, fulfillment_status, created_at desc);
create index orders_course_idx on orders (course_id, created_at desc);
create index orders_reservation_idx on orders (reservation_expires_at) where payment_status in ('pending', 'processing');
create index payments_order_idx on payments (order_id, created_at desc);
create index payment_events_payment_idx on payment_events (provider_payment_id, processed_at desc);
create index homepage_sections_public_idx on homepage_sections (published, visible, sort_order);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','admin_users','courses','categories','products','product_variants','customers','carts','cart_items','shipping_methods','coupons','orders','payments','homepage_sections','banners'] loop
    execute format('create trigger %I_set_updated_at before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from admin_users where user_id = auth.uid() and active);
$$;

create or replace function admin_has_permission(permission_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admin_users au
    join role_permissions rp on rp.role_id = au.role_id
    join permissions p on p.id = rp.permission_id
    where au.user_id = auth.uid() and au.active and p.code = permission_code
  );
$$;

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
language plpgsql security definer set search_path = public as $$
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

  insert into customers (full_name, email, phone, cpf_hash, cpf_last4, privacy_consent_at)
  values (p_customer->>'full_name', lower(p_customer->>'email'), p_customer->>'phone', encode(digest(p_customer->>'cpf', 'sha256'), 'hex'), right(p_customer->>'cpf', 4), now())
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
$$;

create or replace function quote_order(p_items jsonb, p_fulfillment text, p_coupon_code text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_item jsonb; v_product products%rowtype; v_variant product_variants%rowtype; v_coupon coupons%rowtype; v_method shipping_methods%rowtype; v_unit_price numeric(12,2); v_subtotal numeric(12,2):=0; v_discount numeric(12,2):=0; v_shipping numeric(12,2):=0;
begin
  if jsonb_array_length(p_items)=0 then raise exception 'Carrinho vazio'; end if;
  if p_fulfillment not in ('pickup','local_delivery','shipping') then raise exception 'Modalidade inválida'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_product from products where id=v_item->>'productId' and active;
    if not found then raise exception 'Produto indisponível'; end if;
    if (v_item->>'quantity')::integer<1 or (v_item->>'quantity')::integer>20 then raise exception 'Quantidade inválida'; end if;
    if exists(select 1 from product_options po where po.product_id=v_product.id and po.required and not exists(select 1 from product_option_values pov where pov.option_id=po.id and pov.value=coalesce(v_item->'options'->>po.name,''))) then raise exception 'Variação obrigatória inválida para %',v_product.name; end if;
    v_variant:=null;
    if nullif(v_item->>'variantId','') is not null then
      select * into v_variant from product_variants where id=v_item->>'variantId' and product_id=v_product.id and active;
      if not found then raise exception 'Variação indisponível para %',v_product.name; end if;
      if exists(select 1 from variant_option_values vov join product_option_values pov on pov.id=vov.option_value_id join product_options po on po.id=pov.option_id where vov.variant_id=v_variant.id and coalesce(v_item->'options'->>po.name,'')<>pov.value) then raise exception 'Combinação de variação inválida'; end if;
      if not v_product.allow_backorder and v_variant.stock-v_variant.reserved_stock<(v_item->>'quantity')::integer then raise exception 'Estoque insuficiente para %',v_product.name; end if;
      v_unit_price:=coalesce(v_variant.price,v_product.price);
    else
      if exists(select 1 from product_variants where product_id=v_product.id and active) then raise exception 'Selecione uma variação disponível para %',v_product.name; end if;
      if not v_product.allow_backorder and v_product.stock-v_product.reserved_stock<(v_item->>'quantity')::integer then raise exception 'Estoque insuficiente para %',v_product.name; end if;
      v_unit_price:=v_product.price;
    end if;
    v_subtotal:=v_subtotal+v_unit_price*(v_item->>'quantity')::integer;
  end loop;
  select * into v_method from shipping_methods where type=p_fulfillment::fulfillment_type and active;
  if not found then raise exception 'Modalidade de entrega indisponível'; end if;
  v_shipping:=case when p_fulfillment='pickup' then 0 when v_method.free_above is not null and v_subtotal>=v_method.free_above then 0 else v_method.price end;
  if nullif(trim(p_coupon_code),'') is not null then
    select * into v_coupon from coupons where code=p_coupon_code and active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>=now()) and minimum_order<=v_subtotal;
    if not found then raise exception 'Cupom inválido ou expirado'; end if;
    if v_coupon.total_usage_limit is not null and (select count(*) from coupon_uses where coupon_id=v_coupon.id)>=v_coupon.total_usage_limit then raise exception 'Limite do cupom atingido'; end if;
    v_discount:=case when v_coupon.type='percentage' then round(v_subtotal*v_coupon.value/100,2) else least(v_coupon.value,v_subtotal) end;
    if v_coupon.maximum_discount is not null then v_discount:=least(v_discount,v_coupon.maximum_discount); end if;
    if v_coupon.free_shipping then v_shipping:=0; end if;
  end if;
  return jsonb_build_object('subtotal',v_subtotal,'discount',v_discount,'shipping',v_shipping,'total',greatest(0,v_subtotal-v_discount+v_shipping),'couponCode',case when v_coupon.id is null then null else upper(p_coupon_code) end);
end;
$$;

create or replace function adjust_inventory(p_product_id text, p_delta integer, p_reason text) returns integer
language plpgsql security definer set search_path = public as $$
declare v_product products%rowtype; v_new_stock integer;
begin
  if not admin_has_permission('inventory.manage') then raise exception 'Sem permissão para ajustar estoque'; end if;
  if p_delta = 0 or nullif(trim(p_reason), '') is null then raise exception 'Ajuste e motivo são obrigatórios'; end if;
  select * into v_product from products where id = p_product_id for update;
  if not found then raise exception 'Produto não encontrado'; end if;
  v_new_stock := v_product.stock + p_delta;
  if v_new_stock < v_product.reserved_stock or v_new_stock < 0 then raise exception 'O novo saldo não pode ser menor que o estoque reservado'; end if;
  update products set stock = v_new_stock where id = p_product_id;
  insert into inventory_movements (product_id,type,quantity,balance_after,reason,actor_id)
  values (p_product_id,'adjustment',p_delta,v_new_stock-v_product.reserved_stock,p_reason,auth.uid());
  return v_new_stock;
end;
$$;

create or replace function release_order_reservation(p_order_id uuid, p_reason text default 'cancelled') returns boolean
language plpgsql security definer set search_path = public as $$
declare v_order orders%rowtype; v_item order_items%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found or v_order.payment_status in ('approved','cancelled','rejected','refunded') then return false; end if;
  for v_item in select * from order_items where order_id = p_order_id loop
    if v_item.variant_id is not null then update product_variants set reserved_stock=greatest(0,reserved_stock-v_item.quantity) where id=v_item.variant_id; else update products set reserved_stock=greatest(0,reserved_stock-v_item.quantity) where id=v_item.product_id; end if;
    insert into inventory_movements (product_id,variant_id,order_id,type,quantity,reason,idempotency_key)
    values (v_item.product_id,v_item.variant_id,p_order_id,'release',-v_item.quantity,p_reason,'release:'||p_order_id||':'||v_item.id)
    on conflict (idempotency_key) do nothing;
  end loop;
  update orders set payment_status = 'cancelled', fulfillment_status = 'cancelled', cancelled_at = now() where id = p_order_id;
  return true;
end;
$$;

create or replace function process_payment_status(
  p_provider text, p_event_id text, p_payment_id text, p_order_id text, p_status text, p_payload jsonb
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_order orders%rowtype; v_item order_items%rowtype; v_event uuid;
begin
  insert into payment_events (provider, provider_event_id, provider_payment_id, order_id, event_type, payload)
  values (p_provider, p_event_id, p_payment_id, nullif(p_order_id,'')::uuid, p_status, p_payload)
  on conflict (provider, provider_event_id) do nothing returning id into v_event;
  if v_event is null then return false; end if;
  select * into v_order from orders where id = nullif(p_order_id,'')::uuid for update;
  if not found then raise exception 'Pedido do pagamento não encontrado'; end if;
  update payments set status = p_status::payment_status, raw_response = p_payload where provider = p_provider and provider_payment_id = p_payment_id;

  if p_status = 'approved' and v_order.payment_status <> 'approved' then
    for v_item in select * from order_items where order_id = v_order.id loop
      if v_item.variant_id is not null then update product_variants set stock=stock-v_item.quantity,reserved_stock=greatest(0,reserved_stock-v_item.quantity) where id=v_item.variant_id; else update products set stock=stock-v_item.quantity,reserved_stock=greatest(0,reserved_stock-v_item.quantity) where id=v_item.product_id; end if;
      insert into inventory_movements (product_id,variant_id,order_id,type,quantity,reason,idempotency_key)
      values (v_item.product_id,v_item.variant_id,v_order.id,'sale',-v_item.quantity,'Pagamento aprovado','sale:'||p_provider||':'||p_payment_id||':'||v_item.id)
      on conflict (idempotency_key) do nothing;
    end loop;
    update orders set payment_status = 'approved', paid_at = now() where id = v_order.id;
  elsif p_status in ('rejected','cancelled') and v_order.payment_status not in ('approved','rejected','cancelled') then
    for v_item in select * from order_items where order_id = v_order.id loop
      if v_item.variant_id is not null then update product_variants set reserved_stock=greatest(0,reserved_stock-v_item.quantity) where id=v_item.variant_id; else update products set reserved_stock=greatest(0,reserved_stock-v_item.quantity) where id=v_item.product_id; end if;
      insert into inventory_movements (product_id,variant_id,order_id,type,quantity,reason,idempotency_key)
      values (v_item.product_id,v_item.variant_id,v_order.id,'release',-v_item.quantity,'Pagamento '||p_status,'release-payment:'||p_provider||':'||p_payment_id||':'||v_item.id)
      on conflict (idempotency_key) do nothing;
    end loop;
    update orders set payment_status = p_status::payment_status, fulfillment_status = 'cancelled', cancelled_at = now() where id = v_order.id;
  elsif p_status = 'refunded' then
    update orders set payment_status = 'refunded' where id = v_order.id;
  else
    update orders set payment_status = p_status::payment_status where id = v_order.id and payment_status <> 'approved';
  end if;
  return true;
end;
$$;

create or replace function release_expired_reservations() returns integer
language plpgsql security definer set search_path = public as $$
declare v_order record; v_count integer := 0;
begin
  for v_order in select id from orders where payment_status in ('pending','processing') and reservation_expires_at < now() for update skip locked loop
    if release_order_reservation(v_order.id, 'reservation_expired') then v_count := v_count + 1; end if;
  end loop;
  return v_count;
end;
$$;

create view admin_dashboard_summary as
select
  coalesce(sum(total) filter (where payment_status = 'approved'), 0) as total_revenue,
  count(*) as total_orders,
  count(*) filter (where payment_status = 'approved') as paid_orders,
  count(*) filter (where payment_status in ('pending','processing')) as pending_orders,
  count(*) filter (where payment_status = 'cancelled') as cancelled_orders,
  coalesce(avg(total) filter (where payment_status = 'approved'), 0) as average_ticket
from orders;

alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table admin_users enable row level security;
alter table courses enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_categories enable row level security;
alter table product_options enable row level security;
alter table product_option_values enable row level security;
alter table product_variants enable row level security;
alter table variant_option_values enable row level security;
alter table customers enable row level security;
alter table addresses enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table shipping_methods enable row level security;
alter table coupons enable row level security;
alter table coupon_products enable row level security;
alter table coupon_categories enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table payment_events enable row level security;
alter table coupon_uses enable row level security;
alter table inventory_movements enable row level security;
alter table store_settings enable row level security;
alter table homepage_sections enable row level security;
alter table banners enable row level security;
alter table audit_logs enable row level security;
alter table newsletter_subscribers enable row level security;

create policy "catalog products are public" on products for select to anon, authenticated using (active);
create policy "catalog images are public" on product_images for select to anon, authenticated using (exists(select 1 from products p where p.id = product_id and p.active));
create policy "catalog categories are public" on categories for select to anon, authenticated using (active);
create policy "catalog product categories are public" on product_categories for select to anon, authenticated using (true);
create policy "catalog options are public" on product_options for select to anon, authenticated using (true);
create policy "catalog option values are public" on product_option_values for select to anon, authenticated using (true);
create policy "catalog variants are public" on product_variants for select to anon, authenticated using (active);
create policy "catalog variant values are public" on variant_option_values for select to anon, authenticated using (true);
create policy "active courses are public" on courses for select to anon, authenticated using (active);
create policy "shipping methods are public" on shipping_methods for select to anon, authenticated using (active);
create policy "public settings are readable" on store_settings for select to anon, authenticated using (is_public);
create policy "published sections are public" on homepage_sections for select to anon, authenticated using (published and visible and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "active banners are public" on banners for select to anon, authenticated using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));

do $$
declare t text;
begin
  foreach t in array array['profiles','roles','permissions','role_permissions','admin_users','courses','categories','products','product_images','product_categories','product_options','product_option_values','product_variants','variant_option_values','customers','addresses','carts','cart_items','shipping_methods','coupons','coupon_products','coupon_categories','orders','order_items','payments','payment_events','coupon_uses','inventory_movements','store_settings','homepage_sections','banners','audit_logs','newsletter_subscribers'] loop
    execute format('create policy %I on %I for all to authenticated using (is_admin()) with check (is_admin())', 'admins manage ' || t, t);
  end loop;
end $$;

revoke all on function create_pending_order(jsonb,jsonb,jsonb,text,text,text,text,numeric,numeric,numeric,numeric,integer) from public, anon, authenticated;
revoke all on function process_payment_status(text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function release_order_reservation(uuid,text) from public, anon, authenticated;
revoke all on function release_expired_reservations() from public, anon, authenticated;
revoke all on function quote_order(jsonb,text,text) from public, anon, authenticated;
revoke all on function adjust_inventory(text,integer,text) from public, anon;
grant execute on function adjust_inventory(text,integer,text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
create policy "product images are public" on storage.objects for select to public using (bucket_id = 'product-images');
create policy "admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and is_admin());
create policy "admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and is_admin()) with check (bucket_id = 'product-images' and is_admin());
create policy "admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and is_admin());

insert into roles (name, description) values
  ('Administrador geral', 'Acesso completo à operação.'),
  ('Gerente', 'Produtos, pedidos, promoções e relatórios.'),
  ('Atendimento', 'Pedidos, clientes e comunicação.'),
  ('Estoque', 'Produtos e movimentações de estoque.'),
  ('Financeiro', 'Visualização financeira e pagamentos.');

insert into permissions (code, description) values
  ('dashboard.view','Visualizar dashboard'), ('orders.view','Visualizar pedidos'), ('orders.manage','Gerenciar pedidos'),
  ('products.view','Visualizar produtos'), ('products.manage','Gerenciar produtos'), ('inventory.manage','Gerenciar estoque'),
  ('coupons.manage','Gerenciar cupons'), ('appearance.manage','Editar aparência'), ('settings.manage','Editar configurações'),
  ('finance.view','Visualizar dados financeiros'), ('admins.manage','Gerenciar usuários administrativos');

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p where r.name = 'Administrador geral';
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in ('dashboard.view','orders.view','orders.manage','products.view','products.manage','inventory.manage','coupons.manage','appearance.manage') where r.name = 'Gerente';
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in ('dashboard.view','orders.view','orders.manage') where r.name = 'Atendimento';
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in ('dashboard.view','products.view','inventory.manage') where r.name = 'Estoque';
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.code in ('dashboard.view','orders.view','finance.view') where r.name = 'Financeiro';

insert into courses (name, sort_order) values
  ('Ciência da Computação', 1), ('Sistemas de Informação', 2), ('Engenharia de Software', 3), ('Análise de Sistemas', 4);

insert into categories (name, slug, description, sort_order, featured) values
  ('Roupas','roupas','Vista a força da nossa atlética.',1,true),
  ('Acessórios','acessorios','Tubarões em todos os detalhes.',2,true),
  ('Tirantes','tirantes','Seu curso e sua atlética com você.',3,true);

insert into products (id,name,slug,short_description,description,main_image_url,price,compare_at_price,cost,sku,stock,minimum_stock,active,featured,is_new,weight_grams) values
  ('camisa-i-2025','Camisa I Tubarões 2025','camisa-i-tubaroes-2025','O manto oficial para levar a força dos Tubarões.','Camisa esportiva oficial, leve e respirável.','/products/camisa-i-2025.jpg',69.90,null,34,'TUVV-CAM-I-25',18,5,true,true,true,280),
  ('camiseta-cc-azul','Camiseta Ciência da Computação Azul','camiseta-ciencia-da-computacao-azul','Tecnologia, curso e atlética na mesma camiseta.','Camiseta casual em malha confortável.','/products/camiseta-cc-azul.jpg',54.90,null,26,'TUVV-CC-AZ',26,6,true,true,false,220),
  ('copo-tubaroes','Copo Tubarões','copo-tubaroes','O copo da torcida, sempre com você.','Copo personalizado e resistente.','/products/copo-tubaroes.jpg',10,20,5,'TUVV-COPO-01',42,10,true,true,false,90),
  ('tirante-rei-dos-mares','Tirante Rei dos Mares','tirante-tubaroes-rei-dos-mares','Seu crachá com a identidade do cardume.','Tirante estampado com mosquetão metálico.','/products/tirante-rei-dos-mares.jpg',10,15,4,'TUVV-TIR-RM',35,8,true,true,false,45),
  ('tirante-invasao','Tirante Invasão à Praia','tirante-tubaroes-invasao-a-praia','Um clássico para quem fecha com a atlética.','Tirante de poliéster com impressão de alta definição.','/products/tirante-invasao.jpg',10,15,4,'TUVV-TIR-IP',28,8,true,false,false,45),
  ('tirante-grande','Tirante Grande Tubarões','tirante-grande-tubaroes','Mais presença e conforto no campus.','Tirante largo, resistente e confortável.','/products/tirante-grande.jpg',10,15,4.5,'TUVV-TIR-GR',31,8,true,false,false,55),
  ('baby-look-branca','Baby look Shark Branca','camisa-baby-look-shark-branca','Modelagem ajustada e visual leve.','Baby look em algodão macio.','/products/baby-look-branca.jpg',49.90,null,24,'TUVV-BL-BR',12,5,true,false,true,200),
  ('camisa-si-preta','Camisa Sistemas de Informação Preta','camisa-sistemas-de-informacao-preta','A camisa de quem transforma informação.','Camiseta universitária em algodão.','/products/camisa-si-preta.jpg',54.90,null,26,'TUVV-SI-PT',15,5,true,false,false,220),
  ('camisa-cc-preta','Camisa Ciência da Computação Preta','camisa-ciencia-da-computacao-preta','Código, café e Tubarões.','Camiseta preta em malha confortável.','/products/camisa-cc-preta.jpg',54.90,null,26,'TUVV-CC-PT',8,5,true,false,false,220);

insert into product_categories (product_id, category_id)
select p.id, c.id from products p join categories c on c.slug = case when p.id like 'tirante-%' then 'tirantes' when p.id = 'copo-tubaroes' then 'acessorios' else 'roupas' end;
insert into product_images (product_id,url,alt_text,is_primary)
select id, main_image_url, name, true from products;

insert into product_options (product_id,name,required,sort_order)
select id,'Tamanho',true,1 from products where id in ('camisa-i-2025','camiseta-cc-azul','baby-look-branca','camisa-si-preta','camisa-cc-preta');
insert into product_option_values (option_id,value,sort_order)
select po.id,v.value,v.sort_order from product_options po cross join (values ('PP',1),('P',2),('M',3),('G',4),('GG',5),('XGG',6)) as v(value,sort_order) where po.name='Tamanho';
insert into product_options (product_id,name,required,sort_order) values ('camiseta-cc-azul','Modelo',true,2);
insert into product_option_values (option_id,value,sort_order)
select id,'Tradicional',1 from product_options where product_id='camiseta-cc-azul' and name='Modelo'
union all select id,'Baby look',2 from product_options where product_id='camiseta-cc-azul' and name='Modelo';

insert into shipping_methods (name,type,description,price,pickup_location,pickup_hours,sort_order) values
  ('Retirada na UVV','pickup','Retirada combinada no campus.',0,'Campus UVV — Vila Velha','Conforme combinado pelo WhatsApp',1),
  ('Entrega local','local_delivery','Entrega em regiões atendidas de Vila Velha.',8,null,null,2),
  ('Envio para endereço','shipping','Envio nacional com rastreamento.',18,null,null,3);

insert into coupons (code,type,value,minimum_order,per_customer_limit,active) values ('BEMVINDO10','percentage',10,0,1,true);
insert into store_settings (key,value,is_public) values
  ('identity','{"primary":"#00162f","accent":"#0a87f5","logo":"/assets/logo-tubaroes.png","favicon":"/favicon.ico"}',true),
  ('contact','{"whatsapp":"5527999999999","email":"contato@tubaroesuvv.com.br","instagram":"tubaroesuvv"}',true),
  ('seo','{"title":"Tubarões UVV | Loja Oficial","description":"Vista a força do cardume."}',true);
insert into homepage_sections (type,title,content,sort_order) values
  ('hero','Vista a força do cardume','{"eyebrow":"Loja oficial da atlética","cta":"Explorar a loja","href":"/produtos","image":"/assets/hero-ocean.png"}',1),
  ('categories','Compre por categoria','{}',2), ('featured_products','Destaques do cardume','{"limit":4}',3),
  ('benefits','Compra segura e retirada na UVV','{}',4), ('faq','Perguntas frequentes','{}',5);
