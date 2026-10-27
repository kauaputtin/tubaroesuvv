-- Atualiza o WhatsApp de contato da loja para bancos já criados.
update store_settings
set value = jsonb_set(value, '{whatsapp}', '"5527997666427"')
where key = 'contact'
  and value->>'whatsapp' = '5527999999999';
