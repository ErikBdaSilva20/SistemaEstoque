import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpiringBatches } from "@/hooks/useBatches";
import { formatDate, formatNumber } from "@/lib/formatters";

export function ExpiringBatchesCard({
  withinDays = 30,
  limit = 5,
  viewAllHref = "/reports",
  hideWhenEmpty = true,
}: {
  withinDays?: number;
  limit?: number;
  viewAllHref?: string | null;
  /** Quando false, mostra uma mensagem de "nada vencendo" em vez de sumir — use fora do Dashboard, onde o card é o único conteúdo da tela. */
  hideWhenEmpty?: boolean;
} = {}) {
  const { data: batches = [], isLoading } = useExpiringBatches(withinDays);

  if (!isLoading && batches.length === 0 && hideWhenEmpty) return null;

  return (
    <Card className="rounded-2xl border-warning/30 bg-warning/5 shadow-elevation-1">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-warning" />
          <CardTitle className="text-base">Lotes próximos do vencimento ({withinDays}d)</CardTitle>
        </div>
        <Badge variant="secondary" className="bg-warning/15 text-warning">
          {batches.length}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : batches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum lote vencendo nesse período.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {batches.slice(0, limit).map((b) => {
              const expired = (b.daysToExpire ?? 0) < 0;
              return (
                <Link
                  key={b.batchId}
                  to={`/products/${b.productId ?? ""}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors hover:bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{b.productName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      Lote <span className="font-mono">{b.batchCode}</span> · {b.locationName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium">
                      {formatNumber(b.quantity ?? 0)} {b.unit}
                    </div>
                    <div
                      className={`text-xs font-medium ${expired ? "text-destructive" : "text-primary"}`}
                    >
                      {expired ? (
                        <>
                          <AlertTriangle className="inline h-3 w-3" /> vencido
                        </>
                      ) : (
                        <>vence em {b.daysToExpire}d</>
                      )}
                      {b.expirationDate ? ` · ${formatDate(b.expirationDate)}` : ""}
                    </div>
                  </div>
                </Link>
              );
            })}
            {viewAllHref && batches.length > limit && (
              <div className="pt-2 text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={viewAllHref}>
                    Ver todos
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
