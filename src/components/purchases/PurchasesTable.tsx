import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Eye } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePurchaseOrders, type PurchaseOrder } from "@/hooks/usePurchases";
import { formatBRL, formatDate } from "@/lib/formatters";

const STATUS_META: Record<PurchaseOrder["status"], { label: string; className: string }> = {
  draft: {
    label: "Rascunho",
    className: "bg-muted text-muted-foreground",
  },
  pending_approval: {
    label: "Aguarda aprovação",
    className: "bg-warning/15 text-warning",
  },
  approved: {
    label: "Aprovado",
    className: "bg-accent-primary/15 text-accent-primary",
  },
  rejected: {
    label: "Rejeitado",
    className: "bg-destructive/15 text-destructive",
  },
  sent: {
    label: "Enviado",
    className: "bg-accent-primary/15 text-accent-primary",
  },
  delivered_pending_check: {
    label: "Aguarda conferência",
    className: "bg-warning/15 text-warning",
  },
  partially_received: {
    label: "Parcial",
    className: "bg-warning/15 text-warning",
  },
  fully_received: {
    label: "Recebido",
    className: "bg-accent-success/15 text-accent-success",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-destructive/15 text-destructive",
  },
};

export function PurchasesTable() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const status = statusFilter === "all" ? undefined : (statusFilter as PurchaseOrder["status"]);
  const { data: orders = [], isLoading } = usePurchaseOrders(status);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="pending_approval">Aguarda aprovação</SelectItem>
            <SelectItem value="sent">Enviado</SelectItem>
            <SelectItem value="partially_received">Parcialmente recebido</SelectItem>
            <SelectItem value="fully_received">Recebido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild>
          <Link to="/purchases/new">Novo pedido</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Previsão</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => {
                const meta = STATUS_META[o.status];
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-sm font-medium">{o.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{o.supplier?.name ?? "—"}</div>
                      {o.supplier?.lead_time_days != null && (
                        <div className="text-xs text-muted-foreground">
                          lead time {o.supplier.lead_time_days}d
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {o.expected_date ? formatDate(o.expected_date) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatBRL(Number(o.total_amount))}
                    </TableCell>
                    <TableCell>
                      <Badge className={meta.className} variant="secondary">
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild title="Abrir pedido">
                        <Link to={`/purchases/${o.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
