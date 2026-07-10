import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Eye, Plus } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountSessions, type CountSession } from "@/hooks/useCountSessions";
import { formatDateTime } from "@/lib/formatters";
import { NewCountSessionDialog } from "./NewCountSessionDialog";

const STATUS_META: Record<CountSession["status"], { label: string; className: string }> = {
  open: { label: "Aberta", className: "bg-accent-primary/15 text-accent-primary" },
  closed: { label: "Fechada", className: "bg-accent-success/15 text-accent-success" },
  cancelled: { label: "Cancelada", className: "bg-destructive/15 text-destructive" },
};

export function CountSessionsTable() {
  const [filter, setFilter] = useState<string>("open");
  const status = filter === "all" ? undefined : (filter as CountSession["status"]);
  const { data: sessions = [], isLoading } = useCountSessions(status);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="open">Abertas</SelectItem>
            <SelectItem value="closed">Fechadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova contagem
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Aberta em</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16"></TableHead>
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
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Nenhuma contagem encontrada.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((s) => {
                const meta = STATUS_META[s.status];
                const pct = s.itemsTotal > 0 ? (s.itemsCounted / s.itemsTotal) * 100 : 0;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm font-medium">{s.code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      {s.category && (
                        <div className="text-xs text-muted-foreground">categoria: {s.category}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.locationName ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateTime(s.opened_at)}
                    </TableCell>
                    <TableCell className="min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {s.itemsCounted}/{s.itemsTotal}
                        </span>
                      </div>
                      {s.itemsWithDiff > 0 && (
                        <div className="mt-1 text-[10px] text-warning">
                          {s.itemsWithDiff} com diferença
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={meta.className} variant="secondary">
                        {meta.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/counts/${s.id}`}>
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

      <NewCountSessionDialog open={newOpen} onOpenChange={setNewOpen} />
    </>
  );
}
