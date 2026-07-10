import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { filterRows } from "@/components/data/data-table-utils";
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
import { useProducts, useProductMutations, type Product } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatBRL, formatNumber } from "@/lib/formatters";
import { downloadXlsx } from "@/lib/import-export";
import { useAuth } from "@/hooks/useAuth";
import { ProductFormDialog } from "./ProductFormDialog";
import { ProductsImportDialog } from "@/components/import/ProductsImportDialog";
import { LabelsPrintDialog } from "@/components/labels/LabelsPrintDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toastSuccess, toastError } from "@/lib/toast";

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

  const filtered = useMemo(
    () =>
      filterRows(
        products,
        search,
        (p) => `${p.name} ${p.sku} ${p.barcode ?? ""} ${p.category ?? ""}`,
      ),
    [products, search],
  );

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
        toastSuccess("Produto removido.");
        setDeleteTarget(null);
      },
      onError: (e) => {
        toastError(e);
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: "select",
      headerClassName: "w-10",
      header: (
        <Checkbox
          aria-label="Selecionar todos"
          checked={filtered.length > 0 && filtered.every((p) => selected.has(p.id))}
          onCheckedChange={(v) => setSelected(v ? new Set(filtered.map((p) => p.id)) : new Set())}
        />
      ),
      cell: (p) => (
        <Checkbox
          aria-label={`Selecionar ${p.name}`}
          checked={selected.has(p.id)}
          onCheckedChange={(v) =>
            setSelected((prev) => {
              const next = new Set(prev);
              if (v) next.add(p.id);
              else next.delete(p.id);
              return next;
            })
          }
        />
      ),
    },
    {
      key: "product",
      header: "Produto",
      cell: (p) => (
        <>
          <Link
            to={`/products/${p.id}`}
            className="font-medium text-text-primary hover:text-accent-primary hover:underline"
          >
            {p.name}
          </Link>
          {p.barcode && <div className="text-xs text-muted-foreground">{p.barcode}</div>}
        </>
      ),
      sortAccessor: (p) => p.name.toLowerCase(),
    },
    {
      key: "sku",
      header: "SKU",
      className: "font-mono text-xs",
      cell: (p) => p.sku,
    },
    {
      key: "category",
      header: "Categoria",
      className: "text-muted-foreground",
      cell: (p) => p.category ?? "—",
    },
    {
      key: "stock",
      header: "Estoque",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (p) => {
        const low = Number(p.current_stock) < Number(p.min_stock) && p.active;
        return (
          <>
            <span className={low ? "font-semibold text-destructive" : undefined}>
              {formatNumber(p.current_stock)}
            </span>{" "}
            <span className="text-xs text-muted-foreground">{p.unit}</span>
          </>
        );
      },
      sortAccessor: (p) => Number(p.current_stock),
    },
    {
      key: "min_stock",
      header: "Mín.",
      headerClassName: "text-right",
      className: "text-right tabular-nums text-muted-foreground",
      cell: (p) => formatNumber(p.min_stock),
    },
    {
      key: "price",
      header: "Preço",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (p) => formatBRL(p.sale_price),
      sortAccessor: (p) => Number(p.sale_price),
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => {
        const low = Number(p.current_stock) < Number(p.min_stock) && p.active;
        return (
          <div className="flex gap-1">
            {!p.active && <Badge variant="secondary">Inativo</Badge>}
            {low && <Badge variant="destructive">Crítico</Badge>}
            {p.active && !low && (
              <Badge className="bg-accent-success text-white hover:bg-accent-success/90">OK</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-12",
      cell: (p: Product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canManage && (
              <DropdownMenuItem onClick={() => handleEdit(p)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {p.active ? (
              <DropdownMenuItem
                onClick={() =>
                  toggleActive.mutate(
                    { id: p.id, isActive: false },
                    { onSuccess: () => toastSuccess("Produto desativado.") },
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
                    { onSuccess: () => toastSuccess("Produto reativado.") },
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
      ),
    },
  ];

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
                ...(canManage ? { custo: Number(p.cost_price) } : {}),
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
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
        )}
        <Button onClick={handleNew}>Novo produto</Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        skeletonRows={4}
        emptyIcon={Package}
        emptyMessage={
          search || onlyLowStock
            ? "Nenhum produto encontrado com esses filtros."
            : "Nenhum produto cadastrado. Clique em 'Novo produto' para começar."
        }
        rowClassName={(p) => (selected.has(p.id) ? "bg-muted" : undefined)}
      />

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
