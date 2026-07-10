import { Link } from "react-router-dom";
import { useMemo } from "react";
import { LineChart as LineChartIcon, AlertTriangle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/useProducts";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  avg_daily: number;
  coverageDays: number;
  critical: boolean;
}

export function ForecastPreviewCard() {
  const { data: products = [] } = useProducts({ includeInactive: false });

  const { data: rows = [], isLoading } = useQuery({
    enabled: products.length > 0,
    queryKey: ["forecast-preview", products.map((p) => p.id)],
    queryFn: async (): Promise<Row[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const ids = products.slice(0, 50).map((p) => p.id);
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from("stock_movements")
        .select("product_id, quantity, type, created_at")
        .in("product_id", ids)
        .eq("type", "out")
        .gte("created_at", since.toISOString());
      if (error) throw error;

      const totals = new Map<string, number>();
      for (const r of data ?? []) {
        const pid = r.product_id as string;
        totals.set(pid, (totals.get(pid) ?? 0) + Math.abs(Number(r.quantity)));
      }

      return products
        .slice(0, 50)
        .map((p) => {
          const total30 = totals.get(p.id) ?? 0;
          const avg = total30 / 30;
          const stock = Number(p.current_stock);
          const coverage = avg > 0 ? stock / avg : Infinity;
          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            unit: p.unit,
            current_stock: stock,
            avg_daily: avg,
            coverageDays: coverage,
            critical: avg > 0 && coverage < 14,
          };
        })
        .filter((r) => r.avg_daily > 0)
        .sort((a, b) => a.coverageDays - b.coverageDays)
        .slice(0, 6);
    },
    staleTime: 60_000,
  });

  const criticalCount = useMemo(() => rows.filter((r) => r.critical).length, [rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChartIcon className="h-4 w-4 text-accent-primary" />
            Previsão de cobertura
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Estoque atual ÷ consumo médio diário (últimos 30 dias).
          </p>
        </div>
        {criticalCount > 0 && (
          <Badge className="bg-destructive/15 text-destructive" variant="secondary">
            {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sem histórico suficiente de saídas nos últimos 30 dias.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "flex items-center justify-between rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm",
                  r.critical && "border-destructive/30 bg-destructive/5",
                )}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.sku} · {formatNumber(r.avg_daily)} {r.unit}/dia
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={cn("font-semibold tabular-nums", r.critical && "text-destructive")}
                  >
                    {isFinite(r.coverageDays) ? `${formatNumber(r.coverageDays)}d` : "∞"}
                  </div>
                  {r.critical && (
                    <div className="flex items-center justify-end gap-1 text-[11px] text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      reabastecer
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
          <Link to="/forecast">
            Abrir previsão detalhada
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
