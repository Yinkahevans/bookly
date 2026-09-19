-- Optional sample data for local development / demoing the flows.
-- Run after 0001_init.sql and after creating at least one business_owner user in Supabase Auth.
-- Replace 'OWNER_USER_ID' with a real auth.users id before running.

-- insert into businesses (owner_id, name, category, description, location, phone, email, status)
-- values ('OWNER_USER_ID', 'Grace Hair Studio', 'Salon', 'Braids, weaves, natural hair care.', 'Navrongo, Ghana', '+233000000000', 'grace@example.com', 'active');

-- insert into services (business_id, name, description, duration_minutes, price, requires_approval)
-- select id, 'Box Braids', 'Medium box braids, shoulder length', 120, 150.00, false from businesses where name = 'Grace Hair Studio';
