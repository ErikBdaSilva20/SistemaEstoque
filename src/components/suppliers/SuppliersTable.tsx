import { useState } from "react";
import { toast } from "sonner";
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
import { useSuppliers, useSupplierMutations, type Supplier } from "@/hooks/useSuppliers";
import { useAuth } from "@/hooks/useAuth";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { SuppliersImportDialog } from "@/components/import/SuppliersImportDialog";
import { downloadXlsx } from "@/lib/import-export";
import { mapGatewayError } from "@/lib/errors";
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
        toast.success("Fornecedor removido.");
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

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="text-right">Lead time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  <Truck className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Nenhum fornecedor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.cnpj ? formatCnpj(s.cnpj) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{s.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{s.phone ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {s.lead_time_days}d
                  </TableCell>
                  <TableCell>
                    {s.active ? (
                      <Badge className="bg-accent-success text-white hover:bg-accent-success/90">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
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
                                {
                                  onSuccess: () => toast.success("Fornecedor desativado."),
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
                                { id: s.id, isActive: true },
                                {
                                  onSuccess: () => toast.success("Fornecedor reativado."),
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
                              onClick={() => setDeleteTarget(s)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
