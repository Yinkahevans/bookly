import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Salon', 'Clinic', 'Auto Repair', 'Tutoring', 'Fitness', 'Other'];

export default function Onboarding() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [checkingExisting, setCheckingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      navigate('/login');
      return;
    }

    supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          navigate('/dashboard');
        } else {
          setCheckingExisting(false);
        }
      });
  }, [authLoading, session, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session) return;

    setSubmitting(true);
    setError(null);

    const { data: settings } = await supabase
      .from('platform_settings')
      .select('auto_approve_businesses')
      .single();

    const { error: insertError } = await supabase.from('businesses').insert({
      owner_id: session.user.id,
      name,
      category,
      description: description || null,
      location: location || null,
      phone: phone || null,
      email: email || null,
      status: settings?.auto_approve_businesses ? 'active' : 'pending',
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    navigate('/dashboard');
  }

  if (authLoading || checkingExisting) {
    return (
      <main className="min-h-screen bg-cream px-6 py-10">
        <p className="text-slate">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="font-display text-3xl text-navy">Set up your business</h1>
        <p className="mt-2 text-slate">
          This is what customers will see. You can edit it any time from your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate">Business name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              placeholder="Grace Hair Studio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              placeholder="What do you offer, what makes you different?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              placeholder="Navrongo, Ghana"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
                placeholder="+233…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate">Contact email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
                placeholder="bookings you'll be notified on"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-orange px-4 py-2.5 font-medium text-white transition hover:bg-orange-dark disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create business'}
          </button>
        </form>
      </div>
    </main>
  );
}