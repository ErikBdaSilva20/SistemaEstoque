import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProductBatches,
  createProductBatch,
  updateProductBatch,
  deleteProductBatch,
  type ProductBatch,
  type ProductBatchInsert,
  type ProductBatchUpdate,
} from "@/lib/data/product_batches.repo";
import { listLocations } from "@/lib/data/locations.repo";
import { listProducts } from "@/lib/data/products.repo";

export type { ProductBatch };

export const BATCHES_QUERY_KEY = ["product_batches"] as const;

export function useProductBatches(productId: string | undefined, locationId?: string) {
  return useQuery({
    queryKey: BATCHES_QUERY_KEY,
    queryFn: listProductBatches,
    enabled: !!productId,
    staleTime: 30_000,
    select: (batches) => {
      let rows = batches.filter((b) => b.product_id === productId);
      if (locationId) rows = rows.filter((b) => b.location_id === locationId);
      return [...rows].sort((a, b) => {
        if (!a.expiration_date) return 1;
        if (!b.expiration_date) return -1;
        return a.expiration_date.localeCompare(b.expiration_date);
      });
    },
  });
}

// No materialized view in generic mode (rpcs-triggers.md) -- joins batches +
// products + locations client-side (2nd/3rd query, no RPC).
export function useExpiringBatches(withinDays = 30) {
  return useQuery({
    queryKey: [...BATCHES_QUERY_KEY, "expiring", withinDays],
    staleTime: 60_000,
    queryFn: async () => {
      const [batches, products, locations] = await Promise.all([
        listProductBatches(),
        listProducts(),
        listLocations(),
      ]);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + withinDays);
      const productById = new Map(products.map((p) => [p.id, p]));
      const locationById = new Map(locations.map((l) => [l.id, l]));

      return batches
        .filter((b) => b.expiration_date && new Date(b.expiration_date) <= cutoff)
        .map((b) => {
          const product = productById.get(b.product_id);
          const location = b.location_id ? locationById.get(b.location_id) : null;
          const daysToExpire = b.expiration_date
            ? Math.ceil((new Date(b.expiration_date).getTime() - Date.now()) / 86_400_000)
            : null;
          return {
            batchId: b.id,
            batchCode: b.batch_code,
            productId: b.product_id,
            productName: product?.name ?? null,
            sku: product?.sku ?? null,
            unit: product?.unit ?? null,
            locationId: b.location_id,
            locationName: location?.name ?? null,
            expirationDate: b.expiration_date,
            manufactureDate: b.manufacture_date,
            quantity: b.quantity,
            daysToExpire,
          };
        })
        .sort((a, b) => (a.expirationDate ?? "").localeCompare(b.expirationDate ?? ""));
    },
  });
}

export function useBatchMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: BATCHES_QUERY_KEY });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const create = useMutation({
    mutationFn: (input: ProductBatchInsert) => createProductBatch(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProductBatchUpdate }) =>
      updateProductBatch(id, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProductBatch(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
