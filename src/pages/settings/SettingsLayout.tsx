import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// Menu enxuto (story 016) — Integrations/Health/ApiKeys/Audit/Security/
// Onboarding/Stores foram descartadas (ADRs 003/007/008/009).
const tabs = [
  { to: "/settings/team", label: "Equipe" },
  { to: "/settings/locations", label: "Locais" },
  { to: "/settings/purchase-rules", label: "Regras de compra" },
] as const;

export default function SettingsLayout() {
  const location = useLocation();

  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Configurações</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie sua equipe e as configurações do sistema.
        </p>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const active = location.pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  "border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-accent-primary text-accent-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
