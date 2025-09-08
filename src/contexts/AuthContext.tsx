

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getSessionAndAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        // Only check admin status if user exists and avoid blocking the UI
        if (session?.user) {
          // Non-blocking admin check
          const checkAdmin = async () => {
            try {
              const { data } = await supabase.rpc('is_admin');
              setIsAdmin(data || false);
            } catch {
              setIsAdmin(false);
            }
          };
          checkAdmin();
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    getSessionAndAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Non-blocking admin check
        const checkAdmin = async () => {
          try {
            const { data } = await supabase.rpc('is_admin');
            setIsAdmin(data || false);
          } catch {
            setIsAdmin(false);
          }
        };
        checkAdmin();
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
