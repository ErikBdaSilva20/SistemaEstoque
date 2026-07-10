import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeamMembers } from "@/hooks/useTeamManagement";
import type { AppRole } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  manager: "Gestor",
  rep: "Operador",
};

const ROLE_BADGE: Record<AppRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  manager: "secondary",
  rep: "outline",
};

export function MembersTable() {
  const { data: members = [], isLoading } = useTeamMembers();
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filtered = useMemo(
    () => members.filter((m) => roleFilter === "all" || m.role === roleFilter),
    [members, roleFilter],
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="manager">Gestor</SelectItem>
            <SelectItem value="rep">Operador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum membro encontrado. A listagem de equipe depende de um endpoint do gateway
                  ainda não disponível — gerencie papéis direto no Better-Auth por enquanto.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    {m.role ? (
                      <Badge variant={ROLE_BADGE[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
