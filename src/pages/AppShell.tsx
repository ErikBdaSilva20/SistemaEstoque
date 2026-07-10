import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
  Package,
  Truck,
  ShoppingCart,
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface NavItemConfig {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
}

function NavItem({ item, active }: { item: NavItemConfig; active: boolean }) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <NavLink to={item.to}>
          <Icon className="h-4 w-4" />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function AppShell() {
  const { user, role, signOut, isAdmin, isManager } = useAuth();
  const canManage = isAdmin || isManager;
  const location = useLocation();
  const navigate = useNavigate();

  const mainNavItems: NavItemConfig[] = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/products", icon: Package, label: "Produtos" },
    { to: "/stock", icon: ArrowLeftRight, label: "Estoque" },
    { to: "/purchases", icon: ShoppingCart, label: "Compras" },
    { to: "/counts", icon: ClipboardList, label: "Contagem" },
    { to: "/reports", icon: BarChart3, label: "Relatórios" },
  ];

  const managementNavItems: NavItemConfig[] = [
    ...(canManage ? [{ to: "/suppliers", icon: Truck, label: "Fornecedores" }] : []),
    { to: "/settings/team", icon: SettingsIcon, label: "Configurações" },
  ];

  const isRouteActive = (to: string) =>
    location.pathname === to ||
    location.pathname.startsWith(`${to}/`) ||
    (to.startsWith("/settings") && location.pathname.startsWith("/settings"));

  const onLogout = async () => {
    await signOut();
    navigate("/auth?tab=login", { replace: true });
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full bg-bg-base">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
                  Compras &amp; Estoque
                </p>
                <p className="truncate text-xs text-sidebar-foreground">Operação e suprimentos</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="overflow-y-auto px-2 py-3">
            <SidebarGroup>
              <SidebarGroupLabel>Navegação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems.map((item) => (
                    <NavItem key={item.to} item={item} active={isRouteActive(item.to)} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {managementNavItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Gestão</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {managementNavItems.map((item) => (
                      <NavItem key={item.to} item={item} active={isRouteActive(item.to)} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <div className="mb-2 flex items-center gap-3 overflow-hidden rounded-md px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                  {user?.name ?? "Usuário"}
                </p>
                <p className="truncate text-xs text-sidebar-foreground">{role}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-h-svh bg-bg-base">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg-elevated px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm font-semibold text-text-primary md:hidden">
                Compras &amp; Estoque
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="md:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>

          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
