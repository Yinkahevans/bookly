import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { Availability, Booking, Business, Service } from '../../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

function toLocalDateString(d: Date) {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function BookingFlow() {
  const { businessId, serviceId } = useParams<{ businessId: string; serviceId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(toLocalDateString(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedStatus, setConfirmedStatus] = useState<'confirmed' | 'pending' | null>(null);

  useEffect(() => {
    if (!businessId || !serviceId) return;

    Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).single(),
      supabase.from('services').select('*').eq('id', serviceId).single(),
      supabase.from('availability').select('*').eq('business_id', businessId),
    ]).then(([businessRes, serviceRes, availabilityRes]) => {
      setBusiness(businessRes.data as Business);
      setService(serviceRes.data as Service);
      setAvailability((availabilityRes.data as Availability[]) ?? []);
      setLoading(false);
    });
  }, [businessId, serviceId]);

  useEffect(() => {
    if (!businessId) return;

    const dayStart = new Date(`${selectedDate}T00:00:00`);
    const dayEnd = new Date(`${selectedDate}T23:59:59`);

    supabase
      .from('booking_slots_public')
      .select('*')
      .eq('business_id', businessId)
      .gte('start_time', dayStart.toISOString())
      .lte('start_time', dayEnd.toISOString())
      .then(({ data }) => {
        setDayBookings((data as Booking[]) ?? []);
        setSelectedSlot(null);
      });
  }, [businessId, selectedDate]);

  const slots = useMemo(() => {
    if (!service) return [];

    const date = new Date(`${selectedDate}T00:00:00`);
    const dayOfWeek = date.getDay();
    const duration = service.duration_minutes;
    const now = new Date();

    const windows = availability.filter((a) => a.day_of_week === dayOfWeek);
    const candidates: string[] = [];

    for (const window of windows) {
      const [startH, startM] = window.start_time.split(':').map(Number);
      const [endH, endM] = window.end_time.split(':').map(Number);

      let cursor = new Date(date);
      cursor.setHours(startH, startM, 0, 0);
      const windowEnd = new Date(date);
      windowEnd.setHours(endH, endM, 0, 0);

      while (cursor.getTime() + duration * 60 * 1000 <= windowEnd.getTime()) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor.getTime() + duration * 60 * 1000);

        const isPast = slotStart < now;
        const isTaken = dayBookings.some((b) => {
          const bStart = new Date(b.start_time);
          const bEnd = new Date(b.end_time);
          return slotStart < bEnd && slotEnd > bStart;
        });

        if (!isPast && !isTaken) {
          candidates.push(
            `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`
          );
        }

        cursor = new Date(cursor.getTime() + duration * 60 * 1000);
      }
    }

    return candidates.sort();
  }, [availability, dayBookings, selectedDate, service]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!service || !business || !selectedSlot) return;

    setSubmitting(true);
    setError(null);

    const startTime = new Date(`${selectedDate}T${selectedSlot}:00`);
    const endTime = new Date(startTime.getTime() + service.duration_minutes * 60 * 1000);
    const status = service.requires_approval ? 'pending' : 'confirmed';

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        business_id: business.id,
        service_id: service.id,
        customer_id: session?.user.id ?? null,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status,
      })
      .select()
      .single();

    if (insertError || !booking) {
      setSubmitting(false);
      setError(insertError?.message ?? 'Could not create the booking.');
      return;
    }

    fetch(`${BACKEND_URL}/bookings/${booking.id}/notify`, { method: 'POST' }).catch(() => {});

    setSubmitting(false);
    setConfirmedStatus(status);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">Loading…</p>
      </main>
    );
  }

  if (!business || !service) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">Service not found.</p>
      </main>
    );
  }

  if (confirmedStatus) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <div className="mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-sm">
          <h1 className="font-display text-2xl text-navy">
            {confirmedStatus === 'confirmed' ? "You're booked!" : 'Request sent'}
          </h1>
          <p className="mt-2 text-slate">
            {confirmedStatus === 'confirmed'
              ? `Your ${service.name} at ${business.name} is confirmed for ${selectedDate} at ${selectedSlot}.`
              : `${business.name} needs to approve this request. We'll email you as soon as they respond.`}
          </p>
          <Link to="/" className="mt-6 inline-block font-medium text-orange hover:underline">
            Back to Bookly
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-lg">
        <Link to={`/business/${business.id}`} className="text-sm text-orange hover:underline">
          ← {business.name}
        </Link>
        <h1 className="mt-2 font-display text-3xl text-navy">{service.name}</h1>
        <p className="mt-1 text-slate">
          {service.duration_minutes} min · GH₵{service.price}
          {service.requires_approval && (
            <span className="ml-2 rounded-full bg-orange-light px-2 py-0.5 text-xs font-medium text-orange-dark">
              Requires approval
            </span>
          )}
        </p>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate">Date</label>
          <input
            type="date"
            value={selectedDate}
            min={toLocalDateString(new Date())}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
          />
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate">Available times</label>
          {slots.length === 0 ? (
            <p className="mt-2 text-sm text-slate">No open slots this day — try another date.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    selectedSlot === slot
                      ? 'bg-navy text-white'
                      : 'bg-white text-slate shadow-sm hover:bg-navy/10'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedSlot && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-lg bg-white p-5 shadow-sm">
            <h2 className="font-medium text-navy">Your details</h2>

            <div>
              <label className="block text-sm font-medium text-slate">Name</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate">Email</label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate">Phone (optional)</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-orange px-4 py-2.5 font-medium text-white transition hover:bg-orange-dark disabled:opacity-60"
            >
              {submitting
                ? 'Booking…'
                : service.requires_approval
                ? 'Request booking'
                : `Confirm for ${selectedSlot}`}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}