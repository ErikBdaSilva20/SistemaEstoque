import type { ReactNode } from "react";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/contexts/AuthContext";

interface RoleGateProps {
  allowedRoles: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback }: RoleGateProps) {
  const { role, isLoading } = useAuth();

  if (isLoading) return null;

  if (!role || !allowedRoles.includes(role)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Acesso negado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
