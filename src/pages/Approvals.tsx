import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck,
  ShieldAlert,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePendingApprovals, type PendingApproval } from "@/hooks/usePurchaseRules";
import { usePurchaseMutations } from "@/hooks/usePurchases";
import {
  usePurchaseRequests,
  usePurchaseRequestMutations,
  type PurchaseRequest,
} from "@/hooks/usePurchaseRequests";
import { formatBRL, formatDateTime } from "@/lib/formatters";
import { mapGatewayError } from "@/lib/errors";

export default function Approvals() {
  const { data: pendingPo = [], isLoading: loadingPo } = usePendingApprovals();
  const { data: pendingPr = [], isLoading: loadingPr } = usePurchaseRequests("pending_approval");
  const poMutations = usePurchaseMutations();
  const prMutations = usePurchaseRequestMutations();

  const [approvePoTarget, setApprovePoTarget] = useState<PendingApproval | null>(null);
  const [rejectPoTarget, setRejectPoTarget] = useState<PendingApproval | null>(null);
  const [approvePrTarget, setApprovePrTarget] = useState<PurchaseRequest | null>(null);
  const [rejectPrTarget, setRejectPrTarget] = useState<PurchaseRequest | null>(null);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");

  const totalPending = pendingPo.length + pendingPr.length;

  // ------- PO handlers -------
  const handleApprovePo = () => {
    if (!approvePoTarget) return;
    poMutations.approve.mutate(
      { orderId: approvePoTarget.orderId, comment: comment.trim() || null },
      {
        onSuccess: () => {
          toast.success(`Pedido ${approvePoTarget.order.code} aprovado.`);
          setApprovePoTarget(null);
          setComment("");
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  const handleRejectPo = () => {
    if (!rejectPoTarget) return;
    if (reason.trim().length < 3) {
      toast.error("Informe o motivo (mín. 3 caracteres).");
      return;
    }
    poMutations.reject.mutate(
      { orderId: rejectPoTarget.orderId, comment: reason.trim() },
      {
        onSuccess: () => {
          toast.success(`Pedido ${rejectPoTarget.order.code} rejeitado.`);
          setRejectPoTarget(null);
          setReason("");
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  // ------- PR handlers -------
  const handleApprovePr = () => {
    if (!approvePrTarget) return;
    prMutations.approve.mutate(
      { id: approvePrTarget.id, comment: comment.trim() || null },
      {
        onSuccess: () => {
          toast.success(`Solicitação ${approvePrTarget.code} aprovada.`);
          setApprovePrTarget(null);
          setComment("");
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  const handleRejectPr = () => {
    if (!rejectPrTarget) return;
    if (reason.trim().length < 3) {
      toast.error("Informe o motivo (mín. 3 caracteres).");
      return;
    }
    prMutations.reject.mutate(
      { id: rejectPrTarget.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(`Solicitação ${rejectPrTarget.code} rejeitada.`);
          setRejectPrTarget(null);
          setReason("");
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Aprovações pendentes
        </h1>
        <p className="mt-1 text-muted-foreground">
          {totalPending === 0
            ? "Nenhum item pendente no momento."
            : `${totalPending} ${totalPending === 1 ? "item aguardando" : "itens aguardando"} sua análise.`}
        </p>
      </div>

      <Tabs defaultValue="pr" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pr" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Solicitações
            {pendingPr.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-warning/20 text-warning">
                {pendingPr.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="po" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos de compra
            {pendingPo.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-warning/20 text-warning">
                {pendingPo.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ============ PR TAB ============ */}
        <TabsContent value="pr">
          {loadingPr ? (
            <Skeleton className="h-48 w-full" />
          ) : pendingPr.length === 0 ? (
            <EmptyState message="Nenhuma solicitação aguardando aprovação." />
          ) : (
            <div className="space-y-3">
              {pendingPr.map((pr) => (
                <Card key={pr.id} className="rounded-2xl shadow-elevation-1">
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileCheck className="h-4 w-4 text-accent-primary" />
                        {pr.code} — {pr.title}
                        <Badge variant="secondary" className="bg-warning/15 text-warning">
                          Aguardando aprovação
                        </Badge>
                        {pr.priority !== "normal" && (
                          <Badge variant="outline" className="capitalize">
                            {pr.priority}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pr.submitted_at && <>Submetida em {formatDateTime(pr.submitted_at)}</>}
                        {pr.expected_date && (
                          <>
                            {" "}
                            · Necessário em {new Date(pr.expected_date).toLocaleDateString("pt-BR")}
                          </>
                        )}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/requests/${pr.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        Ver detalhe
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pr.justification && (
                      <div className="rounded-md border border-border bg-bg-base/40 p-3 text-sm">
                        <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                          Justificativa do solicitante
                        </div>
                        <p className="whitespace-pre-wrap">{pr.justification}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setApprovePrTarget(pr);
                          setComment("");
                        }}
                        className="bg-accent-success hover:bg-accent-success/90"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectPrTarget(pr);
                          setReason("");
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============ PO TAB ============ */}
        <TabsContent value="po">
          {loadingPo ? (
            <Skeleton className="h-48 w-full" />
          ) : pendingPo.length === 0 ? (
            <EmptyState message="Nenhum pedido de compra aguardando aprovação." />
          ) : (
            <div className="space-y-3">
              {pendingPo.map((p) => (
                <Card key={p.id} className="rounded-2xl shadow-elevation-1">
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldAlert className="h-4 w-4 text-warning" />
                        {p.order.code}
                        <Badge variant="secondary" className="bg-warning/15 text-warning">
                          Aguardando aprovação
                        </Badge>
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Fornecedor: <strong>{p.order.supplierName ?? "—"}</strong> · Total:{" "}
                        <strong className="tabular-nums">
                          {formatBRL(Number(p.order.totalAmount))}
                        </strong>
                        · Cotações: <strong>{p.order.quotesCount}</strong>
                        {p.order.submittedAt && (
                          <> · Submetido em {formatDateTime(p.order.submittedAt)}</>
                        )}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/purchases/${p.order.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        Ver detalhe
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {p.order.justification && (
                      <div className="rounded-md border border-border bg-bg-base/40 p-3 text-sm">
                        <div className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                          Justificativa do comprador
                        </div>
                        <p className="whitespace-pre-wrap">{p.order.justification}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setApprovePoTarget(p);
                          setComment("");
                        }}
                        className="bg-accent-success hover:bg-accent-success/90"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectPoTarget(p);
                          setReason("");
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============ Dialogs PO ============ */}
      <Dialog open={!!approvePoTarget} onOpenChange={(o) => !o && setApprovePoTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar pedido {approvePoTarget?.order.code}?</DialogTitle>
            <DialogDescription>
              O pedido vai pra status <strong>enviado</strong> e fica pronto pra ser recebido.
              Comentário opcional.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovePoTarget(null)}
              disabled={poMutations.approve.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprovePo}
              disabled={poMutations.approve.isPending}
              className="bg-accent-success hover:bg-accent-success/90"
            >
              Confirmar aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectPoTarget} onOpenChange={(o) => !o && setRejectPoTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar pedido {rejectPoTarget?.order.code}?</DialogTitle>
            <DialogDescription>
              O pedido será cancelado. O motivo fica registrado no histórico.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição (obrigatório)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectPoTarget(null)}
              disabled={poMutations.reject.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPo}
              disabled={poMutations.reject.isPending}
            >
              Rejeitar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Dialogs PR ============ */}
      <Dialog open={!!approvePrTarget} onOpenChange={(o) => !o && setApprovePrTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar solicitação {approvePrTarget?.code}?</DialogTitle>
            <DialogDescription>
              A solicitação ficará pronta pra ser convertida em cotação ou pedido. Comentário
              opcional.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovePrTarget(null)}
              disabled={prMutations.approve.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprovePr}
              disabled={prMutations.approve.isPending}
              className="bg-accent-success hover:bg-accent-success/90"
            >
              Confirmar aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectPrTarget} onOpenChange={(o) => !o && setRejectPrTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação {rejectPrTarget?.code}?</DialogTitle>
            <DialogDescription>
              O solicitante será notificado e a solicitação será encerrada.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição (obrigatório)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectPrTarget(null)}
              disabled={prMutations.reject.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPr}
              disabled={prMutations.reject.isPending}
            >
              Rejeitar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-2xl border-dashed">
      <CardContent className="py-12 text-center">
        <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-accent-success opacity-60" />
        <p className="font-medium">Nada pendente!</p>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
