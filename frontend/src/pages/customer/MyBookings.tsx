import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { BookingStatus } from '../../types';

interface MyBookingRow {
  id: string;
  start_time: string;
  status: BookingStatus;
  business: { id: string; name: string } | null;
  service: { name: string } | null;
}

export default function MyBookings() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<MyBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate('/login');
      return;
    }

    supabase
      .from('bookings')
      .select('id, start_time, status, business:businesses(id, name), service:services(name)')
      .eq('customer_id', session.user.id)
      .order('start_time', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setBookings((data as unknown as MyBookingRow[]) ?? []);
        }
        setLoading(false);
      });
  }, [authLoading, session, navigate]);

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
        <h1 className="font-display text-3xl text-navy">My bookings</h1>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-3">
          {bookings.length === 0 && (
            <div className="rounded-md bg-white p-4 text-sm text-slate shadow-sm">
              <p>No bookings yet.</p>
              <p className="mt-2">
                Note: this only shows bookings made while logged in — bookings made as a guest
                before creating an account won't appear here.
              </p>
              <Link to="/" className="mt-3 inline-block font-medium text-orange hover:underline">
                Browse businesses →
              </Link>
            </div>
          )}

          {bookings.map((b) => {
            const start = new Date(b.start_time);
            return (
              <div key={b.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-navy">
                      {b.service?.name ?? 'Service'} · {b.business?.name ?? 'Business'}
                    </h3>
                    <p className="mt-1 text-sm text-slate">
                      {start.toLocaleDateString()} at{' '}
                      {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                {b.business && (
                  <Link
                    to={`/business/${b.business.id}`}
                    className="mt-2 inline-block text-sm text-orange hover:underline"
                  >
                    View business →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}