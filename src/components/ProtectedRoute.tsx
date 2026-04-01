import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'platform_admin';
  requiredMode?: 'authenticated' | 'admin' | 'client';
}

export default function ProtectedRoute({ children, requiredRole, requiredMode = 'authenticated' }: Props) {
  const { session, loading, isPlatformAdmin, appMode, canAccessClientApp, hasOperationalStore, defaultRoute, signOut } = useAuth();

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
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Conta sem acesso liberado</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Seu usuário entrou com sucesso, mas ainda não foi vinculado a uma conta/loja ativa no CRM.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={signOut} variant="outline" className="rounded-xl">
                Sair da conta
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (!hasOperationalStore) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">Conta vinculada, loja não configurada</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Seu acesso está ativo, mas ainda não existe uma loja operacional vinculada para carregar catálogo, leads e follow-ups.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={signOut} variant="outline" className="rounded-xl">
                Sair da conta
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (appMode !== 'client') {
      return <Navigate to={defaultRoute} replace />;
    }
  }

  return <>{children}</>;
}
