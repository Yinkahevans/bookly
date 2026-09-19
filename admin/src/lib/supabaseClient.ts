import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// The admin app only uses this client for admin login (Supabase Auth).
// All privileged reads/writes (approving businesses, viewing all bookings) go
// through `backend`, which uses the Supabase service-role key server-side —
// that key must never reach this browser app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
