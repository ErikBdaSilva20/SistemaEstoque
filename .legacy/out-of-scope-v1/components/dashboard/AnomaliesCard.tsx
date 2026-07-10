import { Link } from "react-router-dom";
import { AlertTriangle, Flame, PauseCircle, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnomalies, type AnomalyDetection } from "@/hooks/useAnomalies";

const KIND_META: Record<
  AnomalyDetection["kind"],
  { label: string; icon: typeof Flame; className: string }
> = {
  sales_spike: {
    label: "Pico de vendas",
    icon: Flame,
    className: "bg-accent-success/15 text-accent-success",
  },
  sales_drop: {
    label: "Queda de vendas",
    icon: TrendingDown,
    className: "bg-warning/15 text-warning",
  },
  sudden_stockout: {
    label: "Ruptura",
    icon: Zap,
    className: "bg-destructive/15 text-destructive",
  },
  slow_mover: {
    label: "Parado",
    icon: PauseCircle,
    className: "bg-muted text-muted-foreground",
  },
};

export function AnomaliesCard() {
  const { data: anomalies = [], isLoading } = useAnomalies();

  if (!isLoading && anomalies.length === 0) return null;

  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent-primary" />
          <CardTitle className="text-base">Alertas e anomalias</CardTitle>
        </div>
        <Badge variant="secondary" className="bg-accent-primary/15 text-accent-primary">
          {anomalies.length}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="divide-y divide-border">
            {anomalies.map((a, i) => {
              const meta = KIND_META[a.kind];
              const Icon = meta.icon;
              return (
                <Link
                  key={i}
                  to={`/products/${a.product.id}`}
                  className="-mx-2 flex items-start gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
                >
                  <Badge className={`${meta.className} gap-1 shrink-0`} variant="secondary">
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{a.product.name}</div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </div>
                  {a.severity === "high" && (
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
