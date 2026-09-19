import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

export async function getStats(_req: Request, res: Response) {
  const [{ count: businessCount }, { count: pendingCount }, { count: bookingCount }] = await Promise.all([
    supabaseAdmin.from('businesses').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('bookings').select('*', { count: 'exact', head: true }),
  ]);

  res.json({
    totalBusinesses: businessCount ?? 0,
    pendingBusinesses: pendingCount ?? 0,
    totalBookings: bookingCount ?? 0,
  });
}

export async function listBusinesses(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  let query = supabaseAdmin.from('businesses').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ businesses: data });
}

export async function updateBusinessStatus(req: Request, res: Response) {
  const { businessId } = req.params;
  const { status } = req.body as { status: 'pending' | 'active' | 'suspended' };

  if (!['pending', 'active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const { data, error } = await supabaseAdmin
    .from('businesses')
    .update({ status })
    .eq('id', businessId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ business: data });
}

export async function listBookings(req: Request, res: Response) {
  const { businessId, status } = req.query as { businessId?: string; status?: string };
  let query = supabaseAdmin
    .from('bookings')
    .select('*, business:businesses(name), service:services(name)')
    .order('start_time', { ascending: false });

  if (businessId) query = query.eq('business_id', businessId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ bookings: data });
}
export async function listUsers(_req: Request, res: Response) {
  // auth.admin.listUsers only works with the service-role client — never exposed to a browser.
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return res.status(500).json({ error: error.message });

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    role: (u.app_metadata as any)?.role ?? 'unassigned',
    created_at: u.created_at,
  }));

  res.json({ users });
}
export async function getSettings(_req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('auto_approve_businesses')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ settings: data });
}

export async function updateSettings(req: Request, res: Response) {
  const { auto_approve_businesses } = req.body as { auto_approve_businesses: boolean };

  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .update({ auto_approve_businesses, updated_at: new Date().toISOString() })
    .eq('id', true)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ settings: data });
}