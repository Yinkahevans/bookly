import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { BookingStatus } from '../../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

interface BookingRow {
  id: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  service: { name: string } | null;
}

const TABS: Array<BookingStatus | 'all'> = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];

export default function Bookings() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BookingStatus | 'all'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate('/login');
      return;
    }
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, tab]);

  async function loadBookings() {
    if (!session) return;
    setLoading(true);
    setError(null);

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

    let query = supabase
      .from('bookings')
      .select('id, start_time, end_time, status, guest_name, guest_email, guest_phone, service:services(name)')
      .eq('business_id', business.id)
      .order('start_time', { ascending: true });

    if (tab !== 'all') query = query.eq('status', tab);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setBookings((data as unknown as BookingRow[]) ?? []);
    }
    setLoading(false);
  }

  async function updateStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
    if (!session) return;
    setUpdatingId(bookingId);
    setError(null);

    const res = await fetch(`${BACKEND_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ status }),
    });

    setUpdatingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to update booking.');
      return;
    }

    loadBookings();
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
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="text-sm text-orange hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 font-display text-3xl text-navy">Bookings</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                tab === t ? 'bg-navy text-white' : 'bg-white text-slate hover:bg-navy/10'
              }`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-3">
          {bookings.length === 0 && (
            <p className="rounded-md bg-white p-4 text-sm text-slate shadow-sm">
              No bookings in this view.
            </p>
          )}

          {bookings.map((b) => {
            const start = new Date(b.start_time);
            return (
              <div key={b.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-navy">{b.service?.name ?? 'Service'}</h3>
                    <p className="mt-1 text-sm text-slate">
                      {start.toLocaleDateString()} at{' '}
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      {b.guest_name} · {b.guest_email}
                      {b.guest_phone ? ` · ${b.guest_phone}` : ''}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : b.status === 'pending'
                        ? 'bg-orange-light text-orange-dark'
                        : b.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                {b.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      disabled={updatingId === b.id}
                      onClick={() => updateStatus(b.id, 'confirmed')}
                      className="rounded-md bg-orange px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-dark disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      disabled={updatingId === b.id}
                      onClick={() => updateStatus(b.id, 'cancelled')}
                      className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
