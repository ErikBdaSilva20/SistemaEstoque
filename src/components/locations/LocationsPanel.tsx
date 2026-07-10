import { useState } from "react";
import { MapPin, MoreHorizontal, Pencil, Star, Trash2, Power, PowerOff } from "lucide-react";
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
import { useLocations, useLocationMutations, type Location } from "@/hooks/useLocations";
import { LocationFormDialog } from "./LocationFormDialog";
import { toastSuccess, toastError } from "@/lib/toast";

const TYPE_LABELS: Record<string, string> = {
  deposito: "Depósito",
  loja: "Loja",
  veiculo: "Veículo",
  outro: "Outro",
};

export function LocationsPanel() {
  const { data: locations = [], isLoading } = useLocations(true);
  const { update, remove } = useLocationMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        toastSuccess("Local removido.");
        setDeleteTarget(null);
      },
      onError: (e) => {
        toastError(e);
        setDeleteTarget(null);
      },
    });
  };

  const columns: DataTableColumn<Location>[] = [
    {
      key: "name",
      header: "Nome",
      cell: (l) => (
        <div className="flex items-center gap-2 font-medium">
          {l.name}
          {l.is_default && (
            <Badge variant="secondary" className="gap-1 bg-accent-primary/15 text-accent-primary">
              <Star className="h-3 w-3" />
              Padrão
            </Badge>
          )}
        </div>
      ),
      sortAccessor: (l) => l.name.toLowerCase(),
    },
    {
      key: "code",
      header: "Código",
      className: "font-mono text-xs text-muted-foreground",
      cell: (l) => l.code ?? "—",
    },
    {
      key: "type",
      header: "Tipo",
      className: "text-sm",
      cell: (l) => TYPE_LABELS[l.kind] ?? l.kind,
    },
    {
      key: "address",
      header: "Endereço",
      className: "max-w-[240px] truncate text-sm text-muted-foreground",
      cell: (l) => l.address ?? "—",
    },
    {
      key: "status",
      header: "Status",
      cell: (l) =>
        l.active ? (
          <Badge className="bg-accent-success text-white">Ativo</Badge>
        ) : (
          <Badge variant="secondary">Inativo</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-12",
      cell: (l) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditTarget(l);
                setFormOpen(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {!l.is_default && (
              <DropdownMenuItem
                onClick={() =>
                  update.mutate(
                    { id: l.id, patch: { is_default: true } },
                    { onSuccess: () => toastSuccess("Local definido como padrão.") },
                  )
                }
              >
                <Star className="mr-2 h-4 w-4" />
                Definir como padrão
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() =>
                update.mutate(
                  { id: l.id, patch: { active: !l.active } },
                  {
                    onSuccess: () =>
                      toastSuccess(l.active ? "Local desativado." : "Local reativado."),
                  },
                )
              }
            >
              {l.active ? (
                <>
                  <PowerOff className="mr-2 h-4 w-4" />
                  Desativar
                </>
              ) : (
                <>
                  <Power className="mr-2 h-4 w-4" />
                  Reativar
                </>
              )}
            </DropdownMenuItem>
            {!l.is_default && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(l)}
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
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Locais de estoque</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre depósitos, lojas e outros pontos de estoque. O local padrão é usado quando
            nenhum local é escolhido numa movimentação.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          Novo local
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={locations}
        rowKey={(l) => l.id}
        isLoading={isLoading}
        emptyIcon={MapPin}
        emptyMessage="Nenhum local cadastrado."
      />

      <LocationFormDialog open={formOpen} onOpenChange={setFormOpen} location={editTarget} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover local?</AlertDialogTitle>
            <AlertDialogDescription>
              Locais com movimentações ou lotes vinculados não poderão ser removidos — prefira
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
    </div>
  );
}
