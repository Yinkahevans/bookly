import { useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

type Role = 'customer' | 'business_owner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

export default function SignUp() {
  const { role } = useParams<{ role: Role }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusinessOwner = role === 'business_owner';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (role !== 'customer' && role !== 'business_owner') {
      setError('Invalid sign-up link — please start again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError || !data.session) {
      setSubmitting(false);
      setError(signUpError?.message ?? 'Could not create your account. Check your email and try again.');
      return;
    }

    const res = await fetch(`${BACKEND_URL}/auth/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({ role }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Account created, but we could not set your role. Try logging in.');
      return;
    }

    await supabase.auth.refreshSession();

    navigate(isBusinessOwner ? '/dashboard/onboarding' : '/');
  }

  if (role !== 'customer' && role !== 'business_owner') {
    return (
      <main className="min-h-screen bg-cream px-6 py-10 text-center">
        <p className="text-slate">
          That sign-up link isn't valid.{' '}
          <a href="/signup" className="font-medium text-orange hover:underline">
            Start over
          </a>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-sm">
        <h1 className="font-display text-3xl text-navy">
          {isBusinessOwner ? 'Set up your business account' : 'Create your account'}
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-navy/20 bg-white px-3 py-2 text-slate focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-orange px-4 py-2.5 font-medium text-white transition hover:bg-orange-dark disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
      </div>
    </main>
  );
}
