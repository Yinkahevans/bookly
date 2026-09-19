# Supabase

1. Create a project at supabase.com.
2. Open the SQL editor, paste and run `migrations/0001_init.sql`.
3. (Optional) Fill in and run `seed.sql` for sample data.
4. Grab your Project URL + anon key (for `frontend`/`admin`) and your service-role key (for `backend`) from Project Settings → API.
5. After a user signs up, set their role via the Supabase dashboard (Authentication → Users → edit `app_metadata`) or via the Admin API:
   `{ "role": "business_owner" }`, `{ "role": "customer" }`, or `{ "role": "admin" }`.
