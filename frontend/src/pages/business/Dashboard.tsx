import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { Business } from '../../types';

export default function Dashboard() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate('/login');
      return;
    }

    supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          navigate('/dashboard/onboarding');
          return;
        }
        setBusiness(data as Business);
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
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-navy">{business?.name}</h1>
            <p className="mt-1 text-slate">{business?.category}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              business?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : business?.status === 'suspended'
                ? 'bg-red-100 text-red-800'
                : 'bg-orange-light text-orange-dark'
            }`}
          >
            {business?.status}
          </span>
        </div>

        {business?.status === 'pending' && (
          <p className="mt-4 rounded-md bg-white p-4 text-sm text-slate shadow-sm">
            Your business is awaiting approval. You can still set up your services and
            availability now — customers will be able to book once it's approved.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/dashboard/services" className="rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md">
            <h2 className="font-medium text-navy">Services</h2>
            <p className="mt-1 text-sm text-slate">Add what you offer and set pricing.</p>
          </Link>
          <Link to="/dashboard/availability" className="rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md">
            <h2 className="font-medium text-navy">Availability</h2>
            <p className="mt-1 text-sm text-slate">Set your weekly hours.</p>
          </Link>
          <Link to="/dashboard/bookings" className="rounded-lg bg-white p-6 shadow-sm transition hover:shadow-md">
            <h2 className="font-medium text-navy">Bookings</h2>
            <p className="mt-1 text-sm text-slate">View and manage bookings.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
