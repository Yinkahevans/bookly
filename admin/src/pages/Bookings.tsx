import { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

interface AdminBookingRow {
  id: string;
  start_time: string;
  status: BookingStatus;
  guest_name: string | null;
  guest_email: string | null;
  business: { name: string } | null;
  service: { name: string } | null;
}

const STATUS_FILTERS: Array<BookingStatus | 'all'> = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];

export default function Bookings() {
  const { session, isAdmin, loading: authLoading } = useAdminAuth();
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !session) return;
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, filter]);

  async function loadBookings() {
    if (!session) return;
    setLoading(true);
    setError(null);

    const url = new URL(`${BACKEND_URL}/admin/bookings`);
    if (filter !== 'all') url.searchParams.set('status', filter);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to load bookings.');
      setLoading(false);
      return;
    }

    const body = await res.json();
    setBookings(body.bookings);
    setLoading(false);
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">Loading…</p>
      </main>
    );
  }

  if (!session || !isAdmin) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">You need an admin account to view this page.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-navy">All bookings</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                filter === s ? 'bg-navy text-white' : 'bg-white text-slate hover:bg-navy/10'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
          {loading && <p className="p-4 text-slate">Loading…</p>}
          {!loading && bookings.length === 0 && (
            <p className="p-4 text-sm text-slate">No bookings match this filter.</p>
          )}
          {!loading && bookings.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="bg-navy/5 text-slate">
                <tr>
                  <th className="px-4 py-2 font-medium">Business</th>
                  <th className="px-4 py-2 font-medium">Service</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-navy/10">
                    <td className="px-4 py-2 text-navy">{b.business?.name ?? '—'}</td>
                    <td className="px-4 py-2 text-slate">{b.service?.name ?? '—'}</td>
                    <td className="px-4 py-2 text-slate">{b.guest_name ?? '—'}</td>
                    <td className="px-4 py-2 text-slate">
                      {new Date(b.start_time).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-4 py-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
