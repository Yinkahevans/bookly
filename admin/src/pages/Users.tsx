import { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function Users() {
  const { session, isAdmin, loading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !session) return;

    fetch(`${BACKEND_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Failed to load users.');
        }
        return res.json();
      })
      .then((body) => setUsers(body.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authLoading, session]);

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
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-navy">Users</h1>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
          {loading && <p className="p-4 text-slate">Loading…</p>}
          {!loading && users.length === 0 && (
            <p className="p-4 text-sm text-slate">No registered users yet.</p>
          )}
          {!loading && users.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="bg-navy/5 text-slate">
                <tr>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-navy/10">
                    <td className="px-4 py-2 text-navy">{u.email}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-navy text-white'
                            : u.role === 'business_owner'
                            ? 'bg-orange-light text-orange-dark'
                            : u.role === 'customer'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
