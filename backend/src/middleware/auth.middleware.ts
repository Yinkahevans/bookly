import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Verifies the bearer token belongs to a Supabase user with role = 'admin'.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  if (data.user.app_metadata?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

// Verifies the bearer token belongs to the business_owner who owns the
// business a given :bookingId belongs to.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      bookingBusinessId?: string;
    }
  }
}

export async function requireBookingOwner(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { bookingId } = req.params;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, business_id, business:businesses(owner_id)')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const ownerId = (booking.business as any)?.owner_id;
  if (ownerId !== userData.user.id) {
    return res.status(403).json({ error: 'You do not own this booking' });
  }

  req.bookingBusinessId = booking.business_id;
  next();
}
