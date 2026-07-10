import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Eye, FileCheck, FileX, Send, ShoppingCart, FileQuestion } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePurchaseRequests, type PurchaseRequest } from "@/hooks/usePurchaseRequests";
import { formatDate } from "@/lib/formatters";

const STATUS_META: Record<
  PurchaseRequest["status"],
  { label: string; className: string; icon: typeof FileCheck }
> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground", icon: FileQuestion },
  pending_approval: {
    label: "Aguardando aprovação",
    className: "bg-warning/15 text-warning",
    icon: Send,
  },
  approved: {
    label: "Aprovada",
    className: "bg-accent-success/15 text-accent-success",
    icon: FileCheck,
  },
  rejected: { label: "Rejeitada", className: "bg-destructive/15 text-destructive", icon: FileX },
  converted: {
    label: "Convertida",
    className: "bg-accent-primary/15 text-accent-primary",
    icon: ShoppingCart,
  },
  cancelled: { label: "Cancelada", className: "bg-muted text-muted-foreground", icon: FileX },
};

const PRIORITY_META: Record<PurchaseRequest["priority"], { label: string; className: string }> = {
  low: { label: "Baixa", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-accent-primary/15 text-accent-primary" },
  high: { label: "Alta", className: "bg-warning/15 text-warning" },
  urgent: { label: "Urgente", className: "bg-destructive/15 text-destructive" },
};

interface Props {
  status?: PurchaseRequest["status"];
  search?: string;
}

export function PurchaseRequestsTable({ status, search }: Props) {
  const { data: items = [], isLoading } = usePurchaseRequests(status);

  const filtered = useMemo<PurchaseRequest[]>(() => {
    if (!search?.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) => i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q),
    );
  }, [items, search]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (filtered.length === 0) {
    return (
      <Card className="rounded-2xl p-10 text-center">
        <FileQuestion className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-60" />
        <p className="font-medium">Nenhuma solicitação por aqui.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Crie uma solicitação pra dar início a um fluxo de compra.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl shadow-elevation-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Previsão</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((pr) => {
            const meta = STATUS_META[pr.status];
            const pmeta = PRIORITY_META[pr.priority];
            const Icon = meta.icon;
            return (
              <TableRow key={pr.id}>
                <TableCell className="font-mono text-sm">{pr.code}</TableCell>
                <TableCell className="max-w-md truncate">{pr.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={pmeta.className}>
                    {pmeta.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={meta.className}>
                    <Icon className="mr-1 h-3 w-3" />
                    {meta.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {pr.expected_date ? formatDate(pr.expected_date) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/requests/${pr.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      Abrir
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
