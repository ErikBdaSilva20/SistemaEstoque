import { useMemo } from "react";
import { ArrowDownCircle, ArrowUpCircle, Wrench, ArrowLeftRight } from "lucide-react";
import { useMovements } from "@/hooks/useMovements";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function startOfDayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const KPIS = [
  {
    key: "in" as const,
    label: "Entradas hoje",
    icon: ArrowDownCircle,
    accent: "text-accent-success",
    ring: "bg-accent-success/10",
  },
  {
    key: "out" as const,
    label: "Saídas hoje",
    icon: ArrowUpCircle,
    accent: "text-destructive",
    ring: "bg-destructive/10",
  },
  {
    key: "adjustment" as const,
    label: "Ajustes hoje",
    icon: Wrench,
    accent: "text-warning",
    ring: "bg-warning/10",
  },
  {
    key: "transfer" as const,
    label: "Transferências hoje",
    icon: ArrowLeftRight,
    accent: "text-accent-primary",
    ring: "bg-accent-primary/10",
  },
];

export function StockKpiCards() {
  const sinceIso = useMemo(() => startOfDayIso(), []);
  const { data: movements = [], isLoading } = useMovements({ sinceIso, limit: 500 });

  const counts = useMemo(() => {
    const acc = { in: 0, out: 0, adjustment: 0, transfer: 0 };
    const totals = { in: 0, out: 0, adjustment: 0, transfer: 0 };
    for (const m of movements) {
      const t = m.type as keyof typeof acc;
      if (t in acc) {
        acc[t] += 1;
        totals[t] += Math.abs(Number(m.quantity));
      }
    }
    return { acc, totals };
  }, [movements]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {KPIS.map(({ key, label, icon: Icon, accent, ring }) => (
        <Card key={key} className="rounded-2xl border-border bg-card p-5 shadow-elevation-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              {isLoading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className={cn("mt-2 text-3xl font-bold tabular-nums", accent)}>
                  {counts.acc[key]}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {isLoading ? "—" : `${formatNumber(counts.totals[key])} unid.`}
              </p>
            </div>
            <div className={cn("rounded-xl p-2", ring)}>
              <Icon className={cn("h-5 w-5", accent)} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
