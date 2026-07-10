import { Link } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/formatters";
import type { StockoutEvent } from "@/hooks/useReports";

export function StockoutsReportTable({ rows }: { rows: StockoutEvent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>Rompeu em</TableHead>
          <TableHead>Há quantos dias</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 opacity-30" />
              Nenhuma ruptura no período. 🎉
            </TableCell>
          </TableRow>
        ) : (
          rows.map((r) => (
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
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(r.stockoutAt)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={r.daysAgo === 0 ? "bg-destructive/15 text-destructive gap-1" : "gap-1"}
                >
                  <Clock className="h-3 w-3" />
                  {r.daysAgo === 0 ? "agora" : `${r.daysAgo} dia${r.daysAgo === 1 ? "" : "s"}`}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
