import { useState } from "react";
import { AlertTriangle, Download, Package2, TrendingUp, Wallet, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReports } from "@/hooks/useReports";
import { downloadXlsx } from "@/lib/import-export";
import { AbcReportTable } from "@/components/reports/AbcReportTable";
import { TurnoverReportTable } from "@/components/reports/TurnoverReportTable";
import { StockoutsReportTable } from "@/components/reports/StockoutsReportTable";
import { formatBRL, formatNumber } from "@/lib/formatters";

export default function Reports() {
  const [period, setPeriod] = useState<string>("30");
  const { data, isLoading } = useReports(Number(period));

  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Relatórios</h1>
          <p className="mt-1 text-muted-foreground">
            Análises de curva ABC, giro, cobertura e rupturas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Package2}
          label="Produtos ativos"
          value={isLoading ? "—" : formatNumber(data?.totals.productsCount ?? 0)}
        />
        <StatCard
          icon={Wallet}
          label="Valor em estoque (custo)"
          value={isLoading ? "—" : formatBRL(data?.totals.inventoryCost ?? 0)}
        />
        <StatCard
          icon={TrendingUp}
          label={`Receita ${period}d`}
          value={isLoading ? "—" : formatBRL(data?.totals.revenue30d ?? 0)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Rupturas no período"
          value={isLoading ? "—" : formatNumber(data?.totals.stockoutCount ?? 0)}
          tone="warning"
        />
      </div>

      <Tabs defaultValue="abc" className="space-y-4">
        <TabsList>
          <TabsTrigger value="abc">Curva ABC</TabsTrigger>
          <TabsTrigger value="turnover">Giro & Cobertura</TabsTrigger>
          <TabsTrigger value="stockouts">Rupturas</TabsTrigger>
        </TabsList>

        <TabsContent value="abc">
          <Card className="rounded-2xl shadow-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Curva ABC — por receita</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  A (80% da receita) · B (próximos 15%) · C (5% restantes)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!data || data.abc.length === 0}
                onClick={() =>
                  data &&
                  downloadXlsx(
                    `curva-abc-${period}d.xlsx`,
                    data.abc.map((a) => ({
                      classe: a.class,
                      sku: a.sku,
                      nome: a.name,
                      qtd_vendida: a.qtySold30d,
                      receita: a.revenue30d,
                      participacao_acumulada: (a.cumulativeShare * 100).toFixed(2) + "%",
                    })),
                    "Curva ABC",
                  )
                }
              >
                <Download className="mr-2 h-3 w-3" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <AbcReportTable rows={data?.abc ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover">
          <Card className="rounded-2xl shadow-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Giro de estoque & cobertura</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Giro no período + dias de cobertura ao ritmo atual de saídas
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!data || data.turnover.length === 0}
                onClick={() =>
                  data &&
                  downloadXlsx(
                    `giro-${period}d.xlsx`,
                    data.turnover.map((t) => ({
                      sku: t.sku,
                      nome: t.name,
                      estoque_atual: t.currentStock,
                      saidas_periodo: t.qtyOut30d,
                      giro: t.turnover.toFixed(2),
                      cobertura_dias: t.coverageDays !== null ? t.coverageDays.toFixed(1) : "∞",
                    })),
                    "Giro",
                  )
                }
              >
                <Download className="mr-2 h-3 w-3" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <TurnoverReportTable rows={data?.turnover ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stockouts">
          <Card className="rounded-2xl shadow-elevation-1">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Rupturas</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Produtos que zeraram no período selecionado
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!data || data.stockouts.length === 0}
                onClick={() =>
                  data &&
                  downloadXlsx(
                    `rupturas-${period}d.xlsx`,
                    data.stockouts.map((s) => ({
                      sku: s.sku,
                      nome: s.name,
                      rompeu_em: s.stockoutAt,
                      dias_atras: s.daysAgo,
                    })),
                    "Rupturas",
                  )
                }
              >
                <ShoppingBag className="mr-2 h-3 w-3" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <StockoutsReportTable rows={data?.stockouts ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Package2;
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  const toneClass = tone === "warning" ? "text-warning" : "text-accent-primary";
  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
