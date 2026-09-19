import { supabaseAdmin } from '../config/supabase';
import { sendBookingReminderEmail } from './email.service';

const REMINDER_HOURS_BEFORE = Number(process.env.REMINDER_HOURS_BEFORE ?? 24);

// Finds confirmed bookings starting within the reminder window that haven't been
// reminded yet, sends the reminder email, and marks them so we don't double-send.
// Requires a `reminder_sent_at` (nullable timestamp) column on `bookings` — see
// supabase/migrations for the exact schema.
export async function runReminderSweep() {
  const windowStart = new Date();
  const windowEnd = new Date(Date.now() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000);

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('id, start_time, guest_name, guest_email, customer_id, service:services(name), business:businesses(name)')
    .eq('status', 'confirmed')
    .is('reminder_sent_at', null)
    .gte('start_time', windowStart.toISOString())
    .lte('start_time', windowEnd.toISOString());

  if (error) {
    console.error('[reminder sweep] failed to fetch bookings', error);
    return;
  }

  for (const booking of bookings ?? []) {
    // TODO: resolve customer email from `customers` table when customer_id is set
    const to = booking.guest_email;
    if (!to) continue;

    await sendBookingReminderEmail({
      to,
      customerName: booking.guest_name ?? 'there',
      businessName: (booking as any).business?.name ?? 'your business',
      serviceName: (booking as any).service?.name ?? 'your appointment',
      startTime: booking.start_time,
    });

    await supabaseAdmin
      .from('bookings')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', booking.id);
  }
}
