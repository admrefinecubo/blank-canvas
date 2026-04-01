import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'platform_admin' | 'clinic_owner' | 'clinic_staff' | 'clinic_receptionist';

interface UserRole {
  role: AppRole;
  clinic_id: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: UserRole[];
  loading: boolean;
  isPlatformAdmin: boolean;
  clinicId: string | null;
  impersonatedClinicId: string | null;
  impersonateClinic: (clinicId: string) => void;
  clearImpersonation: () => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonatedClinicId, setImpersonatedClinicId] = useState<string | null>(
    () => localStorage.getItem('impersonated_clinic_id')
  );

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role, clinic_id')
      .eq('user_id', userId);
    setRoles((data as UserRole[]) || []);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRoles(session.user.id), 0);
        } else {
          setRoles([]);
          setImpersonatedClinicId(null);
          localStorage.removeItem('impersonated_clinic_id');
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isPlatformAdmin = roles.some(r => r.role === 'platform_admin');
  const naturalClinicId = roles.find(r => r.clinic_id)?.clinic_id ?? null;
  
  // If platform_admin is impersonating a clinic, use that; otherwise use natural clinic_id
  const clinicId = (isPlatformAdmin && impersonatedClinicId) ? impersonatedClinicId : naturalClinicId;

  const impersonateClinic = (id: string) => {
    setImpersonatedClinicId(id);
    localStorage.setItem('impersonated_clinic_id', id);
  };

  const clearImpersonation = () => {
    setImpersonatedClinicId(null);
    localStorage.removeItem('impersonated_clinic_id');
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };

    // Check if user's clinic is active
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, clinic_id')
      .eq('user_id', data.user.id);

    const isAdmin = userRoles?.some(r => r.role === 'platform_admin');
    if (!isAdmin && userRoles?.length) {
      const clinicIds = [...new Set(userRoles.filter(r => r.clinic_id).map(r => r.clinic_id))];
      if (clinicIds.length > 0) {
        const { data: clinics } = await supabase
          .from('clinics')
          .select('id, status')
          .in('id', clinicIds);

        const allInactive = clinics?.every(c => c.status === 'cancelada' || c.status === 'inativa');
        if (allInactive) {
          await supabase.auth.signOut();
          return { error: { message: 'Sua conta foi desativada. Entre em contato com o administrador.' } };
        }
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setImpersonatedClinicId(null);
    localStorage.removeItem('impersonated_clinic_id');
  };

  return (
    <AuthContext.Provider value={{ session, user, roles, loading, isPlatformAdmin, clinicId, impersonatedClinicId, impersonateClinic, clearImpersonation, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
