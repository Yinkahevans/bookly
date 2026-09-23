import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

interface Stats {
  totalBusinesses: number;
  pendingBusinesses: number;
  totalBookings: number;
}

export default function Dashboard() {
  const { session, isAdmin, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate('/login');
      return;
    }

    fetch(`${BACKEND_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to load stats.');
        }
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, session, navigate]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">Loading…</p>
      </main>
    );
  }

  if (!session || !isAdmin) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">
          You need an admin account to view this page.{' '}
          <Link to="/login" className="font-medium text-orange hover:underline">
            Log in
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold text-navy">Platform overview</h1>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {stats && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <p className="text-sm text-slate">Total businesses</p>
              <p className="mt-1 text-3xl font-semibold text-navy">{stats.totalBusinesses}</p>
            </div>
            <Link to="/businesses" className="rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md">
              <p className="text-sm text-slate">Pending approval</p>
              <p className="mt-1 text-3xl font-semibold text-orange">{stats.pendingBusinesses}</p>
            </Link>
            <Link to="/bookings" className="rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md">
              <p className="text-sm text-slate">Total bookings</p>
              <p className="mt-1 text-3xl font-semibold text-navy">{stats.totalBookings}</p>
            </Link>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <Link to="/businesses" className="font-medium text-orange hover:underline">
            Manage businesses →
          </Link>
          <Link to="/bookings" className="font-medium text-orange hover:underline">
            View all bookings →
          </Link>
        </div>
      </div>
    </main>
  );
}