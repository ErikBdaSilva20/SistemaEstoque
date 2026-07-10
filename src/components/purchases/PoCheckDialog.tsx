import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePurchaseMutations, type PurchaseOrderDetail } from "@/hooks/usePurchases";
import { mapGatewayError } from "@/lib/errors";
import { formatNumber } from "@/lib/formatters";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  order: PurchaseOrderDetail;
}

// Conferência separa entrega física de entrada em estoque. Operador valida
// quantidades item-a-item antes de gerar as movimentacoes_estoque.
export function PoCheckDialog({ open, onOpenChange, order }: Props) {
  const { completeCheck } = usePurchaseMutations();
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const pendingItems = useMemo(
    () => order.items.filter((it) => Number(it.quantity_received) < Number(it.quantity_ordered)),
    [order.items],
  );

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const it of pendingItems) {
      const remaining = Number(it.quantity_ordered) - Number(it.quantity_received);
      initial[it.id] = String(remaining);
    }
    setQuantities(initial);
  }, [open, pendingItems]);

  const handleConfirm = () => {
    let items: { itemId: string; quantity: number }[];
    try {
      items = pendingItems
        .map((it) => {
          const raw = quantities[it.id] ?? "";
          const qty = Number(raw);
          if (!Number.isFinite(qty) || qty <= 0) return null;
          const remaining = Number(it.quantity_ordered) - Number(it.quantity_received);
          if (qty > remaining) {
            throw new Error(
              `Quantidade conferida (${qty}) excede o pendente (${remaining}) para ${it.product_name}.`,
            );
          }
          return { itemId: it.id, quantity: qty };
        })
        .filter((x): x is { itemId: string; quantity: number } => x !== null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao validar quantidades.");
      return;
    }

    if (items.length === 0) {
      toast.error("Informe pelo menos uma quantidade conferida > 0.");
      return;
    }

    const allFull = pendingItems.every((it) => {
      const entry = items.find((i) => i.itemId === it.id);
      const covered = entry ? entry.quantity : 0;
      return covered >= Number(it.quantity_ordered) - Number(it.quantity_received);
    });

    completeCheck.mutate(
      { orderId: order.id, items },
      {
        onSuccess: () => {
          toast.success(
            allFull
              ? "Conferência finalizada — pedido recebido por completo."
              : "Conferência registrada (recebimento parcial).",
          );
          onOpenChange(false);
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-accent-primary" />
            Conferência de entrega — {order.code}
          </DialogTitle>
          <DialogDescription>
            Valide as quantidades realmente recebidas. As entradas em estoque só são geradas após
            confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Pedido</TableHead>
                <TableHead className="text-right">Já recebido</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="w-32 text-right">Conferido agora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingItems.map((it) => {
                const ordered = Number(it.quantity_ordered);
                const received = Number(it.quantity_received);
                const pending = ordered - received;
                return (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="font-medium">{it.product_name}</div>
                      <div className="text-xs text-muted-foreground">{it.product?.sku}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(ordered)} {it.product?.unit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(received)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-warning">
                      {formatNumber(pending)}
                    </TableCell>
                    <TableCell>
                      <Label htmlFor={`qty-${it.id}`} className="sr-only">
                        Quantidade conferida
                      </Label>
                      <Input
                        id={`qty-${it.id}`}
                        type="number"
                        min="0"
                        max={pending}
                        step="any"
                        value={quantities[it.id] ?? ""}
                        onChange={(e) =>
                          setQuantities((prev) => ({ ...prev, [it.id]: e.target.value }))
                        }
                        className="text-right tabular-nums"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {pendingItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Não há itens pendentes para conferência.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={completeCheck.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={completeCheck.isPending || pendingItems.length === 0}
          >
            {completeCheck.isPending ? "Conferindo..." : "Confirmar conferência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
