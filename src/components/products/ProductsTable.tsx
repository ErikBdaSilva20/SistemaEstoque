import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Package,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Search,
  Upload,
  Download,
  Printer,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, useProductMutations, type Product } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatBRL, formatNumber } from "@/lib/formatters";
import { downloadXlsx } from "@/lib/import-export";
import { useAuth } from "@/hooks/useAuth";
import { ProductFormDialog } from "./ProductFormDialog";
import { ProductsImportDialog } from "@/components/import/ProductsImportDialog";
import { LabelsPrintDialog } from "@/components/labels/LabelsPrintDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { mapGatewayError } from "@/lib/errors";

export function ProductsTable({
  initialOnlyLowStock = false,
}: {
  initialOnlyLowStock?: boolean;
} = {}) {
  const { isAdmin, isManager } = useAuth();
  const canManage = isAdmin || isManager;
  const [search, setSearch] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(initialOnlyLowStock);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: products = [], isLoading } = useProducts({
    includeInactive: true,
    onlyLowStock,
  });
  const { data: suppliers = [] } = useSuppliers(true);
  const { toggleActive, remove } = useProductMutations();

  const supplierNameById = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s.name])),
    [suppliers],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const s = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        (p.barcode ?? "").toLowerCase().includes(s) ||
        (p.category ?? "").toLowerCase().includes(s),
    );
  }, [products, search]);

  const handleEdit = (p: Product) => {
    setEditTarget(p);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Produto removido.");
        setDeleteTarget(null);
      },
      onError: (e) => {
        toast.error(mapGatewayError(e));
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, SKU, código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant={onlyLowStock ? "default" : "outline"}
          onClick={() => setOnlyLowStock((v) => !v)}
        >
          Só críticos
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (filtered.length === 0) return;
            downloadXlsx(
              `produtos-${new Date().toISOString().slice(0, 10)}.xlsx`,
              filtered.map((p) => ({
                sku: p.sku,
                nome: p.name,
                barcode: p.barcode ?? "",
                categoria: p.category ?? "",
                unidade: p.unit,
                custo: Number(p.cost_price),
                preco: Number(p.sale_price),
                estoque_atual: Number(p.current_stock),
                estoque_minimo: Number(p.min_stock),
                fornecedor: p.supplier_id ? (supplierNameById.get(p.supplier_id) ?? "") : "",
                ativo: p.active ? "sim" : "não",
              })),
              "Produtos",
            );
          }}
          disabled={filtered.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button
          variant="outline"
          onClick={() => setLabelsOpen(true)}
          disabled={selected.size === 0 && filtered.length === 0}
        >
          <Printer className="mr-2 h-4 w-4" />
          {selected.size > 0 ? `Etiquetas (${selected.size})` : "Etiquetas"}
        </Button>
        {canManage && (
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button onClick={handleNew}>Novo produto</Button>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Selecionar todos"
                  checked={filtered.length > 0 && filtered.every((p) => selected.has(p.id))}
                  onCheckedChange={(v) => {
                    if (v) {
                      setSelected(new Set(filtered.map((p) => p.id)));
                    } else {
                      setSelected(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Mín.</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={canManage ? 9 : 8}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 9 : 8}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  {search || onlyLowStock
                    ? "Nenhum produto encontrado com esses filtros."
                    : "Nenhum produto cadastrado. Clique em 'Novo produto' para começar."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const low = Number(p.current_stock) < Number(p.min_stock) && p.active;
                return (
                  <TableRow key={p.id} data-state={selected.has(p.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Selecionar ${p.name}`}
                        checked={selected.has(p.id)}
                        onCheckedChange={(v) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (v) next.add(p.id);
                            else next.delete(p.id);
                            return next;
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/products/${p.id}`}
                        className="font-medium text-text-primary hover:text-accent-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                      {p.barcode && (
                        <div className="text-xs text-muted-foreground">{p.barcode}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell className="text-muted-foreground">{p.category ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={low ? "font-semibold text-destructive" : undefined}>
                        {formatNumber(p.current_stock)}
                      </span>{" "}
                      <span className="text-xs text-muted-foreground">{p.unit}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatNumber(p.min_stock)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(p.sale_price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!p.active && <Badge variant="secondary">Inativo</Badge>}
                        {low && <Badge variant="destructive">Crítico</Badge>}
                        {p.active && !low && (
                          <Badge className="bg-accent-success text-white hover:bg-accent-success/90">
                            OK
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(p)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {p.active ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleActive.mutate(
                                    { id: p.id, isActive: false },
                                    {
                                      onSuccess: () => toast.success("Produto desativado."),
                                    },
                                  )
                                }
                              >
                                <PowerOff className="mr-2 h-4 w-4" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleActive.mutate(
                                    { id: p.id, isActive: true },
                                    {
                                      onSuccess: () => toast.success("Produto reativado."),
                                    },
                                  )
                                }
                              >
                                <Power className="mr-2 h-4 w-4" />
                                Reativar
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(p)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editTarget} />

      <ProductsImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <LabelsPrintDialog
        open={labelsOpen}
        onOpenChange={setLabelsOpen}
        products={(selected.size > 0 ? filtered.filter((p) => selected.has(p.id)) : filtered).map(
          (p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            barcode: p.barcode,
            price: Number(p.sale_price),
          }),
        )}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Produtos com movimentações ou pedidos não poderão ser
              removidos — use "Desativar" nesse caso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
