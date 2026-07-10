import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, FileText, Plus } from "lucide-react";
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
import { useQuoteRequests, type Quote } from "@/hooks/useQuotes";
import { formatDate } from "@/lib/formatters";

const STATUS_META: Record<Quote["status"], { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  sent: { label: "Enviada", className: "bg-accent-primary/15 text-accent-primary" },
  receiving: { label: "Recebendo", className: "bg-warning/15 text-warning" },
  closed: { label: "Fechada", className: "bg-accent-success/15 text-accent-success" },
  cancelled: { label: "Cancelada", className: "bg-destructive/15 text-destructive" },
  winner_pending_approval: {
    label: "Vencedor pendente",
    className: "bg-warning/15 text-warning",
  },
};

export function QuotesTable() {
  const [filter, setFilter] = useState<string>("all");
  const status = filter === "all" ? undefined : (filter as Quote["status"]);
  const { data: quotes = [], isLoading } = useQuoteRequests(status);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="sent">Enviadas</SelectItem>
            <SelectItem value="receiving">Recebendo respostas</SelectItem>
            <SelectItem value="closed">Fechadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild>
          <Link to="/quotes/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova solicitação
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="text-right">Fornecedores</TableHead>
              <TableHead className="text-right">Respostas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Nenhuma solicitação de orçamento.
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((q) => {
                const meta = STATUS_META[q.status];
                return (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-sm font-medium">{q.code}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{q.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {q.deadline ? formatDate(q.deadline) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {q.supplierCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {q.responseCount ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge className={meta.className} variant="secondary">
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/quotes/${q.id}`}>
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
