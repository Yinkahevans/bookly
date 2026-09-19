import { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

export default function Settings() {
  const { session, isAdmin, loading: authLoading } = useAdminAuth();
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authLoading || !session) return;

    fetch(`${BACKEND_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to load settings.');
        }
        return res.json();
      })
      .then((body) => setAutoApprove(body.settings.auto_approve_businesses))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, session]);

  async function handleToggle() {
    if (!session) return;
    const next = !autoApprove;
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`${BACKEND_URL}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ auto_approve_businesses: next }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Failed to save setting.');
      return;
    }

    setAutoApprove(next);
    setSaved(true);
  }

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
        <p className="text-slate">You need an admin account to view this page.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-navy">Settings</h1>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-medium text-navy">Auto-approve new businesses</h2>
              <p className="mt-1 text-sm text-slate">
                When on, a business goes live immediately after onboarding instead of
                waiting for you to approve it from the Businesses page.
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`relative h-6 w-11 flex-shrink-0 rounded-full transition disabled:opacity-60 ${
                autoApprove ? 'bg-orange' : 'bg-navy/20'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                  autoApprove ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          {saved && <p className="mt-3 text-sm text-green-700">Saved.</p>}
        </div>
      </div>
    </main>
  );
}