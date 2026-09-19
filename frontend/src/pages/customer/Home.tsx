import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import type { Business } from '../../types';

const CATEGORIES = ['All', 'Salon', 'Clinic', 'Auto Repair', 'Tutoring', 'Fitness', 'Other'];

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, [category]);

  async function loadBusinesses() {
    setLoading(true);
    let query = supabase.from('businesses').select('*').eq('status', 'active');
    if (category !== 'All') query = query.eq('category', category);

    const { data } = await query.order('created_at', { ascending: false });
    setBusinesses((data as Business[]) ?? []);
    setLoading(false);
  }

  const filtered = businesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-4xl text-navy">Bookly</h1>
        <p className="mt-2 text-slate">Book local services in a few taps.</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search businesses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  category === c ? 'bg-navy text-white' : 'bg-white text-slate hover:bg-navy/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {loading && <p className="text-slate">Loading businesses…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-slate">No businesses found yet — check back soon.</p>
          )}
          {filtered.map((b) => (
            <Link
              key={b.id}
              to={`/business/${b.id}`}
              className="rounded-lg bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-medium text-navy">{b.name}</h2>
                <span className="rounded-full bg-orange-light px-2 py-0.5 text-xs font-medium text-orange-dark">
                  {b.category}
                </span>
              </div>
              {b.location && <p className="mt-1 text-sm text-slate">{b.location}</p>}
              {b.description && <p className="mt-2 line-clamp-2 text-sm text-slate">{b.description}</p>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
