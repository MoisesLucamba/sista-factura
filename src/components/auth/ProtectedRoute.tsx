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

  // Note: approval_status is informational only. Email-confirmed users have full access;
  // admins review documents asynchronously without blocking the platform.


  // Nota: o portal de comprador foi descontinuado — todas as contas usam o mesmo dashboard.


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
