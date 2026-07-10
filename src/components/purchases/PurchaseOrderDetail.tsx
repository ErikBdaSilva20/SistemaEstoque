import { useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft, Ban, ClipboardCheck, PackageCheck, Printer, Send, Truck } from "lucide-react";
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
import { formatBRL, formatDate, formatDateTime, formatNumber } from "@/lib/formatters";
import { ReceiveItemsDialog } from "./ReceiveItemsDialog";
import { PurchaseOrderPrint } from "./PurchaseOrderPrint";
import { PoCheckDialog } from "./PoCheckDialog";
import { PurchaseChainBreadcrumb } from "./PurchaseChainBreadcrumb";
import { mapGatewayError } from "@/lib/errors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STATUS_META: Record<PurchaseOrder["status"], { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  pending_approval: {
    label: "Aguardando aprovação",
    className: "bg-warning/15 text-warning",
  },
  approved: { label: "Aprovado", className: "bg-accent-success/15 text-accent-success" },
  rejected: { label: "Rejeitado", className: "bg-destructive/15 text-destructive" },
  sent: { label: "Enviado", className: "bg-accent-primary/15 text-accent-primary" },
  delivered_pending_check: {
    label: "Entregue — aguardando conferência",
    className: "bg-accent-primary/20 text-accent-primary",
  },
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
  const { submit, cancel, markDelivered } = usePurchaseMutations();
  const { data: rules } = usePurchaseRules();
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [declaredQuotes, setDeclaredQuotes] = useState<string>("");
  const [justification, setJustification] = useState("");

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

  // Decide whether to show "Mark delivered" or "Receive directly" -- depends on the rules.
  const total = Number(order.total_amount);
  const requiresCheck =
    rules?.requires_delivery_check === true ||
    (rules?.delivery_check_min_amount != null && total >= Number(rules.delivery_check_min_amount));

  const canMarkDelivered =
    requiresCheck && (order.status === "sent" || order.status === "partially_received");
  const canReceiveDirect =
    !requiresCheck && (order.status === "sent" || order.status === "partially_received");
  const canCheck = order.status === "delivered_pending_check";
  const canCancel =
    order.status === "draft" ||
    order.status === "sent" ||
    order.status === "partially_received" ||
    order.status === "delivered_pending_check";

  const minQuotes = rules?.min_quotes_required ?? 0;
  const amountThreshold = rules?.approval_min_amount ?? null;
  const currentQuotes = order.quotes_count ?? 0;
  const mayNeedJustification =
    rules?.requires_justification_below_min_quotes && minQuotes > 0 && currentQuotes < minQuotes;
  const mayNeedApproval = amountThreshold != null && total >= Number(amountThreshold);
  const needsDialog = mayNeedJustification || mayNeedApproval;

  const openSendFlow = () => {
    if (!needsDialog) {
      submit.mutate(
        { orderId: order.id, justification: null, needsApproval: false },
        {
          onSuccess: () => toast.success("Pedido enviado ao fornecedor."),
          onError: (e) => toast.error(mapGatewayError(e)),
        },
      );
      return;
    }
    setDeclaredQuotes(String(Math.max(currentQuotes, 0)));
    setJustification(order.justification ?? "");
    setSubmitOpen(true);
  };

  const confirmSend = () => {
    const n = Number(declaredQuotes);
    const declared = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    const needsJust =
      rules?.requires_justification_below_min_quotes && minQuotes > 0 && declared < minQuotes;

    if (needsJust && justification.trim().length < 10) {
      toast.error(
        "Justificativa obrigatória (mín. 10 caracteres) quando cotações < mínimo exigido.",
      );
      return;
    }

    submit.mutate(
      {
        orderId: order.id,
        justification: justification.trim() || null,
        needsApproval: mayNeedApproval,
      },
      {
        onSuccess: () => {
          toast.success(
            mayNeedApproval ? "Pedido enviado pra aprovação." : "Pedido enviado ao fornecedor.",
          );
          setSubmitOpen(false);
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  const handleCancel = () => {
    cancel.mutate(order.id, {
      onSuccess: () => {
        toast.success("Pedido cancelado.");
        setCancelOpen(false);
      },
      onError: (e) => {
        toast.error(mapGatewayError(e));
        setCancelOpen(false);
      },
    });
  };

  const handleMarkDelivered = () => {
    markDelivered.mutate(
      { orderId: order.id, deliveredAt: null, needsCheck: requiresCheck },
      {
        onSuccess: () => {
          toast.success(
            requiresCheck
              ? "Entrega registrada. Pedido aguardando conferência."
              : "Entrega registrada.",
          );
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
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

      <PurchaseChainBreadcrumb
        pr={null}
        rfq={null}
        po={{ id: order.id, code: order.code }}
        receivedFull={order.status === "fully_received"}
        active={order.status === "fully_received" ? "received" : "po"}
      />

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
          <Button variant="outline" asChild>
            <Link to={`/purchases/${order.id}/accountability`}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Prestação de contas
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setPrintOpen(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {canSend && (
            <Button onClick={openSendFlow} disabled={submit.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Enviar ao fornecedor
            </Button>
          )}
          {canMarkDelivered && (
            <Button
              variant="outline"
              onClick={handleMarkDelivered}
              disabled={markDelivered.isPending}
            >
              <Truck className="mr-2 h-4 w-4" />
              {markDelivered.isPending ? "Registrando..." : "Marcar como entregue"}
            </Button>
          )}
          {canCheck && (
            <Button onClick={() => setCheckOpen(true)}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Conferir entrega
            </Button>
          )}
          {canReceiveDirect && (
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

      {order.items.length > 0 && (
        <ReceiveItemsDialog open={receiveOpen} onOpenChange={setReceiveOpen} order={order} />
      )}

      <PoCheckDialog open={checkOpen} onOpenChange={setCheckOpen} order={order} />

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

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar pedido ao fornecedor</DialogTitle>
            <DialogDescription>
              {mayNeedApproval && (
                <span className="block">
                  Valor <strong>{formatBRL(total)}</strong> está acima do limite que exige aprovação
                  ({formatBRL(Number(amountThreshold))}). Após enviar, o pedido ficará em{" "}
                  <em>Aguardando aprovação</em>.
                </span>
              )}
              {mayNeedJustification && (
                <span className="block mt-1">
                  A regra da empresa exige <strong>{minQuotes}</strong> cotações. Se você obteve
                  menos, é necessário justificar.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="declared-quotes" className="text-xs">
                Nº de cotações que você obteve
              </Label>
              <Input
                id="declared-quotes"
                type="number"
                min="0"
                step="1"
                value={declaredQuotes}
                onChange={(e) => setDeclaredQuotes(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Mínimo exigido: {minQuotes || "—"}
              </p>
            </div>

            <div>
              <Label htmlFor="justification" className="text-xs">
                Justificativa {mayNeedJustification && "*"}
              </Label>
              <Textarea
                id="justification"
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: fornecedor exclusivo; urgência produção; etc."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubmitOpen(false)}
              disabled={submit.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmSend} disabled={submit.isPending}>
              {submit.isPending ? "Enviando..." : "Confirmar envio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
