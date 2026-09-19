import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { Availability as AvailabilitySlot } from '../../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Availability() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate('/login');
      return;
    }
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session]);

  async function loadAvailability() {
    if (!session) return;
    setLoading(true);

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', session.user.id)
      .maybeSingle();

    if (!business) {
      navigate('/dashboard/onboarding');
      return;
    }

    setBusinessId(business.id);

    const { data: rows, error: fetchError } = await supabase
      .from('availability')
      .select('*')
      .eq('business_id', business.id)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setSlots(rows as AvailabilitySlot[]);
    }
    setLoading(false);
  }

  async function handleAddSlot(e: FormEvent) {
    e.preventDefault();
    if (!businessId || submitting) return; // guard: ignore a second submit while one is in flight

    if (startTime >= endTime) {
      setError('Start time must be before end time.');
      return;
    }

    // Reject exact duplicates or overlapping ranges on the same day, checked
    // against what's already loaded in state (avoids a race with a second insert).
    const overlaps = slots.some(
      (s) =>
        s.day_of_week === dayOfWeek &&
        startTime < s.end_time.slice(0, 5) &&
        endTime > s.start_time.slice(0, 5)
    );
    if (overlaps) {
      setError('That time range overlaps with an existing slot on this day.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('availability').insert({
      business_id: businessId,
      service_id: null,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    loadAvailability();
  }

  async function removeSlot(id: string) {
    await supabase.from('availability').delete().eq('id', id);
    loadAvailability();
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard" className="text-sm text-orange hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 font-display text-3xl text-navy">Availability</h1>
        <p className="mt-1 text-slate">
          Set the hours customers can book you. These apply across all your services for now.
        </p>

        <div className="mt-6 space-y-2">
          {DAYS.map((dayName, dayIndex) => {
            const daySlots = slots.filter((s) => s.day_of_week === dayIndex);
            return (
              <div key={dayIndex} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-navy">{dayName}</h3>
                  {daySlots.length === 0 && <span className="text-sm text-slate">Closed</span>}
                </div>
                {daySlots.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {daySlots.map((s) => (
                      <li key={s.id} className="flex items-center justify-between text-sm text-slate">
                        <span>
                          {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                        </span>
                        <button onClick={() => removeSlot(s.id)} className="text-orange hover:underline">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddSlot} className="mt-8 space-y-4 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-medium text-navy">Add a time slot</h2>

          <div>
            <label className="block text-sm font-medium text-slate">Day</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate">Start time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate">End time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-orange px-4 py-2.5 font-medium text-white transition hover:bg-orange-dark disabled:opacity-60"
          >
            {submitting ? 'Adding…' : 'Add slot'}
          </button>
        </form>
      </div>
    </main>
  );
}