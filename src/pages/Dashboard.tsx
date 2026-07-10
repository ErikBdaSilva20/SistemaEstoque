import { Link } from "react-router-dom";
import { Package, TrendingUp, AlertTriangle, ShoppingCart, Wallet, ArrowRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { formatBRL, formatNumber, formatDate } from "@/lib/formatters";
import { ExpiringBatchesCard } from "@/components/dashboard/ExpiringBatchesCard";
import type { PurchaseOrder } from "@/hooks/usePurchases";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();
  const kpis = data?.kpis;

  const stats = [
    {
      label: "Produtos ativos",
      value: kpis ? formatNumber(kpis.totalProducts) : "—",
      icon: Package,
      tone: "text-accent-primary",
    },
    {
      label: "Movimentações hoje",
      value: kpis ? formatNumber(kpis.movementsToday) : "—",
      icon: TrendingUp,
      tone: "text-accent-success",
    },
    {
      label: "Estoque crítico",
      value: kpis ? formatNumber(kpis.criticalStockCount) : "—",
      icon: AlertTriangle,
      tone: "text-warning",
    },
    {
      label: "Pedidos em aberto",
      value: kpis ? formatNumber(kpis.pendingOrdersCount) : "—",
      icon: ShoppingCart,
      tone: "text-accent-primary",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Bem-vindo, {user?.name?.split(" ")[0] ?? "Usuário"}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Visão geral do seu estoque e operações de compra.
          </p>
        </div>
        {kpis && (
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-right shadow-elevation-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3 w-3" />
              Valor em estoque (custo)
            </div>
            <div className="text-lg font-semibold tabular-nums">{formatBRL(kpis.stockValue)}</div>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <ExpiringBatchesCard />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="rounded-2xl shadow-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${tone}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold tabular-nums">{value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 rounded-2xl shadow-elevation-1">
        <CardHeader>
          <CardTitle className="text-base">Movimentações — últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart}>
                  <defs>
                    <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent-success))" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(var(--accent-success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="in"
                    name="Entradas"
                    stroke="hsl(var(--accent-success))"
                    fill="url(#inGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="out"
                    name="Saídas"
                    stroke="hsl(var(--destructive))"
                    fill="url(#outGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-elevation-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Estoque crítico</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/products?onlyLowStock=true">
                Ver todos
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data && data.lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum produto abaixo do estoque mínimo.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {data?.lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.sku}
                        {p.supplierName ? ` · ${p.supplierName}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-warning">
                        {formatNumber(p.current_stock)} {p.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        mín {formatNumber(p.min_stock)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-elevation-1">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Pedidos em aberto</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/purchases">
                Ver todos
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data && data.openOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum pedido em aberto.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {data?.openOrders.map((o) => (
                  <Link
                    key={o.id}
                    to={`/purchases/${o.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{o.code}</span>
                        <StatusPill status={o.status} />
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {o.supplierName ?? "—"}
                        {o.expected_date ? ` · previsão ${formatDate(o.expected_date)}` : ""}
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium tabular-nums">
                      {formatBRL(Number(o.total_amount))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: PurchaseOrder["status"] }) {
  const map: Record<PurchaseOrder["status"], { label: string; cls: string }> = {
    draft: { label: "Rascunho", cls: "bg-muted text-muted-foreground" },
    sent: { label: "Enviado", cls: "bg-accent-primary/15 text-accent-primary" },
    pending_approval: { label: "Pendente aprovação", cls: "bg-warning/15 text-warning" },
    rejected: { label: "Rejeitado", cls: "bg-destructive/15 text-destructive" },
    cancelled: { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
    partially_received: { label: "Parcial", cls: "bg-warning/15 text-warning" },
    fully_received: { label: "Recebido", cls: "bg-accent-success/15 text-accent-success" },
  };
  const m = map[status];
  return (
    <Badge variant="secondary" className={m.cls}>
      {m.label}
    </Badge>
  );
}
