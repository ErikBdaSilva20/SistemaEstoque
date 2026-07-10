import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, Plus, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCountSession,
  useCountSessionMutations,
  type CountItemWithRefs,
} from "@/hooks/useCountSessions";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import { AddCountItemDialog } from "./AddCountItemDialog";
import { mapGatewayError } from "@/lib/errors";

export function CountSessionDetail({ id }: { id: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useCountSession(id);
  const { updateItem, close, cancel } = useCountSessionMutations();

  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    if (!s) return data.items;
    return data.items.filter(
      (i) =>
        (i.product?.name ?? "").toLowerCase().includes(s) ||
        (i.product?.sku ?? "").toLowerCase().includes(s) ||
        (i.product?.barcode ?? "").toLowerCase().includes(s),
    );
  }, [data, search]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, counted: 0, withDiff: 0, diffQty: 0 };
    let counted = 0;
    let withDiff = 0;
    let diffQty = 0;
    for (const i of data.items) {
      if (i.counted_quantity !== null && i.counted_quantity !== undefined) {
        counted++;
        const diff = Number(i.counted_quantity) - Number(i.expected_quantity);
        if (diff !== 0) {
          withDiff++;
          diffQty += diff;
        }
      }
    }
    return { total: data.items.length, counted, withDiff, diffQty };
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Sessão não encontrada.
      </div>
    );
  }

  const { session, items } = data;
  const isOpen = session.status === "open";
  const pct = stats.total > 0 ? (stats.counted / stats.total) * 100 : 0;

  const handleClose = () => {
    close.mutate(session.id, {
      onSuccess: (r) => {
        toast.success(`Contagem fechada. ${r.adjustments} ajuste(s) aplicados.`);
        setCloseOpen(false);
        navigate("/counts");
      },
      onError: (e) => {
        toast.error(mapGatewayError(e));
        setCloseOpen(false);
      },
    });
  };

  const handleCancel = () => {
    cancel.mutate(session.id, {
      onSuccess: () => {
        toast.success("Sessão cancelada.");
        setCancelOpen(false);
        navigate("/counts");
      },
      onError: (e) => {
        toast.error(mapGatewayError(e));
        setCancelOpen(false);
      },
    });
  };

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/counts">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{session.code}</h1>
            <Badge
              variant="secondary"
              className={
                session.status === "open"
                  ? "bg-accent-primary/15 text-accent-primary"
                  : session.status === "closed"
                    ? "bg-accent-success/15 text-accent-success"
                    : "bg-destructive/15 text-destructive"
              }
            >
              {session.status === "open"
                ? "Aberta"
                : session.status === "closed"
                  ? "Fechada"
                  : "Cancelada"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.name} · aberta em {formatDateTime(session.opened_at)}
            {session.locationName ? ` · ${session.locationName}` : ""}
          </p>
        </div>
        {isOpen && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAddOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar produto
            </Button>
            <Button onClick={() => setCloseOpen(true)} disabled={stats.counted === 0}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Fechar contagem
            </Button>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <StatBox label="Itens totais" value={formatNumber(stats.total)} tone="default" />
        <StatBox label="Contados" value={`${stats.counted} (${pct.toFixed(0)}%)`} tone="success" />
        <StatBox
          label="Com diferença"
          value={formatNumber(stats.withDiff)}
          tone={stats.withDiff > 0 ? "warning" : "default"}
        />
        <StatBox
          label="Diferença total"
          value={
            stats.diffQty > 0 ? `+${formatNumber(stats.diffQty)}` : formatNumber(stats.diffQty)
          }
          tone={stats.diffQty !== 0 ? "warning" : "default"}
        />
      </div>

      <Progress value={pct} className="mb-6 h-2" />

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, SKU, código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Sistema</TableHead>
              <TableHead className="w-[160px] text-right">Contado</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  Nenhum item.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  editable={isOpen}
                  onUpdate={(qty) =>
                    updateItem.mutate({
                      itemId: item.id,
                      countedQuantity: qty,
                    })
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar contagem?</AlertDialogTitle>
            <AlertDialogDescription>
              {stats.withDiff} item(ns) com diferença gerarão {stats.withDiff} ajuste(s) de estoque.
              {stats.total - stats.counted > 0 && (
                <>
                  {" "}
                  {stats.total - stats.counted} item(ns) não contado(s) serão ignorados (estoque
                  mantido).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>Fechar contagem</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as contagens serão descartadas. Nenhum ajuste é aplicado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar sessão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddCountItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        sessionId={session.id}
        existingProductIds={items
          .map((i) => i.product?.id)
          .filter((id): id is string => Boolean(id))}
      />
    </>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success" ? "text-accent-success" : tone === "warning" ? "text-warning" : "";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

function ItemRow({
  item,
  editable,
  onUpdate,
}: {
  item: CountItemWithRefs;
  editable: boolean;
  onUpdate: (qty: number | null) => void;
}) {
  const [local, setLocal] = useState(
    item.counted_quantity !== null && item.counted_quantity !== undefined
      ? String(item.counted_quantity)
      : "",
  );

  const expected = Number(item.expected_quantity);
  const counted =
    item.counted_quantity !== null && item.counted_quantity !== undefined
      ? Number(item.counted_quantity)
      : null;
  const diff = counted !== null ? counted - expected : null;

  const handleBlur = () => {
    const trimmed = local.trim();
    if (trimmed === "") {
      if (counted !== null) onUpdate(null);
      return;
    }
    const n = Number(trimmed.replace(",", "."));
    if (isNaN(n)) return;
    if (n !== counted) onUpdate(n);
  };

  return (
    <TableRow
      className={
        diff !== null && diff !== 0 ? "bg-warning/5" : counted !== null ? "bg-accent-success/5" : ""
      }
    >
      <TableCell>
        <div className="font-medium">{item.product?.name ?? "—"}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {item.product?.sku}
          {item.product?.barcode ? ` · ${item.product.barcode}` : ""}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(expected)} {item.product?.unit}
      </TableCell>
      <TableCell className="text-right">
        {editable ? (
          <Input
            type="number"
            step="0.001"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-32 tabular-nums text-right"
            placeholder="—"
          />
        ) : counted !== null ? (
          <span className="tabular-nums">{formatNumber(counted)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {diff === null ? (
          <span className="text-xs text-muted-foreground">não contado</span>
        ) : diff === 0 ? (
          <Badge variant="secondary" className="bg-accent-success/15 text-accent-success">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            ok
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className={
              diff > 0
                ? "bg-accent-success/15 text-accent-success gap-1"
                : "bg-warning/15 text-warning gap-1"
            }
          >
            <AlertTriangle className="h-3 w-3" />
            {diff > 0 ? "+" : ""}
            {formatNumber(diff)}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
