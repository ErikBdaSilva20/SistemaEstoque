import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowLeft,
  Ban,
  Check,
  PackageCheck,
  Printer,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurchaseOrder, usePurchaseMutations, type PurchaseOrder } from "@/hooks/usePurchases";
import { usePurchaseRules } from "@/hooks/usePurchaseRules";
import { useAuth } from "@/hooks/useAuth";
import { listStockMovements } from "@/lib/data/stock_movements.repo";
import { formatBRL, formatDate, formatDateTime, formatNumber } from "@/lib/formatters";
import { ReceiveItemsDialog } from "./ReceiveItemsDialog";
import { PurchaseOrderPrint } from "./PurchaseOrderPrint";
import { toastSuccess, toastError } from "@/lib/toast";

const STATUS_META: Record<PurchaseOrder["status"], { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  pending_approval: {
    label: "Aguardando aprovação",
    className: "bg-warning/15 text-warning",
  },
  rejected: { label: "Rejeitado", className: "bg-destructive/15 text-destructive" },
  sent: { label: "Enviado", className: "bg-accent-primary/15 text-accent-primary" },
  partially_received: {
    label: "Parcialmente recebido",
    className: "bg-warning/15 text-warning",
  },
  fully_received: {
    label: "Recebido",
    className: "bg-accent-success/15 text-accent-success",
  },
  cancelled: { label: "Cancelado", className: "bg-destructive/15 text-destructive" },
};

export function PurchaseOrderDetail({ id }: { id: string }) {
  const { data: order, isLoading } = usePurchaseOrder(id);
  const { submit, approve, reject, cancel } = usePurchaseMutations();
  const { data: rules } = usePurchaseRules();
  const { isAdmin, isManager } = useAuth();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const { data: receipts = [] } = useQuery({
    queryKey: ["purchase-receipts", id],
    enabled: !!order,
    queryFn: async () => {
      const movements = await listStockMovements();
      return movements
        .filter((m) => m.reference_id === id && m.type === "in")
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Pedido não encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/purchases">Voltar para a lista</Link>
        </Button>
      </div>
    );
  }

  const meta = STATUS_META[order.status];
  const canSend = order.status === "draft";
  const canReceive = order.status === "sent" || order.status === "partially_received";
  const canApprove = order.status === "pending_approval" && (isAdmin || isManager);
  const canCancel =
    order.status === "draft" || order.status === "sent" || order.status === "partially_received";

  const total = Number(order.total_amount);
  const amountThreshold = rules?.approval_min_amount ?? null;
  const needsApproval = amountThreshold != null && total >= Number(amountThreshold);

  const handleSend = () => {
    submit.mutate(
      { orderId: order.id, needsApproval },
      {
        onSuccess: () => {
          toastSuccess(
            needsApproval ? "Pedido enviado pra aprovação." : "Pedido enviado ao fornecedor.",
          );
        },
        onError: (e) => toastError(e),
      },
    );
  };

  const handleApprove = () => {
    approve.mutate(
      { orderId: order.id },
      {
        onSuccess: () => toastSuccess("Pedido aprovado."),
        onError: (e) => toastError(e),
      },
    );
  };

  const handleReject = () => {
    reject.mutate(
      { orderId: order.id, comment: "" },
      {
        onSuccess: () => toastSuccess("Pedido rejeitado."),
        onError: (e) => toastError(e),
      },
    );
  };

  const handleCancel = () => {
    cancel.mutate(order.id, {
      onSuccess: () => {
        toastSuccess("Pedido cancelado.");
        setCancelOpen(false);
      },
      onError: (e) => {
        toastError(e);
        setCancelOpen(false);
      },
    });
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/purchases">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Pedido {order.code}
            </h1>
            <Badge className={meta.className} variant="secondary">
              {meta.label}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Criado em {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPrintOpen(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {canSend && (
            <Button onClick={handleSend} disabled={submit.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Enviar ao fornecedor
            </Button>
          )}
          {canApprove && (
            <>
              <Button onClick={handleApprove} disabled={approve.isPending}>
                <Check className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={reject.isPending}
                className="text-destructive hover:text-destructive"
              >
                <X className="mr-2 h-4 w-4" />
                Rejeitar
              </Button>
            </>
          )}
          {canReceive && (
            <Button onClick={() => setReceiveOpen(true)}>
              <PackageCheck className="mr-2 h-4 w-4" />
              Receber itens
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancelar pedido
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <InfoCard label="Fornecedor" value={order.supplier?.name ?? "—"}>
          {order.supplier && (
            <div className="mt-1 text-xs text-muted-foreground">
              {order.supplier.email ?? ""}
              {order.supplier.phone ? ` · ${order.supplier.phone}` : ""}
              {order.supplier.lead_time_days ? ` · lead ${order.supplier.lead_time_days}d` : ""}
            </div>
          )}
        </InfoCard>
        <InfoCard
          label="Previsão"
          value={order.expected_date ? formatDate(order.expected_date) : "—"}
        />
        <InfoCard label="Total" value={formatBRL(Number(order.total_amount))} />
      </div>

      {order.notes && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
            Observações
          </div>
          <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Pedido</TableHead>
              <TableHead className="text-right">Recebido</TableHead>
              <TableHead className="text-right">Pendente</TableHead>
              <TableHead className="text-right">Custo unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((it) => {
              const ordered = Number(it.quantity_ordered);
              const received = Number(it.quantity_received);
              const pending = ordered - received;
              const subtotal = ordered * Number(it.unit_cost);
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
                  <TableCell
                    className={`text-right tabular-nums ${pending > 0 ? "text-warning" : "text-muted-foreground"}`}
                  >
                    {formatNumber(pending)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(it.unit_cost))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatBRL(subtotal)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {receipts.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-elevation-1">
          <div className="flex items-center gap-2 border-b border-border p-4">
            <ArrowDownCircle className="h-4 w-4 text-accent-success" />
            <h2 className="text-sm font-medium">Recebimentos ({receipts.length})</h2>
          </div>
          <ul className="divide-y divide-border text-sm">
            {receipts.map((r) => (
              <li key={r.id} className="flex items-start justify-between p-4">
                <div>
                  <div className="font-medium">{r.product_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(r.created_at)}
                  </div>
                </div>
                <span className="font-semibold tabular-nums text-accent-success">
                  +{formatNumber(Number(r.quantity))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.items.length > 0 && (
        <ReceiveItemsDialog open={receiveOpen} onOpenChange={setReceiveOpen} order={order} />
      )}

      <PurchaseOrderPrint open={printOpen} onOpenChange={setPrintOpen} order={order} />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Itens já recebidos permanecem no estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function InfoCard({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-medium">{value}</div>
      {children}
    </div>
  );
}
