import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/formatters";
import type { TurnoverRow } from "@/hooks/useReports";

export function TurnoverReportTable({ rows }: { rows: TurnoverRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    const aCov = a.coverageDays ?? Number.POSITIVE_INFINITY;
    const bCov = b.coverageDays ?? Number.POSITIVE_INFINITY;
    return aCov - bCov;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead className="text-right">Estoque atual</TableHead>
          <TableHead className="text-right">Saídas no período</TableHead>
          <TableHead className="text-right">Giro</TableHead>
          <TableHead className="text-right">Cobertura (dias)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
              Sem dados.
            </TableCell>
          </TableRow>
        ) : (
          sorted.map((r) => {
            const coverageClass =
              r.coverageDays === null
                ? "text-muted-foreground"
                : r.coverageDays < 7
                  ? "text-destructive font-semibold"
                  : r.coverageDays < 15
                    ? "text-warning"
                    : "";
            return (
              <TableRow key={r.productId}>
                <TableCell>
                  <Link
                    to={`/products/${r.productId}`}
                    className="font-medium hover:text-accent-primary hover:underline"
                  >
                    {r.name}
                  </Link>
                  <div className="font-mono text-xs text-muted-foreground">{r.sku}</div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(r.currentStock)} {r.unit}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(r.qtyOut30d)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.turnover.toFixed(2)}x</TableCell>
                <TableCell className={`text-right tabular-nums ${coverageClass}`}>
                  {r.coverageDays !== null ? `${r.coverageDays.toFixed(1)}d` : "∞"}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
