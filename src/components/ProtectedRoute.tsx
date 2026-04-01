import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'platform_admin';
  requiredMode?: 'authenticated' | 'admin' | 'client';
}

export default function ProtectedRoute({ children, requiredRole, requiredMode = 'authenticated' }: Props) {
  const { session, loading, isPlatformAdmin, appMode, canAccessClientApp, defaultRoute } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredMode === 'admin' && !isPlatformAdmin) {
    return <Navigate to={defaultRoute} replace />;
  }

  if (requiredRole === 'platform_admin' && !isPlatformAdmin) {
    return <Navigate to={defaultRoute} replace />;
  }

  if (requiredMode === 'client') {
    if (!canAccessClientApp) {
      return <Navigate to="/admin" replace />;
    }

    if (appMode !== 'client') {
      return <Navigate to={defaultRoute} replace />;
    }
  }

  return <>{children}</>;
}
