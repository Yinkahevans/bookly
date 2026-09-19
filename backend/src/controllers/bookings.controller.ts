import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import {
  sendBookingConfirmedEmail,
  sendBookingPendingEmail,
  sendNewBookingRequestEmail,
} from '../services/email.service';

// Called by the frontend right after a booking row is inserted by the client
// (via Supabase directly, using the customer's own session). This endpoint
// just handles the side effect: sending the right email based on the
// service's requires_approval flag.
export async function notifyNewBooking(req: Request, res: Response) {
  const { bookingId } = req.params;

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select(
      'id, status, start_time, guest_name, guest_email, service:services(name, requires_approval), business:businesses(name, email)'
    )
    .eq('id', bookingId)
    .single();

  if (error || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  const service = booking.service as any;
  const business = booking.business as any;
  const emailParams = {
    to: booking.guest_email as string,
    customerName: (booking.guest_name as string) ?? 'there',
    businessName: business?.name ?? 'the business',
    serviceName: service?.name ?? 'your service',
    startTime: booking.start_time as string,
  };

  if (booking.status === 'confirmed') {
    await sendBookingConfirmedEmail(emailParams);
  } else if (booking.status === 'pending') {
    await sendBookingPendingEmail(emailParams);
    if (business?.email) {
      await sendNewBookingRequestEmail(business.email, emailParams);
    }
  }

  res.json({ ok: true });
}

// Business owner approves/declines a pending booking from their dashboard.
export async function updateBookingStatus(req: Request, res: Response) {
  const { bookingId } = req.params;
  const { status } = req.body as { status: 'confirmed' | 'cancelled' };

  if (!['confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'status must be confirmed or cancelled' });
  }

  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select(
      'id, status, start_time, guest_name, guest_email, service:services(name), business:businesses(name)'
    )
    .single();

  if (error || !booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  if (status === 'confirmed') {
    const service = booking.service as any;
    const business = booking.business as any;
    await sendBookingConfirmedEmail({
      to: booking.guest_email as string,
      customerName: (booking.guest_name as string) ?? 'there',
      businessName: business?.name ?? 'the business',
      serviceName: service?.name ?? 'your service',
      startTime: booking.start_time as string,
    });
  }

  res.json({ booking });
}
