import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type Supplier,
  type SupplierInsert,
  type SupplierUpdate,
} from "@/lib/data/suppliers.repo";

export type { Supplier };

export const SUPPLIERS_QUERY_KEY = ["suppliers"] as const;

export function useSuppliers(includeInactive = false) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEY,
    queryFn: listSuppliers,
    staleTime: 60_000,
    select: (rows) => (includeInactive ? rows : rows.filter((s) => s.active)),
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEY,
    queryFn: listSuppliers,
    enabled: !!id,
    select: (rows) => rows.find((s) => s.id === id) ?? null,
  });
}

export function useSupplierMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEY });

  const create = useMutation({
    mutationFn: (input: SupplierInsert) => createSupplier(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: SupplierUpdate }) => updateSupplier(id, patch),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateSupplier(id, { active: isActive }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: invalidate,
  });

  return { create, update, toggleActive, remove };
}
