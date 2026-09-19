import { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';
import type { Business } from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

const STATUS_FILTERS: Array<Business['status'] | 'all'> = ['all', 'pending', 'active', 'suspended'];

export default function Businesses() {
  const { session, isAdmin, loading: authLoading } = useAdminAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Business['status'] | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !session) return;
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, filter]);

  async function loadBusinesses() {
    if (!session) return;
    setLoading(true);
    setError(null);

    const url = new URL(`${BACKEND_URL}/admin/businesses`);
    if (filter !== 'all') url.searchParams.set('status', filter);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to load businesses.');
      setLoading(false);
      return;
    }

    const body = await res.json();
    setBusinesses(body.businesses);
    setLoading(false);
  }

  async function updateStatus(businessId: string, status: Business['status']) {
    if (!session) return;
    setUpdatingId(businessId);

    const res = await fetch(`${BACKEND_URL}/admin/businesses/${businessId}/status`, {
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
      setError(body.error ?? 'Failed to update status.');
      return;
    }

    loadBusinesses();
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
        <h1 className="text-2xl font-semibold text-navy">Businesses</h1>

        <div className="mt-4 flex gap-2">
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

        <div className="mt-6 space-y-3">
          {loading && <p className="text-slate">Loading…</p>}
          {!loading && businesses.length === 0 && (
            <p className="rounded-md bg-white p-4 text-sm text-slate shadow-sm">
              No businesses match this filter.
            </p>
          )}

          {businesses.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-navy">{b.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : b.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-light text-orange-dark'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate">
                  {b.category}
                  {b.location ? ` · ${b.location}` : ''}
                </p>
              </div>

              <div className="flex gap-2">
                {b.status !== 'active' && (
                  <button
                    disabled={updatingId === b.id}
                    onClick={() => updateStatus(b.id, 'active')}
                    className="rounded-md bg-orange px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-dark disabled:opacity-60"
                  >
                    Approve
                  </button>
                )}
                {b.status !== 'suspended' && (
                  <button
                    disabled={updatingId === b.id}
                    onClick={() => updateStatus(b.id, 'suspended')}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    Suspend
                  </button>
                )}
                {b.status === 'suspended' && (
                  <button
                    disabled={updatingId === b.id}
                    onClick={() => updateStatus(b.id, 'pending')}
                    className="rounded-md border border-navy/20 px-3 py-1.5 text-sm font-medium text-slate transition hover:bg-navy/5 disabled:opacity-60"
                  >
                    Reset to pending
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
