import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AdminAuthValue {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthValue>({ session: null, isAdmin: false, loading: true });

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const isAdmin = session?.user.app_metadata.role === 'admin';

  return (
    <AdminAuthContext.Provider value={{ session, isAdmin, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
