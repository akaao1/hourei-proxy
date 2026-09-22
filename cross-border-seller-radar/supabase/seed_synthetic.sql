-- SYNTHETIC-ONLY PILOT DATA.
-- Never count these rows toward the commercial 10/5/3/1/action gate.

insert into public.sellers (alias)
values ('Northstar Home Goods (Synthetic)')
on conflict (alias) do nothing;

insert into public.sources (seller_id, url, label, enabled)
select id,
       'https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Certificates',
       'CPSC Business Guidance — Certificates',
       true
from public.sellers
where alias = 'Northstar Home Goods (Synthetic)'
on conflict (seller_id, url) do nothing;

insert into public.skus (seller_id, sku, product_name, destination, hs_code, category, matching_terms)
select s.id, x.sku, x.product_name, 'US', x.hs_code, x.category, x.matching_terms
from public.sellers s
cross join (values
  ('NS-LAMP-001','LED Desk Lamp 12W','9405.20','lighting',array['led desk lamp','desk lamp','12w lamp','ns-lamp-001']::text[]),
  ('NS-USB-002','USB-C 65W Power Adapter','8504.40','power adapter',array['usb-c 65w','power adapter','usb c adapter','ns-usb-002']::text[]),
  ('NS-HOME-003','Rechargeable Household Fan','8414.59','small appliance',array['rechargeable fan','household fan','portable fan','ns-home-003']::text[])
) as x(sku,product_name,hs_code,category,matching_terms)
on s.alias = 'Northstar Home Goods (Synthetic)'
on conflict (seller_id, sku) do nothing;
