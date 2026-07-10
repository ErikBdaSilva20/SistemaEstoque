import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  FileText,
  History,
  Link as LinkIcon,
  Trophy,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurchaseOrder } from "@/hooks/usePurchases";
import { listQuotes } from "@/lib/data/quotes.repo";
import { listQuoteResponses } from "@/lib/data/quote_responses.repo";
import { listSuppliers } from "@/lib/data/suppliers.repo";
import { listPurchaseApprovals } from "@/lib/data/purchase_approvals.repo";
import { listStockMovements } from "@/lib/data/stock_movements.repo";
import { listProducts } from "@/lib/data/products.repo";
import { listStockDestinations } from "@/lib/data/stock_destinations.repo";
import { formatBRL, formatDateTime, formatNumber } from "@/lib/formatters";

export function PurchaseAccountability({ orderId }: { orderId: string }) {
  const { data: order, isLoading } = usePurchaseOrder(orderId);

  // Source quote (if this PO came from an RFQ -- looked up via converted_to_order_id)
  const { data: sourceQuote } = useQuery({
    queryKey: ["purchase-source-quote", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const [quotes, responses, suppliers] = await Promise.all([
        listQuotes(),
        listQuoteResponses(),
        listSuppliers(),
      ]);
      const quote = quotes.find((q) => q.converted_to_order_id === orderId);
      if (!quote) return null;
      const supplierById = new Map(suppliers.map((s) => [s.id, s]));
      return {
        ...quote,
        responses: responses
          .filter((r) => r.quote_id === quote.id)
          .map((r) => ({ ...r, supplier: supplierById.get(r.supplier_id) ?? null })),
      };
    },
  });

  // PO approvals
  const { data: approvals = [] } = useQuery({
    queryKey: ["purchase-approvals", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const rows = await listPurchaseApprovals();
      return rows
        .filter((a) => a.purchase_order_id === orderId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
  });

  // Inbound movements (PO receipts) and outbound movements of the same products
  const { data: receipts = [] } = useQuery({
    queryKey: ["purchase-receipts", orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const [movements, products] = await Promise.all([listStockMovements(), listProducts()]);
      const productById = new Map(products.map((p) => [p.id, p]));
      return movements
        .filter((m) => m.reference_id === orderId && m.type === "in")
        .map((m) => ({ ...m, product: productById.get(m.product_id) ?? null }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },
  });

  const { data: outgoings = [] } = useQuery({
    queryKey: ["purchase-outgoings", orderId],
    enabled: !!orderId && !!order,
    queryFn: async () => {
      if (!order) return [];
      const productIds = order.items.map((i) => i.product_id);
      if (productIds.length === 0) return [];
      const sinceIso = order.received_at ?? order.created_at;
      const [movements, products, destinations] = await Promise.all([
        listStockMovements(),
        listProducts(),
        listStockDestinations(),
      ]);
      const productById = new Map(products.map((p) => [p.id, p]));
      const destinationById = new Map(destinations.map((d) => [d.id, d]));
      return movements
        .filter(
          (m) => m.type === "out" && productIds.includes(m.product_id) && m.created_at >= sinceIso,
        )
        .map((m) => ({
          ...m,
          product: productById.get(m.product_id) ?? null,
          destination: m.destination_id ? (destinationById.get(m.destination_id) ?? null) : null,
        }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 100);
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!order) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Pedido não encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER resumo */}
      <Card className="rounded-2xl shadow-elevation-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-accent-primary" />
            Prestação de contas — {order.code}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SmallStat label="Fornecedor" value={order.supplier?.name ?? "—"} />
            <SmallStat label="Total" value={formatBRL(Number(order.total_amount))} />
            <SmallStat label="Cotações" value={String(order.quotes_count ?? 0)} />
            <SmallStat label="Status" value={order.status} />
          </div>
          {order.justification && (
            <div className="mt-3 rounded-md bg-warning/5 border border-warning/30 p-3 text-sm">
              <div className="mb-1 text-xs font-medium uppercase text-warning">
                Justificativa do comprador
              </div>
              {order.justification}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 1. Orçamentos (se veio de um RFQ) */}
      {sourceQuote && (
        <Card className="rounded-2xl shadow-elevation-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="h-4 w-4 text-accent-primary" />
              Origem: Solicitação de orçamento{" "}
              <code className="font-mono text-sm">{sourceQuote.code}</code>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm text-muted-foreground">{sourceQuote.title}</p>
            <div className="space-y-2">
              {sourceQuote.responses
                .sort((a, b) => Number(a.total_amount) - Number(b.total_amount))
                .map((r) => {
                  const isWinner = r.id === sourceQuote.winning_response_id;
                  return (
                    <div
                      key={r.id}
                      className={`rounded-md border p-3 text-sm ${
                        isWinner
                          ? "border-accent-success/40 bg-accent-success/5"
                          : "border-border bg-bg-base/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.supplier?.name ?? r.supplier_name}</span>
                          {isWinner && (
                            <Badge
                              variant="secondary"
                              className="gap-1 bg-accent-success/15 text-accent-success"
                            >
                              <Trophy className="h-3 w-3" />
                              Escolhido
                            </Badge>
                          )}
                        </div>
                        <span className="font-semibold tabular-nums">
                          {formatBRL(Number(r.total_amount))}
                        </span>
                      </div>
                      {(r.delivery_days != null || r.payment_terms) && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {r.delivery_days != null && `${r.delivery_days}d entrega`}
                          {r.payment_terms && ` · ${r.payment_terms}`}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Aprovações */}
      {approvals.length > 0 && (
        <Card className="rounded-2xl shadow-elevation-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-accent-primary" />
              Histórico de aprovações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {approvals.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-2 rounded-md border border-border bg-bg-base/40 p-3"
                >
                  {a.decision === "approved" && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-success" />
                  )}
                  {a.decision === "rejected" && (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  {a.decision === "pending" && (
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium capitalize">
                      {a.decision === "approved"
                        ? "Aprovado"
                        : a.decision === "rejected"
                          ? "Rejeitado"
                          : "Pendente"}
                    </div>
                    {a.comment && <p className="text-xs">{a.comment}</p>}
                    {a.justification && (
                      <p className="text-xs text-muted-foreground">
                        Justificativa: {a.justification}
                      </p>
                    )}
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {a.decided_at
                        ? formatDateTime(a.decided_at)
                        : `criado ${formatDateTime(a.created_at)}`}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 3. Recebimento / entrada em estoque */}
      <Card className="rounded-2xl shadow-elevation-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownCircle className="h-4 w-4 text-accent-success" />
            Entrada em estoque ({receipts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma entrada registrada ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {receipts.map((r) => (
                <li key={r.id} className="flex items-start justify-between py-2">
                  <div>
                    <div className="font-medium">{r.product_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{r.product?.sku}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(r.created_at)}
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-accent-success">
                    +{formatNumber(Number(r.quantity))} {r.product?.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 4. Saídas (destino) */}
      {outgoings.length > 0 && (
        <Card className="rounded-2xl shadow-elevation-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpCircle className="h-4 w-4 text-destructive" />
              Saídas dos produtos desde o recebimento ({outgoings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {outgoings.map((o) => (
                <li key={o.id} className="flex items-start justify-between py-2">
                  <div>
                    <div className="font-medium">{o.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.destination && (
                        <span className="font-medium text-accent-primary">
                          → {o.destination.name} ·{" "}
                        </span>
                      )}
                      {formatDateTime(o.created_at)}
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums text-destructive">
                    −{formatNumber(Number(o.quantity))} {o.product?.unit}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-base/40 p-2">
      <div className="text-[10px] font-medium uppercase text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  );
}
