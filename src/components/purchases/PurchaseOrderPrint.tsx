import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatBRL, formatDate, formatDateTime, formatNumber } from "@/lib/formatters";
import type { PurchaseOrderDetail } from "@/hooks/usePurchases";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrderDetail;
}

export function PurchaseOrderPrint({ open, onOpenChange, order }: Props) {
  useEffect(() => {
    if (open) {
      const prev = document.title;
      document.title = `Pedido ${order.code}`;
      return () => {
        document.title = prev;
      };
    }
  }, [open, order.code]);

  const subtotal = order.items.reduce(
    (acc, it) => acc + Number(it.quantity_ordered) * Number(it.unit_cost),
    0,
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="print:hidden">
          <DialogTitle>Imprimir pedido {order.code}</DialogTitle>
        </DialogHeader>

        <div className="print-page-a4 bg-white p-8 text-black text-sm">
          <div className="mb-6 flex items-start justify-between border-b border-gray-300 pb-4">
            <div>
              <div className="text-xs uppercase text-gray-500">Pedido de compra</div>
              <div className="text-2xl font-bold">{order.code}</div>
            </div>
            <div className="text-right text-xs text-gray-700">
              <div>Emissão: {formatDateTime(order.created_at)}</div>
              {order.expected_date && <div>Previsão: {formatDate(order.expected_date)}</div>}
              {order.sent_at && <div>Enviado: {formatDateTime(order.sent_at)}</div>}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase text-gray-500">
                Fornecedor
              </div>
              <div className="font-medium">{order.supplier?.name ?? "—"}</div>
              {order.supplier?.cnpj && (
                <div className="text-xs text-gray-700">CNPJ {order.supplier.cnpj}</div>
              )}
              {order.supplier?.email && (
                <div className="text-xs text-gray-700">{order.supplier.email}</div>
              )}
              {order.supplier?.phone && (
                <div className="text-xs text-gray-700">{order.supplier.phone}</div>
              )}
              {order.supplier?.lead_time_days != null && (
                <div className="text-xs text-gray-700">
                  Lead time: {order.supplier.lead_time_days} dia(s)
                </div>
              )}
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Status</div>
              <div className="font-medium capitalize">{order.status.replace("_", " ")}</div>
            </div>
          </div>

          <table className="mb-4 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2 text-left">Item</th>
                <th className="py-2 text-left">SKU</th>
                <th className="py-2 text-right">Qtd.</th>
                <th className="py-2 text-right">Custo unit.</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-b border-gray-100">
                  <td className="py-2">{it.product_name}</td>
                  <td className="py-2 font-mono">{it.product?.sku ?? ""}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatNumber(it.quantity_ordered)} {it.product?.unit}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatBRL(Number(it.unit_cost))}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium">
                    {formatBRL(Number(it.quantity_ordered) * Number(it.unit_cost))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-400">
                <td colSpan={4} className="py-2 text-right font-semibold">
                  Total
                </td>
                <td className="py-2 text-right tabular-nums font-bold">{formatBRL(subtotal)}</td>
              </tr>
            </tfoot>
          </table>

          {order.notes && (
            <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-3">
              <div className="text-[10px] font-semibold uppercase text-gray-500">Observações</div>
              <div className="whitespace-pre-wrap text-xs">{order.notes}</div>
            </div>
          )}

          <div className="mt-12 grid grid-cols-2 gap-16 text-center text-xs">
            <div>
              <div className="mb-8 border-b border-gray-400"></div>
              <div className="text-gray-700">Assinatura do comprador</div>
            </div>
            <div>
              <div className="mb-8 border-b border-gray-400"></div>
              <div className="text-gray-700">Assinatura do fornecedor</div>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir / Salvar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
