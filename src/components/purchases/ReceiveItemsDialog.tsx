import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePurchaseMutations, type PurchaseOrderDetail } from "@/hooks/usePurchases";
import { formatNumber } from "@/lib/formatters";
import { mapGatewayError } from "@/lib/errors";

interface ReceiveItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrderDetail;
}

export function ReceiveItemsDialog({ open, onOpenChange, order }: ReceiveItemsDialogProps) {
  const { receiveItems } = usePurchaseMutations();
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      for (const it of order.items) {
        const pending = Number(it.quantity_ordered) - Number(it.quantity_received);
        init[it.id] = pending > 0 ? String(pending) : "0";
      }
      setQuantities(init);
    }
  }, [open, order.items]);

  const handleSubmit = async () => {
    const toReceive = order.items
      .map((it) => {
        const raw = quantities[it.id] ?? "0";
        const qty = Number(raw) || 0;
        return { itemId: it.id, quantityToReceive: qty };
      })
      .filter((x) => x.quantityToReceive > 0);

    if (toReceive.length === 0) {
      toast.error("Informe ao menos uma quantidade a receber.");
      return;
    }

    try {
      await receiveItems.mutateAsync({
        orderId: order.id,
        items: toReceive,
      });
      toast.success("Recebimento registrado.");
      onOpenChange(false);
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Receber itens — {order.code}</DialogTitle>
          <DialogDescription>
            Informe a quantidade efetivamente recebida de cada item. O estoque será atualizado
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {order.items.map((it) => {
            const ordered = Number(it.quantity_ordered);
            const received = Number(it.quantity_received);
            const pending = ordered - received;
            const done = pending <= 0;
            return (
              <div
                key={it.id}
                className="grid grid-cols-12 items-center gap-3 rounded-md border border-border/60 bg-bg-base/40 p-3"
              >
                <div className="col-span-7">
                  <div className="text-sm font-medium">{it.product_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {it.product?.sku} · pedido {formatNumber(ordered)} {it.product?.unit} · recebido{" "}
                    {formatNumber(received)}
                    {pending > 0 && (
                      <>
                        {" "}
                        · pendente {formatNumber(pending)} {it.product?.unit}
                      </>
                    )}
                  </div>
                </div>
                <div className="col-span-5">
                  <Label htmlFor={`recv-${it.id}`} className="text-xs text-muted-foreground">
                    Receber agora
                  </Label>
                  <Input
                    id={`recv-${it.id}`}
                    type="number"
                    step="0.001"
                    min="0"
                    max={pending}
                    disabled={done}
                    value={quantities[it.id] ?? "0"}
                    onChange={(e) =>
                      setQuantities((q) => ({
                        ...q,
                        [it.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={receiveItems.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={receiveItems.isPending}>
            {receiveItems.isPending ? "Registrando..." : "Confirmar recebimento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
