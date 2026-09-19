import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { Service } from '../../types';

export default function Services() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate('/login');
      return;
    }
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session]);

  async function loadServices() {
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

    const { data: serviceRows, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setServices(serviceRows as Service[]);
    }
    setLoading(false);
  }

  async function handleAddService(e: FormEvent) {
    e.preventDefault();
    if (!businessId) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('services').insert({
      business_id: businessId,
      name,
      description: description || null,
      duration_minutes: duration,
      price: Number(price) || 0,
      requires_approval: requiresApproval,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName('');
    setDescription('');
    setDuration(30);
    setPrice('');
    setRequiresApproval(false);
    loadServices();
  }

  async function toggleActive(service: Service) {
    await supabase.from('services').update({ active: !service.active }).eq('id', service.id);
    loadServices();
  }

  async function toggleRequiresApproval(service: Service) {
    await supabase
      .from('services')
      .update({ requires_approval: !service.requires_approval })
      .eq('id', service.id);
    loadServices();
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
        <h1 className="mt-2 font-display text-3xl text-navy">Services</h1>
        <p className="mt-1 text-slate">What you offer, priced and timed.</p>

        <div className="mt-6 space-y-3">
          {services.length === 0 && (
            <p className="rounded-md bg-white p-4 text-sm text-slate shadow-sm">
              No services yet — add your first one below.
            </p>
          )}

          {services.map((s) => (
            <div key={s.id} className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-navy">{s.name}</h3>
                  {s.description && <p className="mt-1 text-sm text-slate">{s.description}</p>}
                  <p className="mt-1 text-sm text-slate">
                    {s.duration_minutes} min · GHS {s.price}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {s.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate">
                  <input
                    type="checkbox"
                    checked={s.requires_approval}
                    onChange={() => toggleRequiresApproval(s)}
                    className="h-4 w-4 rounded border-navy/30 text-orange focus:ring-orange"
                  />
                  Requires approval before confirming
                </label>
                <button
                  onClick={() => toggleActive(s)}
                  className="ml-auto font-medium text-orange hover:underline"
                >
                  {s.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddService} className="mt-8 space-y-4 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-medium text-navy">Add a service</h2>

          <div>
            <label className="block text-sm font-medium text-slate">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              placeholder="Box Braids"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate">Duration (minutes)</label>
              <input
                type="number"
                min={5}
                step={5}
                required
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate">Price (GHS)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="h-4 w-4 rounded border-navy/30 text-orange focus:ring-orange"
            />
            Require my approval before confirming bookings for this service
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-orange px-4 py-2.5 font-medium text-white transition hover:bg-orange-dark disabled:opacity-60"
          >
            {submitting ? 'Adding…' : 'Add service'}
          </button>
        </form>
      </div>
    </main>
  );
}