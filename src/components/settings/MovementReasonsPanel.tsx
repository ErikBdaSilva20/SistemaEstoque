import { useState } from "react";
import { toast } from "sonner";
import { Plus, Power } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useMovementReasons,
  useMovementReasonMutations,
  type MovementReasonScope,
} from "@/hooks/useMovementReasons";
import { mapGatewayError } from "@/lib/errors";

const SCOPE_LABELS: Record<MovementReasonScope, string> = {
  in: "Entrada",
  out: "Saída",
  adjustment: "Ajuste",
  any: "Qualquer",
};

const SCOPE_COLORS: Record<MovementReasonScope, string> = {
  in: "border-accent-success/40 text-accent-success",
  out: "border-destructive/40 text-destructive",
  adjustment: "border-warning/40 text-warning",
  any: "border-border text-muted-foreground",
};

export function MovementReasonsPanel() {
  const { data: reasons = [], isLoading } = useMovementReasons(undefined, true);
  const { create, toggleActive } = useMovementReasonMutations();
  const [label, setLabel] = useState("");
  const [scope, setScope] = useState<MovementReasonScope>("any");

  const handleCreate = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Informe um nome para o motivo.");
      return;
    }
    try {
      await create.mutateAsync({ label: trimmed, scope });
      toast.success("Motivo cadastrado.");
      setLabel("");
      setScope("any");
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, isActive: !current });
      toast.success(current ? "Motivo desativado." : "Motivo reativado.");
    } catch (e) {
      toast.error(mapGatewayError(e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text-primary">Motivos de movimento</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Padronize os motivos disponíveis ao registrar entradas, saídas e ajustes de estoque.
        </p>
      </div>

      <Card className="rounded-2xl border-border bg-card p-5 shadow-elevation-1">
        <h3 className="text-sm font-semibold text-text-primary">Novo motivo</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <Input
            placeholder='Ex: "Venda balcão", "Quebra", "Inventário"'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreate();
              }
            }}
          />
          <Select value={scope} onValueChange={(v) => setScope(v as MovementReasonScope)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Qualquer tipo</SelectItem>
              <SelectItem value="in">Apenas entradas</SelectItem>
              <SelectItem value="out">Apenas saídas</SelectItem>
              <SelectItem value="adjustment">Apenas ajustes</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={create.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Motivo</TableHead>
              <TableHead>Escopo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : reasons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  Nenhum motivo cadastrado ainda.
                </TableCell>
              </TableRow>
            ) : (
              reasons.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={SCOPE_COLORS[r.scope]}>
                      {SCOPE_LABELS[r.scope]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.active ? (
                      <Badge
                        variant="outline"
                        className="border-accent-success/40 text-accent-success"
                      >
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(r.id, r.active)}
                      disabled={toggleActive.isPending}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {r.active ? "Desativar" : "Reativar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
