import { useState } from "react";
import {
  Truck,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
  Upload,
  Download,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useSuppliers, useSupplierMutations, type Supplier } from "@/hooks/useSuppliers";
import { useAuth } from "@/hooks/useAuth";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { SuppliersImportDialog } from "@/components/import/SuppliersImportDialog";
import { downloadXlsx } from "@/lib/import-export";
import { toastSuccess, toastError } from "@/lib/toast";
import { formatCnpj } from "@/lib/cnpj";

export function SuppliersTable() {
  const { isAdmin } = useAuth();
  const { data: suppliers = [], isLoading } = useSuppliers(true);
  const { toggleActive, remove } = useSupplierMutations();

  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const handleNew = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (s: Supplier) => {
    setEditTarget(s);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        toastSuccess("Fornecedor removido.");
        setDeleteTarget(null);
      },
      onError: (e) => {
        toastError(e);
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Supplier>[] = [
    {
      key: "name",
      header: "Nome",
      className: "font-medium",
      cell: (s) => s.name,
      sortAccessor: (s) => s.name.toLowerCase(),
    },
    {
      key: "cnpj",
      header: "CNPJ",
      className: "text-muted-foreground",
      cell: (s) => (s.cnpj ? formatCnpj(s.cnpj) : "—"),
    },
    {
      key: "contact",
      header: "Contato",
      cell: (s) => (
        <>
          <div className="text-sm">{s.email ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{s.phone ?? ""}</div>
        </>
      ),
    },
    {
      key: "lead_time",
      header: "Lead time",
      headerClassName: "text-right",
      className: "text-right tabular-nums text-muted-foreground",
      cell: (s) => `${s.lead_time_days}d`,
      sortAccessor: (s) => s.lead_time_days,
    },
    {
      key: "status",
      header: "Status",
      cell: (s) =>
        s.active ? (
          <Badge className="bg-accent-success text-white hover:bg-accent-success/90">Ativo</Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-12",
      cell: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(s)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {s.active ? (
              <DropdownMenuItem
                onClick={() =>
                  toggleActive.mutate(
                    { id: s.id, isActive: false },
                    { onSuccess: () => toastSuccess("Fornecedor desativado.") },
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
                    { id: s.id, isActive: true },
                    { onSuccess: () => toastSuccess("Fornecedor reativado.") },
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
                  onClick={() => setDeleteTarget(s)}
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
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (suppliers.length === 0) return;
            downloadXlsx(
              `fornecedores-${new Date().toISOString().slice(0, 10)}.xlsx`,
              suppliers.map((s) => ({
                nome: s.name,
                cnpj: s.cnpj ?? "",
                email: s.email ?? "",
                telefone: s.phone ?? "",
                lead_time_dias: s.lead_time_days,
                observacoes: s.notes ?? "",
                ativo: s.active ? "sim" : "não",
              })),
              "Fornecedores",
            );
          }}
          disabled={suppliers.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
        <Button onClick={handleNew}>Novo fornecedor</Button>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        emptyIcon={Truck}
        emptyMessage="Nenhum fornecedor cadastrado."
        search={{
          placeholder: "Buscar por nome, CNPJ, email...",
          getSearchText: (s) => `${s.name} ${s.cnpj ?? ""} ${s.email ?? ""} ${s.phone ?? ""}`,
        }}
      />

      <SupplierFormDialog open={formOpen} onOpenChange={setFormOpen} supplier={editTarget} />

      <SuppliersImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Fornecedores com produtos ou pedidos vinculados não podem ser removidos — prefira
              desativar.
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
