import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AppRole } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Branch MOCKUP apenas. Troca o papel simulado (admin/manager/rep) gravando
// em localStorage (lido por previewRole() em preview-fixtures.ts) e recarrega
// a página pra AuthContext buscar a "sessão" de novo com o papel novo. Some
// sozinho fora do modo preview (__MASI_PREVIEW__ não fica true na branch
// deploy/produção).
const ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Gerente" },
  { value: "rep", label: "Operador" },
];

export function MockRoleSwitcher() {
  const { role } = useAuth();
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    setIsPreview(typeof window !== "undefined" && window.__MASI_PREVIEW__ === true);
  }, []);

  if (!isPreview) return null;

  const switchTo = (next: AppRole) => {
    window.localStorage?.setItem("mockRole", next);
    const url = new URL(window.location.href);
    url.searchParams.delete("previewRole"); // localStorage passa a mandar
    window.location.href = url.toString();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-elevation-4">
      <span className="pl-2 pr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Mockup
      </span>
      {ROLES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => switchTo(r.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            role === r.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
