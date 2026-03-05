import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, profile, loading, canAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect buyers with pending/rejected approval to the pending page
  if (role === 'comprador' && profile?.approval_status !== 'approved' && location.pathname !== '/aprovacao-pendente') {
    return <Navigate to="/aprovacao-pendente" replace />;
  }

  // Redirect buyers trying to access seller pages
  if (role === 'comprador' && location.pathname !== '/comprador' && !allowedRoles?.includes('comprador')) {
    return <Navigate to="/comprador" replace />;
  }

  // Redirect sellers trying to access buyer pages
  if (role && role !== 'comprador' && allowedRoles?.includes('comprador') && allowedRoles.length === 1) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !canAccess(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Não tem permissão para aceder a esta página.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Seu nível de acesso: <span className="font-medium capitalize">{role}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
