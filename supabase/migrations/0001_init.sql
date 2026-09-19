-- Bookly — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push` if using the CLI).

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────

-- One row per business, owned by a Supabase Auth user (role = business_owner).
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  location text,
  phone text,
  email text,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now()
);

create index businesses_owner_id_idx on businesses(owner_id);
create index businesses_status_idx on businesses(status);
create index businesses_category_idx on businesses(category);

-- Services offered by a business. requires_approval drives the hybrid
-- auto-confirm / manual-approval booking flow.
create table services (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null default 30,
  price numeric(10, 2) not null default 0,
  requires_approval boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index services_business_id_idx on services(business_id);

-- Recurring weekly availability. service_id null = applies to the whole business.
create table availability (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index availability_business_id_idx on availability(business_id);

-- Optional richer customer profile, linked to a Supabase Auth user (role = customer).
create table customers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- Bookings support both guest checkout (customer_id null, guest_* filled)
-- and logged-in customers (customer_id set).
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  guest_name text,
  guest_email text,
  guest_phone text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),

  constraint guest_or_customer check (
    customer_id is not null or (guest_name is not null and guest_email is not null)
  )
);

create index bookings_business_id_idx on bookings(business_id);
create index bookings_customer_id_idx on bookings(customer_id);
create index bookings_start_time_idx on bookings(start_time);
create index bookings_status_idx on bookings(status);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table businesses enable row level security;
alter table services enable row level security;
alter table availability enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;

-- Helper: current user's role, read from auth.users.raw_app_meta_data.
-- Set this via Supabase Admin API / dashboard when a user signs up:
--   business owner → {"role": "business_owner"}
--   customer       → {"role": "customer"}
--   admin          → {"role": "admin"} (set manually for yourself)

-- BUSINESSES
create policy "Public can read active businesses"
  on businesses for select
  using (status = 'active');

create policy "Owners can read their own business regardless of status"
  on businesses for select
  using (owner_id = auth.uid());

create policy "Owners can insert their own business"
  on businesses for insert
  with check (owner_id = auth.uid());

create policy "Owners can update their own business"
  on businesses for update
  using (owner_id = auth.uid());

-- SERVICES
create policy "Public can read active services of active businesses"
  on services for select
  using (
    active = true
    and exists (select 1 from businesses b where b.id = business_id and b.status = 'active')
  );

create policy "Owners can manage their own services"
  on services for all
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

-- AVAILABILITY
create policy "Public can read availability of active businesses"
  on availability for select
  using (exists (select 1 from businesses b where b.id = business_id and b.status = 'active'));

create policy "Owners can manage their own availability"
  on availability for all
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

-- CUSTOMERS
create policy "Customers can read their own profile"
  on customers for select
  using (id = auth.uid());

create policy "Customers can update their own profile"
  on customers for update
  using (id = auth.uid());

create policy "Customers can insert their own profile"
  on customers for insert
  with check (id = auth.uid());

-- BOOKINGS
-- Guests bookings are created via the anon key with no session — allow inserts
-- where customer_id matches the caller (or is null, for guest checkout).
create policy "Anyone can create a booking as guest or as themselves"
  on bookings for insert
  with check (customer_id is null or customer_id = auth.uid());

create policy "Customers can read their own bookings"
  on bookings for select
  using (customer_id = auth.uid());

create policy "Owners can read bookings for their business"
  on bookings for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

create policy "Owners can update bookings for their business"
  on bookings for update
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

-- NOTE: the `backend` service uses the service-role key, which bypasses RLS
-- entirely — that's how the admin app gets platform-wide visibility without
-- needing a policy for the 'admin' role here.
