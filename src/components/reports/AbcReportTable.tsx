import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatBRL, formatNumber } from "@/lib/formatters";
import type { AbcRow } from "@/hooks/useReports";

const CLASS_META = {
  A: { label: "A", className: "bg-accent-success/15 text-accent-success" },
  B: { label: "B", className: "bg-warning/15 text-warning" },
  C: { label: "C", className: "bg-muted text-muted-foreground" },
} as const;

export function AbcReportTable({ rows }: { rows: AbcRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16 text-center">Classe</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead className="text-right">Qtd. vendida</TableHead>
          <TableHead className="text-right">Receita</TableHead>
          <TableHead className="text-right">% acumulado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
              Sem dados de venda no período.
            </TableCell>
          </TableRow>
        ) : (
          rows.map((r) => {
            const meta = CLASS_META[r.class];
            return (
              <TableRow key={r.productId}>
                <TableCell className="text-center">
                  <Badge className={meta.className} variant="secondary">
                    {meta.label}
                  </Badge>
                </TableCell>
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
                  {formatNumber(r.qtySold30d)} {r.unit}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatBRL(r.revenue30d)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {(r.cumulativeShare * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
