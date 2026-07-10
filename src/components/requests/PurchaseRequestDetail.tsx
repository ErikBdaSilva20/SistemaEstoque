import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  FileCheck,
  FileQuestion,
  FileText,
  FileX,
  Send,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  usePurchaseRequest,
  usePurchaseRequestMutations,
  type PurchaseRequest,
} from "@/hooks/usePurchaseRequests";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL, formatDate, formatDateTime, formatNumber } from "@/lib/formatters";
import { mapGatewayError } from "@/lib/errors";
import { ConvertToRfqDialog } from "./ConvertToRfqDialog";
import { ConvertToPoDialog } from "./ConvertToPoDialog";
import { PurchaseChainBreadcrumb } from "@/components/purchases/PurchaseChainBreadcrumb";

const STATUS_META: Record<
  PurchaseRequest["status"],
  { label: string; className: string; icon: typeof FileCheck }
> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground", icon: FileQuestion },
  pending_approval: {
    label: "Aguardando aprovação",
    className: "bg-warning/15 text-warning",
    icon: Send,
  },
  approved: {
    label: "Aprovada",
    className: "bg-accent-success/15 text-accent-success",
    icon: FileCheck,
  },
  rejected: { label: "Rejeitada", className: "bg-destructive/15 text-destructive", icon: FileX },
  converted: {
    label: "Convertida",
    className: "bg-accent-primary/15 text-accent-primary",
    icon: ShoppingCart,
  },
  cancelled: { label: "Cancelada", className: "bg-muted text-muted-foreground", icon: FileX },
};

