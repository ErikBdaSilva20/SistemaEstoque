import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Boxes, CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useProductBatches, useBatchMutations, type ProductBatch } from "@/hooks/useBatches";
import { useLocations } from "@/hooks/useLocations";
import { formatBRL, formatDate, formatNumber } from "@/lib/formatters";
import { BatchFormDialog } from "./BatchFormDialog";
import { mapGatewayError } from "@/lib/errors";

export function ProductBatchesPanel({
  productId,
  productUnit,
  onBatchesChanged,
}: {
  productId: string;
  productUnit: string;
  onBatchesChanged?: () => void;
}) {
  const { data: batches = [], isLoading } = useProductBatches(productId);
  const { data: locations = [] } = useLocations(true);
  const { remove } = useBatchMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductBatch | null>(null);

  const locationNameById = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations],
  );

  const activeBatches = batches.filter((b) => Number(b.quantity) > 0);
  const today = new Date();

  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardContent className="pt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Lotes e validade</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Gerenciamento FEFO — consuma primeiro os lotes com validade mais próxima.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Novo lote
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-40" />
        ) : activeBatches.length === 0 && batches.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Boxes className="h-8 w-8 opacity-40" />
            Nenhum lote cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Fabricação</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Custo unit.</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => {
                const exp = b.expiration_date ? new Date(b.expiration_date) : null;
                const daysToExpire = exp
                  ? Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isExpired = daysToExpire !== null && daysToExpire < 0;
                const isExpiringSoon =
                  daysToExpire !== null && daysToExpire >= 0 && daysToExpire <= 30;
                const isExhausted = Number(b.quantity) <= 0;
                return (
                  <TableRow key={b.id} className={isExhausted ? "opacity-50" : undefined}>
                    <TableCell className="font-mono text-sm font-medium">{b.batch_code}</TableCell>
                    <TableCell className="text-sm">
                      {b.location_id ? (locationNameById.get(b.location_id) ?? "—") : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.manufacture_date ? formatDate(b.manufacture_date) : "—"}
                    </TableCell>
                    <TableCell>
                      {b.expiration_date ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{formatDate(b.expiration_date)}</span>
                          {isExpired ? (
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-destructive/15 text-destructive"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Vencido
                            </Badge>
                          ) : isExpiringSoon ? (
                            <Badge variant="secondary" className="gap-1 bg-warning/15 text-warning">
                              <CalendarClock className="h-3 w-3" />
                              {daysToExpire}d
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatNumber(b.quantity)} {productUnit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {b.unit_cost != null ? formatBRL(Number(b.unit_cost)) : "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditTarget(b);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={Number(b.quantity) > 0}
                        onClick={() => {
                          if (Number(b.quantity) > 0) {
                            toast.error("Só é possível remover lotes com quantidade zerada.");
                            return;
                          }
                          remove.mutate(b.id, {
                            onSuccess: () => {
                              toast.success("Lote removido.");
                              onBatchesChanged?.();
                            },
                            onError: (e) => toast.error(mapGatewayError(e)),
                          });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <BatchFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        productId={productId}
        batch={editTarget}
        onSaved={onBatchesChanged}
      />
    </Card>
  );
}
