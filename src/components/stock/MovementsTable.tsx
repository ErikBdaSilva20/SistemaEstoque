import { useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  RefreshCcw,
  Wrench,
  Download,
} from "lucide-react";
import { downloadXlsx } from "@/lib/import-export";
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
import { useMovements, type StockMovement } from "@/hooks/useMovements";
import { useMovementReasons } from "@/hooks/useMovementReasons";
import { formatNumber, formatDateTime } from "@/lib/formatters";
import { MovementFormDialog } from "./MovementFormDialog";

const TYPE_META = {
  in: {
    label: "Entrada",
    icon: ArrowDownCircle,
    className: "text-accent-success",
    sign: "+",
  },
  out: {
    label: "Saída",
    icon: ArrowUpCircle,
    className: "text-destructive",
    sign: "−",
  },
  adjustment: {
    label: "Ajuste",
    icon: Wrench,
    className: "text-warning",
    sign: "±",
  },
  transfer: {
    label: "Transferência",
    icon: ArrowLeftRight,
    className: "text-accent-primary",
    sign: "⇄",
  },
} as const;

const ORIGIN_LABELS: Record<StockMovement["origin"], string> = {
  manual: "Manual",
  purchase: "Compra",
  sale: "Venda",
  other: "Outro",
};

export function MovementsTable() {
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);

  const { data: movements = [], isLoading } = useMovements({
    origin: originFilter === "all" ? undefined : (originFilter as StockMovement["origin"]),
    limit: 200,
  });
  const { data: reasons = [] } = useMovementReasons(undefined, true);
  const reasonById = new Map(reasons.map((r) => [r.id, r.label]));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Select value={originFilter} onValueChange={setOriginFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="purchase">Compra</SelectItem>
            <SelectItem value="sale">Venda</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (movements.length === 0) return;
              downloadXlsx(
                `movimentacoes-${new Date().toISOString().slice(0, 10)}.xlsx`,
                movements.map((m) => ({
                  data: m.created_at,
                  tipo: m.type,
                  produto_sku: m.product?.sku ?? "",
                  produto_nome: m.product?.name ?? "",
                  quantidade: Number(m.quantity),
                  unidade: m.product?.unit ?? "",
                  origem: m.origin,
                  motivo: m.reason_id ? (reasonById.get(m.reason_id) ?? "") : "",
                })),
                "Movimentações",
              );
            }}
            disabled={movements.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setFormOpen(true)}>Registrar movimentação</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/hora</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  <RefreshCcw className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Sem movimentações ainda.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => {
                const meta = TYPE_META[m.type as keyof typeof TYPE_META] ?? TYPE_META.adjustment;
                const Icon = meta.icon;
                return (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(m.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{m.product?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{m.product?.sku}</div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${meta.className}`}
                      >
                        <Icon className="h-4 w-4" />
                        {meta.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={meta.className}>
                        {meta.sign} {formatNumber(Math.abs(Number(m.quantity)))}
                      </span>{" "}
                      <span className="text-xs text-muted-foreground">{m.product?.unit}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 font-normal">
                        {ORIGIN_LABELS[m.origin]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.reason_id ? (reasonById.get(m.reason_id) ?? "—") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <MovementFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
