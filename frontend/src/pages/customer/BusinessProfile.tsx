import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { Business, Service } from '../../types';

export default function BusinessProfile() {
  const { businessId } = useParams<{ businessId: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).single(),
      supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('active', true)
        .order('created_at', { ascending: true }),
    ]).then(([businessRes, servicesRes]) => {
      setBusiness(businessRes.data as Business);
      setServices((servicesRes.data as Service[]) ?? []);
      setLoading(false);
    });
  }, [businessId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">Loading…</p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">Business not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="text-sm text-orange hover:underline">
          ← All businesses
        </Link>

        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl text-navy">{business.name}</h1>
            <p className="mt-1 text-slate">{business.category}</p>
          </div>
        </div>

        {business.location && <p className="mt-2 text-sm text-slate">📍 {business.location}</p>}
        {business.description && <p className="mt-4 text-slate">{business.description}</p>}

        <h2 className="mt-8 font-medium text-navy">Services</h2>
        <div className="mt-3 space-y-3">
          {services.length === 0 && (
            <p className="rounded-md bg-white p-4 text-sm text-slate shadow-sm">
              No services listed yet.
            </p>
          )}
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
              <div>
                <h3 className="font-medium text-navy">{s.name}</h3>
                {s.description && <p className="mt-1 text-sm text-slate">{s.description}</p>}
                <p className="mt-1 text-sm text-slate">
                  {s.duration_minutes} min · GH₵{s.price}
                  {s.requires_approval && (
                    <span className="ml-2 rounded-full bg-orange-light px-2 py-0.5 text-xs font-medium text-orange-dark">
                      Requires approval
                    </span>
                  )}
                </p>
              </div>
              <Link
                to={`/business/${business.id}/book/${s.id}`}
                className="rounded-md bg-orange px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-dark"
              >
                Book
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}