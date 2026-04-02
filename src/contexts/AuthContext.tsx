import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'platform_admin' | 'clinic_owner' | 'clinic_staff' | 'clinic_receptionist';
export type AppMode = 'admin' | 'client';

interface UserRole {
  role: AppRole;
  clinic_id: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: UserRole[];
  loading: boolean;
  appMode: AppMode;
  isPlatformAdmin: boolean;
  isClientOwner: boolean;
  clinicId: string | null;
  activeClinicId: string | null;
  activeLojaId: string | null;
  canAccessClientApp: boolean;
  hasOperationalStore: boolean;
  defaultRoute: string;
  impersonatedClinicId: string | null;
  impersonateClinic: (clinicId: string) => void;
  clearImpersonation: () => void;
  signIn: (email: string, password: string) => Promise<{ error: any; redirectTo?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLojaId, setActiveLojaId] = useState<string | null>(null);
  const [lastHydratedUserId, setLastHydratedUserId] = useState<string | null>(null);
  const [impersonatedClinicId, setImpersonatedClinicId] = useState<string | null>(
    () => localStorage.getItem('impersonated_clinic_id')
  );
  const sessionRef = useRef<Session | null>(null);
  const rolesRef = useRef<UserRole[]>([]);
  const lastHydratedUserIdRef = useRef<string | null>(null);

  const fetchRoles = async (userId: string): Promise<UserRole[]> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, clinic_id')
      .eq('user_id', userId);

    if (error) {
      return [];
    }

    return (data as UserRole[]) || [];
  };

  const fetchRolesWithRetry = async (userId: string) => {
    const retryDelays = [0, 150, 400];
    let resolvedRoles: UserRole[] = [];

    for (const delay of retryDelays) {
      if (delay > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }

      resolvedRoles = await fetchRoles(userId);

      if (resolvedRoles.length > 0) {
        break;
      }
    }

    return resolvedRoles;
  };

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    rolesRef.current = roles;
  }, [roles]);

  useEffect(() => {
    lastHydratedUserIdRef.current = lastHydratedUserId;
  }, [lastHydratedUserId]);

  const hydrateAuthState = async (nextSession: Session | null, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setRoles([]);
    }

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setLastHydratedUserId(null);
      setImpersonatedClinicId(null);
      localStorage.removeItem('impersonated_clinic_id');
      setLoading(false);
      return;
    }

    if (lastHydratedUserId !== nextSession.user.id) {
      setImpersonatedClinicId(null);
      localStorage.removeItem('impersonated_clinic_id');
    }

    const nextRoles = await fetchRolesWithRetry(nextSession.user.id);
    setRoles(nextRoles);
    setLastHydratedUserId(nextSession.user.id);
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        const currentSession = sessionRef.current;
        const currentUserId = currentSession?.user?.id ?? null;
        const nextUserId = nextSession?.user?.id ?? null;
        const sameUser = !!currentUserId && currentUserId === nextUserId;
        const alreadyHydrated = !!nextUserId && lastHydratedUserIdRef.current === nextUserId && rolesRef.current.length > 0;
        const isFocusRefreshEvent = event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION';

        if (isFocusRefreshEvent && sameUser && alreadyHydrated) {
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          return;
        }

        void hydrateAuthState(nextSession);
      }
    );

    void supabase.auth.getSession().then(({ data: { session } }) => hydrateAuthState(session));

    return () => subscription.unsubscribe();
  }, []);

  const isPlatformAdmin = roles.some(r => r.role === 'platform_admin');
  const isClientOwner = roles.some(r => r.role === 'clinic_owner');
  const naturalClinicId = roles.find(r => r.role !== 'platform_admin' && r.clinic_id)?.clinic_id
    ?? roles.find(r => r.clinic_id)?.clinic_id
    ?? null;
  const appMode: AppMode = isPlatformAdmin && !impersonatedClinicId ? 'admin' : 'client';
  const activeClinicId = appMode === 'client'
    ? ((isPlatformAdmin && impersonatedClinicId) ? impersonatedClinicId : naturalClinicId)
    : null;
  const clinicId = activeClinicId;
  const canAccessClientApp = !!activeClinicId;
  const hasOperationalStore = !!activeLojaId;
  const defaultRoute = appMode === 'admin' ? '/admin' : '/dashboard';

  useEffect(() => {
    let cancelled = false;

    const fetchActiveLoja = async () => {
      if (!activeClinicId) {
        setActiveLojaId(null);
        return;
      }

      const { data, error } = await supabase
        .from('lojas')
        .select('id')
        .eq('clinic_id', activeClinicId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        setActiveLojaId(error ? null : data?.id ?? null);
      }
    };

    fetchActiveLoja();

    return () => {
      cancelled = true;
    };
  }, [activeClinicId]);

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
    if (error) return { error, redirectTo: undefined };

    setLoading(true);
    setSession(data.session);
    setUser(data.user);
    setImpersonatedClinicId(null);
    localStorage.removeItem('impersonated_clinic_id');

    // Check if user's clinic is active
    const userRoles = await fetchRolesWithRetry(data.user.id);
    setRoles(userRoles);
    setLastHydratedUserId(data.user.id);

    const isAdmin = userRoles.some(r => r.role === 'platform_admin');
    if (!isAdmin && userRoles.length) {
      const clinicIds = [...new Set(userRoles.filter(r => r.clinic_id).map(r => r.clinic_id))];
      if (clinicIds.length > 0) {
        const { data: clinics } = await supabase
          .from('clinics')
          .select('id, status')
          .in('id', clinicIds);

        const allInactive = clinics?.every(c => c.status === 'cancelada' || c.status === 'inativa');
        if (allInactive) {
          await supabase.auth.signOut();
          setLoading(false);
          return { error: { message: 'Sua conta foi desativada. Entre em contato com o administrador.' }, redirectTo: undefined };
        }
      }
    }

    setLoading(false);

    return {
      error: null,
      redirectTo: '/',
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setActiveLojaId(null);
    setImpersonatedClinicId(null);
    localStorage.removeItem('impersonated_clinic_id');
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      roles,
      loading,
      appMode,
      isPlatformAdmin,
      isClientOwner,
      clinicId,
      activeClinicId,
      activeLojaId,
      canAccessClientApp,
      hasOperationalStore,
      defaultRoute,
      impersonatedClinicId,
      impersonateClinic,
      clearImpersonation,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
