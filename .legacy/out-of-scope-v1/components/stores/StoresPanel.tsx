import { useState } from "react";
import { toast } from "sonner";
import {
  Store as StoreIcon,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Users,
  Star,
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStoresList, useStoreMembers, useStoreMutations, type Store } from "@/hooks/useStores";
import { useTeamMembers } from "@/hooks/useTeamManagement";
import { mapSupabaseError } from "@/lib/errors";

function StoreFormDialog({
  open,
  onOpenChange,
  store,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  store: Store | null;
}) {
  const { createStore, updateStore } = useStoreMutations();
  const [name, setName] = useState(store?.name ?? "");
  const [code, setCode] = useState(store?.code ?? "");
  const isEdit = !!store;

  // Reset campos quando muda o alvo de edição.
  const [lastId, setLastId] = useState<string | null>(store?.id ?? null);
  if ((store?.id ?? null) !== lastId) {
    setLastId(store?.id ?? null);
    setName(store?.name ?? "");
    setCode(store?.code ?? "");
  }

  const handleSubmit = () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Nome e código são obrigatórios.");
      return;
    }
    const onSuccess = () => {
      toast.success(isEdit ? "PDV atualizado." : "PDV criado.");
      onOpenChange(false);
    };
    const onError = (e: unknown) => toast.error(mapSupabaseError(e));
    if (isEdit) {
      updateStore.mutate(
        { id: store.id, patch: { name: name.trim(), code: code.trim() } },
        { onSuccess, onError },
      );
    } else {
      createStore.mutate(
        { name: name.trim(), code: code.trim().toUpperCase() },
        { onSuccess, onError },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar PDV" : "Novo PDV"}</DialogTitle>
          <DialogDescription>
            Cada PDV (ponto de venda / unidade) isola produtos, fornecedores, compras e estoque.
            {!isEdit &&
              " Ao criar, um local de estoque principal e uma regra de compra são gerados automaticamente."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="store-name">Nome</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Loja Centro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-code">Código</Label>
            <Input
              id="store-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex.: CENTRO"
              disabled={isEdit}
              className="font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createStore.isPending || updateStore.isPending}>
            {isEdit ? "Salvar" : "Criar PDV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StoreMembersDialog({
  open,
  onOpenChange,
  store,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  store: Store | null;
}) {
  const { data: members = [], isLoading: loadingMembers } = useStoreMembers(
    open ? store?.id : undefined,
  );
  const { data: team = [], isLoading: loadingTeam } = useTeamMembers();
  const { assignUser, unassignUser } = useStoreMutations();
  const memberSet = new Set(members);

  const toggle = (userId: string, isMember: boolean) => {
    if (!store) return;
    const opts = {
      onError: (e: unknown) => toast.error(mapSupabaseError(e)),
    };
    if (isMember) {
      unassignUser.mutate({ userId, storeId: store.id }, opts);
    } else {
      assignUser.mutate({ userId, storeId: store.id }, opts);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acesso ao PDV {store?.name}</DialogTitle>
          <DialogDescription>
            Defina quais usuários podem operar neste PDV. Admins têm acesso a todos os PDVs.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] space-y-1 overflow-auto py-2">
          {loadingMembers || loadingTeam ? (
            <Skeleton className="h-24 w-full" />
          ) : team.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum usuário na equipe.
            </p>
          ) : (
            team.map((u) => {
              const isMember = memberSet.has(u.id);
              const isAdmin = u.role === "admin";
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  {isAdmin ? (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" /> Todos
                    </Badge>
                  ) : (
                    <Switch checked={isMember} onCheckedChange={() => toggle(u.id, isMember)} />
                  )}
                </div>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StoresPanel() {
  const { data: stores = [], isLoading } = useStoresList(true);
  const { updateStore } = useStoreMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Store | null>(null);
  const [membersTarget, setMembersTarget] = useState<Store | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">PDVs / Unidades</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada PDV isola produtos, fornecedores, compras, cotações e estoque. Use o seletor no
            topo para alternar o PDV ativo.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          Novo PDV
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  <StoreIcon className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  Nenhum PDV cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              stores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {s.name}
                      {s.is_default && (
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
                    {s.code}
                  </TableCell>
                  <TableCell>
                    {s.is_active ? (
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
                        <DropdownMenuItem onClick={() => setMembersTarget(s)}>
                          <Users className="mr-2 h-4 w-4" />
                          Gerenciar acesso
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditTarget(s);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {!s.is_default && (
                          <DropdownMenuItem
                            onClick={() =>
                              updateStore.mutate(
                                { id: s.id, patch: { is_active: !s.is_active } },
                                {
                                  onSuccess: () =>
                                    toast.success(
                                      s.is_active ? "PDV desativado." : "PDV reativado.",
                                    ),
                                },
                              )
                            }
                          >
                            {s.is_active ? (
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

      <StoreFormDialog open={formOpen} onOpenChange={setFormOpen} store={editTarget} />
      <StoreMembersDialog
        open={!!membersTarget}
        onOpenChange={(o) => !o && setMembersTarget(null)}
        store={membersTarget}
      />
    </div>
  );
}
