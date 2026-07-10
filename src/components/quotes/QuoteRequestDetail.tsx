import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle2, FilePlus, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useQuoteRequest, useQuoteMutations } from "@/hooks/useQuotes";
import { formatBRL, formatDate, formatDateTime, formatNumber } from "@/lib/formatters";
import { mapGatewayError } from "@/lib/errors";

export function QuoteRequestDetail({ id }: { id: string }) {
  const { data, isLoading } = useQuoteRequest(id);
  const { markSent, convert, cancel } = useQuoteMutations();
  const navigate = useNavigate();

  const [sendOpen, setSendOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState<{
    supplierId: string;
    supplierName: string;
  } | null>(null);
  const [convertOpen, setConvertOpen] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Solicitação não encontrada.
      </div>
    );
  }

  const canSend = data.status === "draft" || data.status === "sent" || data.status === "receiving";
  const canClose = data.status !== "closed" && data.status !== "cancelled";

  // Fornecedores sem resposta (pra mostrar botão "Registrar resposta")
  const respondedIds = new Set(data.responses.map((r) => r.supplier_id));
  const pendingSuppliers = data.suppliers.filter((s) => !respondedIds.has(s.supplierId));

  // Melhor preço total
  const bestTotal = Math.min(...data.responses.map((r) => Number(r.total_amount)));

  const handleCancel = () => {
    if (!confirm("Cancelar esta solicitação? Não poderá ser reaberta.")) return;
    cancel.mutate(id, {
      onSuccess: () => toast.success("Solicitação cancelada."),
      onError: (e) => toast.error(mapGatewayError(e)),
    });
  };

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/quotes">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{data.code}</h1>
            <StatusBadge status={data.status} />
          </div>
          <p className="mt-1 text-sm">{data.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Criada {formatDateTime(data.created_at)}
            {data.deadline && ` · Prazo: ${formatDate(data.deadline)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSend && (
            <Button onClick={() => setSendOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Enviar / Reenviar
            </Button>
          )}
          {canClose && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="text-destructive hover:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
          {data.converted_to_order_id && (
            <Button asChild variant="outline">
              <Link to={`/purchases/${data.converted_to_order_id}`}>Ver pedido gerado</Link>
            </Button>
          )}
        </div>
      </div>

      {data.notes && (
        <Card className="mb-4 rounded-2xl">
          <CardContent className="py-4">
            <div className="text-xs font-medium uppercase text-muted-foreground">
              Instruções aos fornecedores
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{data.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Itens solicitados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {data.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{i.product?.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {i.product?.sku}
                    {i.notes ? ` · ${i.notes}` : ""}
                  </div>
                </div>
                <div className="text-sm font-medium tabular-nums">
                  {formatNumber(i.quantity)} {i.product?.unit}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-4 rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Respostas ({data.responses.length})</span>
            {pendingSuppliers.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {pendingSuppliers.length} aguardando
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.responses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma resposta registrada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {data.responses.map((r) => {
                const isBest = Number(r.total_amount) === bestTotal;
                const isWinner = data.winning_response_id === r.id;
                return (
                  <div
                    key={r.id}
                    className={`rounded-lg border p-4 ${
                      isWinner
                        ? "border-accent-success/40 bg-accent-success/5"
                        : isBest
                          ? "border-accent-primary/40 bg-accent-primary/5"
                          : "border-border bg-bg-base/40"
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.supplierName}</span>
                          {isWinner && (
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-accent-success/15 text-accent-success"
                            >
                              <Trophy className="h-3 w-3" />
                              Vencedor
                            </Badge>
                          )}
                          {!isWinner && isBest && (
                            <Badge
                              variant="secondary"
                              className="bg-accent-primary/15 text-accent-primary"
                            >
                              Melhor preço
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Recebido em {formatDateTime(r.received_at)}
                          {r.delivery_days != null && ` · ${r.delivery_days}d entrega`}
                          {r.payment_terms && ` · ${r.payment_terms}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold tabular-nums">
                          {formatBRL(Number(r.total_amount))}
                        </div>
                        {data.status !== "closed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1"
                            onClick={() => setConvertOpen(r.id)}
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Selecionar vencedor
                          </Button>
                        )}
                      </div>
                    </div>

                    {r.notes && <p className="mt-1 text-xs text-muted-foreground">{r.notes}</p>}

                    {/* Breakdown de items */}
                    <div className="mt-2 rounded-md bg-background p-2 text-xs">
                      {(
                        r.items as Array<{
                          productId: string;
                          unitPrice: number;
                          quantityOffered: number;
                        }>
                      ).map((it, idx) => {
                        const product = data.items.find(
                          (x) => x.productId === it.productId,
                        )?.product;
                        return (
                          <div key={idx} className="flex justify-between py-0.5">
                            <span className="truncate">{product?.name ?? it.productId}</span>
                            <span className="font-mono tabular-nums">
                              {formatNumber(it.quantityOffered)} × {formatBRL(it.unitPrice)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pendingSuppliers.length > 0 &&
            data.status !== "closed" &&
            data.status !== "cancelled" && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  Registrar resposta manualmente
                </div>
                <div className="flex flex-wrap gap-2">
                  {pendingSuppliers.map((s) => (
                    <Button
                      key={s.supplierId}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setResponseOpen({
                          supplierId: s.supplierId,
                          supplierName: s.supplier?.name ?? "—",
                        })
                      }
                    >
                      <FilePlus className="mr-1 h-3 w-3" />
                      {s.supplier?.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Fornecedores cotados */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">
            Fornecedores cotados ({data.suppliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {data.suppliers.map((s) => {
              const hasResponse = respondedIds.has(s.supplierId);
              return (
                <li key={s.supplierId} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{s.supplier?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.supplier?.email && <>📧 {s.supplier.email} </>}
                      {s.supplier?.phone && <>📱 {s.supplier.phone}</>}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    {s.sentAt ? (
                      <span className="text-muted-foreground">
                        Enviado em {formatDateTime(s.sentAt)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Não enviado</span>
                    )}
                    <div className={hasResponse ? "text-accent-success" : "text-warning"}>
                      {hasResponse ? "✓ Respondeu" : "Aguardando"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Dialog enviar/reenviar */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar solicitação</DialogTitle>
            <DialogDescription>
              Marca a solicitação como enviada. O envio via WhatsApp/email é manual nesta versão
              (v1) — o comprador manda a cotação por fora e registra a resposta de cada fornecedor
              depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                markSent.mutate(id, {
                  onSuccess: () => {
                    toast.success("Solicitação marcada como enviada.");
                    setSendOpen(false);
                  },
                  onError: (e) => toast.error(mapGatewayError(e)),
                });
              }}
              disabled={markSent.isPending}
            >
              {markSent.isPending ? "Enviando..." : "Enviar agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog registrar resposta */}
      {responseOpen && (
        <RegisterResponseDialog
          open={!!responseOpen}
          onOpenChange={(o) => !o && setResponseOpen(null)}
          requestId={id}
          supplier={responseOpen}
          items={data.items.map((i) => ({
            productId: i.productId,
            productName: i.product?.name ?? "",
            productSku: i.product?.sku ?? "",
            productUnit: i.product?.unit ?? "",
            quantityRequested: i.quantity,
          }))}
          onSaved={() => setResponseOpen(null)}
        />
      )}

      {/* Dialog converter em PO */}
      {convertOpen && (
        <Dialog open={!!convertOpen} onOpenChange={(o) => !o && setConvertOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecionar vencedor e gerar pedido?</DialogTitle>
              <DialogDescription>
                Esta resposta será marcada como vencedora. Um pedido de compra será criado
                (rascunho) com os itens e valores desta resposta. A solicitação será fechada e não
                aceitará mais respostas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConvertOpen(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  convert.mutate(
                    { responseId: convertOpen },
                    {
                      onSuccess: (po) => {
                        toast.success("Pedido de compra gerado.");
                        navigate(`/purchases/${po.id}`);
                      },
                      onError: (e) => toast.error(mapGatewayError(e)),
                    },
                  );
                }}
                disabled={convert.isPending}
                className="bg-accent-success hover:bg-accent-success/90"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Confirmar e gerar pedido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
    sent: { label: "Enviada", className: "bg-accent-primary/15 text-accent-primary" },
    receiving: { label: "Recebendo respostas", className: "bg-warning/15 text-warning" },
    closed: { label: "Fechada", className: "bg-accent-success/15 text-accent-success" },
    cancelled: { label: "Cancelada", className: "bg-destructive/15 text-destructive" },
    winner_pending_approval: {
      label: "Vencedor pendente de aprovação",
      className: "bg-warning/15 text-warning",
    },
  };
  const m = map[status] ?? { label: status, className: "" };
  return (
    <Badge variant="secondary" className={m.className}>
      {m.label}
    </Badge>
  );
}

interface RegisterResponseDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  requestId: string;
  supplier: { supplierId: string; supplierName: string };
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    productUnit: string;
    quantityRequested: number;
  }>;
  onSaved: () => void;
}

function RegisterResponseDialog({
  open,
  onOpenChange,
  requestId,
  supplier,
  items,
  onSaved,
}: RegisterResponseDialogProps) {
  const { addResponse } = useQuoteMutations();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, string>>(
    items.reduce(
      (acc, i) => {
        acc[i.productId] = String(i.quantityRequested);
        return acc;
      },
      {} as Record<string, string>,
    ),
  );
  const [deliveryDays, setDeliveryDays] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");

  const total = items.reduce((acc, i) => {
    const price = Number(prices[i.productId] ?? 0);
    const qty = Number(quantities[i.productId] ?? 0);
    return acc + price * qty;
  }, 0);

  const canSave = items.every((i) => {
    const p = Number(prices[i.productId]);
    return !isNaN(p) && p >= 0;
  });

  const handleSave = () => {
    addResponse.mutate(
      {
        quoteId: requestId,
        supplierId: supplier.supplierId,
        items: items.map((i) => ({
          productId: i.productId,
          unitPrice: Number(prices[i.productId] ?? 0),
          quantityOffered: Number(quantities[i.productId] ?? i.quantityRequested),
        })),
        deliveryDays: deliveryDays ? Number(deliveryDays) : null,
        paymentTerms: paymentTerms.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(`Resposta de ${supplier.supplierName} registrada.`);
          onSaved();
        },
        onError: (e) => toast.error(mapGatewayError(e)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resposta de {supplier.supplierName}</DialogTitle>
          <DialogDescription>
            Informe o preço unitário e quantidade oferecida pra cada item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {items.map((i) => (
            <div
              key={i.productId}
              className="grid grid-cols-12 items-center gap-2 rounded-md border border-border bg-bg-base/40 p-2"
            >
              <div className="col-span-6 min-w-0">
                <div className="truncate text-sm font-medium">{i.productName}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{i.productSku}</div>
              </div>
              <div className="col-span-3">
                <Label className="text-[10px] text-muted-foreground">Qtd. ({i.productUnit})</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={quantities[i.productId] ?? ""}
                  onChange={(e) =>
                    setQuantities((q) => ({
                      ...q,
                      [i.productId]: e.target.value,
                    }))
                  }
                  className="text-xs"
                />
              </div>
              <div className="col-span-3">
                <Label className="text-[10px] text-muted-foreground">Preço unit. (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={prices[i.productId] ?? ""}
                  onChange={(e) =>
                    setPrices((p) => ({
                      ...p,
                      [i.productId]: e.target.value,
                    }))
                  }
                  className="text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Prazo de entrega (dias)</Label>
            <Input
              type="number"
              min="0"
              placeholder="Ex: 7"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Condições de pagamento</Label>
            <Input
              placeholder="Ex: 30 dias, 2x30/60"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Observações do fornecedor</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex items-center justify-between rounded-md bg-muted/50 p-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatBRL(total)}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave || addResponse.isPending}>
            {addResponse.isPending ? "Salvando..." : "Salvar resposta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
