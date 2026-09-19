import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (signInError || !data.session) {
      setError(signInError?.message ?? 'Could not log in.');
      return;
    }

    const role = data.session.user.app_metadata.role;
    if (role === 'business_owner') {
      navigate('/dashboard/onboarding');
    } else {
      navigate('/');
    }
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-sm">
        <h1 className="font-display text-3xl text-navy">Log in</h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate">
          Don't have an account?{' '}
          <a href="/signup" className="font-medium text-orange hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}