import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { GatewayError } from "@/lib/data/client";

import Auth from "@/pages/Auth";
import AppShell from "@/pages/AppShell";
import Dashboard from "@/pages/Dashboard";
import Stock from "@/pages/Stock";
import Reports from "@/pages/Reports";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Suppliers from "@/pages/Suppliers";
import Purchases from "@/pages/Purchases";
import NewPurchase from "@/pages/NewPurchase";
import PurchaseDetail from "@/pages/PurchaseDetail";
import PurchaseAccountabilityPage from "@/pages/PurchaseAccountability";
import Counts from "@/pages/Counts";
import CountDetail from "@/pages/CountDetail";
import SettingsLayout from "@/pages/settings/SettingsLayout";
import SettingsIndex from "@/pages/settings/SettingsIndex";
import SettingsTeam from "@/pages/settings/SettingsTeam";
import SettingsLocations from "@/pages/settings/SettingsLocations";
import SettingsPurchaseRules from "@/pages/settings/SettingsPurchaseRules";
import SettingsMovementReasons from "@/pages/settings/SettingsMovementReasons";
import Approvals from "@/pages/Approvals";
import Requests from "@/pages/Requests";
import NewRequest from "@/pages/NewRequest";
import RequestDetail from "@/pages/RequestDetail";
import Quotes from "@/pages/Quotes";
import NewQuote from "@/pages/NewQuote";
import QuoteDetail from "@/pages/QuoteDetail";
import NotFound from "@/pages/NotFound";
import { RoleGate } from "@/components/auth/RoleGate";

// Sem sessão Supabase — 401/403 do gateway vem como GatewayError (client.ts).
// Sessão expirada/token inválido força signOut; o AuthContext reflete o
// estado e ProtectedRoute redireciona pra /auth?tab=login.
let signingOut = false;
function handleMaybeAuthError(err: unknown) {
  const isUnauth = err instanceof GatewayError && (err.status === 401 || err.status === 403);
  if (isUnauth && !signingOut) {
    signingOut = true;
    setTimeout(() => {
      signingOut = false;
    }, 2000);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
  queryCache: new QueryCache({
    onError: handleMaybeAuthError,
  }),
  mutationCache: new MutationCache({
    onError: handleMaybeAuthError,
  }),
});

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-muted-foreground">Carregando...</div>
    </div>
  );
}

function ProtectedRoute({ allowedRoles }: { allowedRoles?: Array<"admin" | "manager" | "rep"> }) {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/auth?tab=login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? "/dashboard" : "/auth?tab=login"} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<Auth />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/purchases/new" element={<NewPurchase />} />
                <Route path="/purchases/:id" element={<PurchaseDetail />} />
                <Route
                  path="/purchases/:id/accountability"
                  element={<PurchaseAccountabilityPage />}
                />
                <Route path="/counts" element={<Counts />} />
                <Route path="/counts/:id" element={<CountDetail />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/requests/new" element={<NewRequest />} />
                <Route path="/requests/:id" element={<RequestDetail />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["admin", "manager"]} />}>
              <Route element={<AppShell />}>
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/quotes" element={<Quotes />} />
                <Route path="/quotes/new" element={<NewQuote />} />
                <Route path="/quotes/:id" element={<QuoteDetail />} />
                <Route
                  path="/settings"
                  element={
                    <RoleGate
                      allowedRoles={["admin"]}
                      fallback={<Navigate to="/dashboard" replace />}
                    >
                      <SettingsLayout />
                    </RoleGate>
                  }
                >
                  <Route index element={<SettingsIndex />} />
                  <Route path="team" element={<SettingsTeam />} />
                  <Route path="locations" element={<SettingsLocations />} />
                  <Route path="purchase-rules" element={<SettingsPurchaseRules />} />
                  <Route path="movement-reasons" element={<SettingsMovementReasons />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
