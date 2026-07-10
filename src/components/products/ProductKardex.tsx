import { Link } from "react-router-dom";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Download, Wrench } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { useKardex, type KardexEntry } from "@/hooks/useKardex";
import { formatBRL, formatDateTime, formatNumber } from "@/lib/formatters";
import { downloadXlsx } from "@/lib/import-export";

const TYPE_META = {
  entrada: { label: "Entrada", icon: ArrowDownCircle, className: "text-accent-success", sign: "+" },
  saida: { label: "Saída", icon: ArrowUpCircle, className: "text-destructive", sign: "−" },
  ajuste: { label: "Ajuste", icon: Wrench, className: "text-warning", sign: "±" },
  transferencia: {
    label: "Transferência",
    icon: ArrowLeftRight,
    className: "text-accent-primary",
    sign: "⇄",
  },
} as const;

const ORIGIN_LABELS: Record<KardexEntry["origin"], string> = {
  manual: "Manual",
  purchase: "Compra",
  sale: "Venda",
  other: "Outro",
};

export function ProductKardex({ productId }: { productId: string }) {
  const { data, isLoading } = useKardex(productId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Produto não encontrado.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric
          label="Saldo atual"
          value={`${formatNumber(data.currentBalance)} ${data.product.unit}`}
          tone={
            data.currentBalance <= 0
              ? "destructive"
              : data.currentBalance < Number(data.product.min_stock)
                ? "warning"
                : "default"
          }
        />
        <Metric label="Custo médio (WAC)" value={formatBRL(data.weightedAvgCost)} />
        <Metric
          label="Saídas 30d"
          value={`${formatNumber(data.totalOut30d)} ${data.product.unit}`}
        />
        <Metric
          label="Cobertura"
          value={data.daysOfStock !== null ? `${data.daysOfStock.toFixed(1)} dias` : "—"}
          tone={data.daysOfStock !== null && data.daysOfStock < 7 ? "warning" : "default"}
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Extrato de movimentações</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadXlsx(
              `kardex-${data.product.sku}-${new Date().toISOString().slice(0, 10)}.xlsx`,
              data.entries.map((e) => ({
                data: e.createdAt,
                tipo: e.type,
                origem: e.origin,
                quantidade: e.quantity,
                saldo_apos: e.runningBalance,
                custo_medio: e.weightedAvgCost,
              })),
              "Kardex",
            )
          }
          disabled={data.entries.length === 0}
        >
          <Download className="mr-2 h-3 w-3" />
          Exportar
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Qtd.</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Custo médio</TableHead>
              <TableHead>Referência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  Nenhuma movimentação registrada.
                </TableCell>
              </TableRow>
            ) : (
              data.entries.map((e) => {
                const meta = TYPE_META[e.type];
                const Icon = meta.icon;
                return (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDateTime(e.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${meta.className}`}
                      >
                        <Icon className="h-4 w-4" />
                        {meta.label}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 font-normal">
                        {ORIGIN_LABELS[e.origin]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={meta.className}>
                        {meta.sign} {formatNumber(Math.abs(e.quantity))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatNumber(e.runningBalance)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatBRL(e.weightedAvgCost)}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                      {e.referenceId && e.origin === "purchase" ? (
                        <Link
                          to={`/purchases/${e.referenceId}`}
                          className="text-accent-primary hover:underline"
                        >
                          Recebimento
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "destructive";
}) {
  const toneClass =
    tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}
