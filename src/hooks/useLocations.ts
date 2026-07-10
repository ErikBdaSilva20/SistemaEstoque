import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  type Location,
  type LocationInsert,
  type LocationUpdate,
} from "@/lib/data/locations.repo";

export type { Location };

export const LOCATIONS_QUERY_KEY = ["locations"] as const;

export function useLocations(includeInactive = false) {
  return useQuery({
    queryKey: LOCATIONS_QUERY_KEY,
    queryFn: listLocations,
    staleTime: 60_000,
    select: (rows) => {
      const filtered = includeInactive ? rows : rows.filter((l) => l.active);
      return [...filtered].sort((a, b) =>
        a.is_default === b.is_default ? a.name.localeCompare(b.name) : a.is_default ? -1 : 1,
      );
    },
  });
}

export function useDefaultLocation() {
  return useQuery({
    queryKey: LOCATIONS_QUERY_KEY,
    queryFn: listLocations,
    staleTime: 5 * 60 * 1000,
    select: (rows) => rows.find((l) => l.is_default) ?? null,
  });
}

export function useLocationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });

  const create = useMutation({
    mutationFn: (input: LocationInsert) => createLocation(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: LocationUpdate }) => {
      // Only one default location at a time: clear the others first (list-then-update, no RPC).
      if (patch.is_default === true) {
        const rows = await listLocations();
        await Promise.all(
          rows
            .filter((l) => l.is_default && l.id !== id)
            .map((l) => updateLocation(l.id, { is_default: false })),
        );
      }
      return updateLocation(id, patch);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
