import { useState } from "react";
import { toast } from "sonner";
import { MapPin, MoreHorizontal, Pencil, Star, Trash2, Power, PowerOff } from "lucide-react";
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
import { mapGatewayError } from "@/lib/errors";

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
        toast.success("Local removido.");
        setDeleteTarget(null);
      },
      onError: (e) => {
        toast.error(mapGatewayError(e));
        setDeleteTarget(null);
      },
    });
  };

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

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  <MapPin className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Nenhum local cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {l.name}
                      {l.is_default && (
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-accent-primary/15 text-accent-primary"
                        >
                          <Star className="h-3 w-3" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {l.code ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{TYPE_LABELS[l.kind] ?? l.kind}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                    {l.address ?? "—"}
                  </TableCell>
                  <TableCell>
                    {l.active ? (
                      <Badge className="bg-accent-success text-white">Ativo</Badge>
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
                                {
                                  onSuccess: () => toast.success("Local definido como padrão."),
                                },
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
                              {
                                id: l.id,
                                patch: { active: !l.active },
                              },
                              {
                                onSuccess: () =>
                                  toast.success(
                                    l.active ? "Local desativado." : "Local reativado.",
                                  ),
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
