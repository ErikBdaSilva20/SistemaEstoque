import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listMovementReasons,
  createMovementReason,
  updateMovementReason,
  type MovementReason,
} from "@/lib/data/movement_reasons.repo";

export type { MovementReason };
export type MovementReasonScope = MovementReason["scope"];

export const MOVEMENT_REASONS_KEY = ["movement_reasons"] as const;

export function useMovementReasons(scope?: MovementReasonScope, includeInactive = false) {
  return useQuery({
    queryKey: MOVEMENT_REASONS_KEY,
    queryFn: listMovementReasons,
    staleTime: 60_000,
    select: (rows) => {
      let filtered = includeInactive ? rows : rows.filter((r) => r.active);
      if (scope) filtered = filtered.filter((r) => r.scope === scope || r.scope === "any");
      return [...filtered].sort((a, b) => a.label.localeCompare(b.label));
    },
  });
}

export function useMovementReasonMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: MOVEMENT_REASONS_KEY });

  const create = useMutation({
    mutationFn: (input: { label: string; scope: MovementReasonScope }) =>
      createMovementReason({ label: input.label.trim(), scope: input.scope }),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateMovementReason(id, { active: isActive }),
    onSuccess: invalidate,
  });

  return { create, toggleActive };
}
