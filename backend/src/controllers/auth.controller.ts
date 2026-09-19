import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

const ALLOWED_SELF_SERVE_ROLES = ['customer', 'business_owner'] as const;
type SelfServeRole = (typeof ALLOWED_SELF_SERVE_ROLES)[number];

// Called right after a user signs up on the frontend. The client can only ever
// request 'customer' or 'business_owner' here — 'admin' is never settable through
// this endpoint, only manually via the Supabase dashboard, to prevent privilege escalation.
export async function setRole(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { role } = req.body as { role: SelfServeRole };

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  if (!ALLOWED_SELF_SERVE_ROLES.includes(role)) {
    return res.status(400).json({ error: 'role must be customer or business_owner' });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
    app_metadata: { role },
  });

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  if (role === 'customer' && userData.user.email) {
    await supabaseAdmin.from('customers').upsert({
      id: userData.user.id,
      email: userData.user.email,
    });

    // Link any past guest bookings made with this same email to the new account,
    // so they show up in My Bookings retroactively. Only touches rows that are
    // still unlinked (customer_id is null) — never overwrites an existing link.
    await supabaseAdmin
      .from('bookings')
      .update({ customer_id: userData.user.id })
      .eq('guest_email', userData.user.email)
      .is('customer_id', null);
  }

  res.json({ ok: true, role });
}