import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAdminAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Overview', end: true },
  { to: '/businesses', label: 'Businesses' },
  { to: '/bookings', label: 'Bookings' },
  { to: '/users', label: 'Users' },
  { to: '/settings', label: 'Settings' },
];

export default function Nav() {
  const { session } = useAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <header className="border-b border-navy/10 bg-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <span className="font-display text-xl text-navy">Bookly Admin</span>

        {session ? (
          <div className="flex items-center gap-5 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  isActive ? 'font-medium text-orange' : 'text-slate hover:text-navy'
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button onClick={handleLogout} className="text-slate hover:text-navy">
              Log out
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="text-sm font-medium text-orange hover:underline">
            Log in
          </NavLink>
        )}
      </nav>
    </header>
  );
}