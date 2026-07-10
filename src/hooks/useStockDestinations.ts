import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listStockDestinations,
  createStockDestination,
  updateStockDestination,
  type StockDestination,
} from "@/lib/data/stock_destinations.repo";

export type { StockDestination };
export type DestinationKind = StockDestination["kind"];

export const STOCK_DESTINATIONS_QUERY_KEY = ["stock_destinations"] as const;

export function useStockDestinations(opts: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: STOCK_DESTINATIONS_QUERY_KEY,
    queryFn: listStockDestinations,
    staleTime: 60_000,
    select: (rows) => {
      const filtered = opts.includeInactive ? rows : rows.filter((d) => d.active);
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

export function useStockDestinationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: STOCK_DESTINATIONS_QUERY_KEY });

  const create = useMutation({
    mutationFn: (input: { name: string; kind: DestinationKind }) =>
      createStockDestination({ name: input.name.trim(), kind: input.kind }),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateStockDestination(id, { active: isActive }),
    onSuccess: invalidate,
  });

  return { create, toggleActive };
}
