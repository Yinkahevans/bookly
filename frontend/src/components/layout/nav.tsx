import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function Nav() {
  const { session, role } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  return (
    <header className="border-b border-navy/10 bg-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-xl text-navy">
          Bookly
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {!session && (
            <>
              <Link to="/login" className="text-slate hover:text-navy">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-orange px-3 py-1.5 font-medium text-white hover:bg-orange-dark"
              >
                Sign up
              </Link>
            </>
          )}

          {session && role === 'customer' && (
            <>
              <Link to="/my-bookings" className="text-slate hover:text-navy">
                My bookings
              </Link>
              <button onClick={handleLogout} className="text-slate hover:text-navy">
                Log out
              </button>
            </>
          )}

          {session && role === 'business_owner' && (
            <>
              <Link to="/dashboard" className="text-slate hover:text-navy">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-slate hover:text-navy">
                Log out
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}