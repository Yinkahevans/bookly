import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Service-role client — full DB access, bypasses RLS. Never expose this key to any frontend.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