const PRIORITY_META: Record<PurchaseRequest["priority"], { label: string; className: string }> = {
  low: { label: "Baixa", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-accent-primary/15 text-accent-primary" },
  high: { label: "Alta", className: "bg-warning/15 text-warning" },
  urgent: { label: "Urgente", className: "bg-destructive/15 text-destructive" },
};

export function PurchaseRequestDetail({ id }: { id: string }) {
  const { data: pr, isLoading } = usePurchaseRequest(id);
  const { isAdmin, isManager, user } = useAuth();
  const canApprove = isAdmin || isManager;
  const { submit, approve, reject, cancel } = usePurchaseRequestMutations();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitJust, setSubmitJust] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rfqOpen, setRfqOpen] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!pr) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">Solicitação não encontrada.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/requests">Voltar para a lista</Link>
        </Button>
      </div>
    );
  }

  const meta = STATUS_META[pr.status];
  const pmeta = PRIORITY_META[pr.priority];
  const StatusIcon = meta.icon;
  const isOwner = pr.owner_id === user?.id;
  const totalEstimated = pr.items.reduce(
    (acc, it) => acc + Number(it.quantity) * Number(it.estimated_unit_cost ?? 0),
    0,
  );

  const canSubmit = pr.status === "draft" && (isOwner || canApprove);
  const canDecide = pr.status === "pending_approval" && canApprove;
  const canConvert = pr.status === "approved" && canApprove;
  const canCancel =
    canApprove &&
    (pr.status === "draft" || pr.status === "pending_approval" || pr.status === "approved");

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/requests">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <PurchaseChainBreadcrumb
        pr={{ id: pr.id, code: pr.code }}
        rfq={pr.converted_to_quote_id ? { id: pr.converted_to_quote_id, code: "RFQ" } : null}
        po={pr.converted_to_order_id ? { id: pr.converted_to_order_id, code: "PO" } : null}
        active="pr"
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Solicitação {pr.code}
            </h1>
            <Badge className={meta.className} variant="secondary">
              <StatusIcon className="mr-1 h-3 w-3" />
              {meta.label}
            </Badge>
            <Badge className={pmeta.className} variant="secondary">
              {pmeta.label}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {pr.title} · criada em {formatDateTime(pr.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canSubmit && (
            <Button onClick={() => setSubmitOpen(true)} disabled={submit.isPending}>
              <Send className="mr-2 h-4 w-4" />
              Enviar para aprovação
            </Button>
          )}
          {canDecide && (
            <>
              <Button
                onClick={() => setApproveOpen(true)}
                className="bg-accent-success hover:bg-accent-success/90"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rejeitar
              </Button>
            </>
          )}
          {canConvert && (
            <>
              <Button onClick={() => setRfqOpen(true)} variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Converter em cotação
              </Button>
              <Button onClick={() => setPoOpen(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Converter em pedido
              </Button>
            </>
          )}
          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <InfoCard
          label="Data desejada"
          value={pr.expected_date ? formatDate(pr.expected_date) : "—"}
        />
        <InfoCard label="Itens" value={String(pr.items.length)} />
        <InfoCard label="Estimativa total" value={formatBRL(totalEstimated)} />
      </div>

      {pr.justification && (
        <Card className="mb-4 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm">Justificativa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{pr.justification}</p>
          </CardContent>
        </Card>
      )}

      {pr.status === "rejected" && pr.rejection_reason && (
        <Card className="mb-4 rounded-2xl border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Motivo da rejeição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{pr.rejection_reason}</p>
            {pr.rejected_at && (
              <p className="mt-1 text-xs text-muted-foreground">
                em {formatDateTime(pr.rejected_at)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="text-right">Custo est.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pr.items.map((it) => {
              const q = Number(it.quantity);
              const c = Number(it.estimated_unit_cost ?? 0);
              return (
                <TableRow key={it.id}>
                  <TableCell>
                    <div className="font-medium">{it.product?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{it.product?.sku}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(q)} {it.product?.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {it.estimated_unit_cost == null ? "—" : formatBRL(c)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {it.estimated_unit_cost == null ? "—" : formatBRL(q * c)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{it.notes ?? "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Submit dialog */}
      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar solicitação para aprovação?</DialogTitle>
            <DialogDescription>
              Após enviar, você não poderá mais editar. Inclua uma justificativa se quiser reforçar
              o motivo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={submitJust}
            onChange={(e) => setSubmitJust(e.target.value)}
            placeholder="Justificativa adicional (opcional)"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmitOpen(false)}
              disabled={submit.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                submit.mutate(
                  { id: pr.id, justification: submitJust.trim() || null },
                  {
                    onSuccess: () => {
                      toast.success("Solicitação enviada.");
                      setSubmitOpen(false);
                      setSubmitJust("");
                    },
                    onError: (e) => toast.error(mapGatewayError(e)),
                  },
                );
              }}
              disabled={submit.isPending}
            >
              Confirmar envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar {pr.code}?</DialogTitle>
            <DialogDescription>
              Após aprovar, você poderá converter em cotação ou criar pedido direto.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={2}
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            placeholder="Comentário (opcional)"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={approve.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                approve.mutate(
                  { id: pr.id, comment: approveComment.trim() || null },
                  {
                    onSuccess: () => {
                      toast.success("Solicitação aprovada.");
                      setApproveOpen(false);
                      setApproveComment("");
                    },
                    onError: (e) => toast.error(mapGatewayError(e)),
                  },
                );
              }}
              disabled={approve.isPending}
              className="bg-accent-success hover:bg-accent-success/90"
            >
              Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar {pr.code}?</DialogTitle>
            <DialogDescription>
              Informe o motivo. O solicitante poderá criar uma nova versão ajustada.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo da rejeição (obrigatório)"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={reject.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectReason.trim().length < 3) {
                  toast.error("Informe o motivo (mín. 3 caracteres).");
                  return;
                }
                reject.mutate(
                  { id: pr.id, reason: rejectReason.trim() },
                  {
                    onSuccess: () => {
                      toast.success("Solicitação rejeitada.");
                      setRejectOpen(false);
                      setRejectReason("");
                    },
                    onError: (e) => toast.error(mapGatewayError(e)),
                  },
                );
              }}
              disabled={reject.isPending}
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar solicitação?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. A solicitação ficará marcada como cancelada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancel.isPending}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                cancel.mutate(pr.id, {
                  onSuccess: () => {
                    toast.success("Solicitação cancelada.");
                    setCancelOpen(false);
                  },
                  onError: (e) => toast.error(mapGatewayError(e)),
                });
              }}
              disabled={cancel.isPending}
            >
              Cancelar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConvertToRfqDialog
        open={rfqOpen}
        onOpenChange={setRfqOpen}
        requestId={pr.id}
        defaultTitle={pr.title}
      />
      <ConvertToPoDialog open={poOpen} onOpenChange={setPoOpen} requestId={pr.id} />
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-medium">{value}</div>
    </div>
  );
}
