import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listStockMovements,
  createStockMovement,
  type StockMovement,
  type StockMovementInsert,
} from "@/lib/data/stock_movements.repo";
import { listProducts, updateProduct } from "@/lib/data/products.repo";
import { PRODUCTS_QUERY_KEY } from "./useProducts";

export type { StockMovement };
export type MovementWithProduct = StockMovement & {
  product: { id: string; sku: string; name: string; unit: string } | null;
};

export interface MovementFilters {
  productId?: string;
  origin?: StockMovement["origin"];
  sinceIso?: string;
  limit?: number;
}

export const MOVEMENTS_QUERY_KEY = ["stock_movements"] as const;

// No join in generic mode (SS B5): fetches stock_movements + products and
// resolves the product client-side (product_name already denormalized on the row).
export function useMovements(filters: MovementFilters = {}) {
  return useQuery({
    queryKey: MOVEMENTS_QUERY_KEY,
    queryFn: async () => {
      const [movements, products] = await Promise.all([listStockMovements(), listProducts()]);
      const productById = new Map(products.map((p) => [p.id, p]));
      return movements.map(
        (m): MovementWithProduct => ({
          ...m,
          product: productById.has(m.product_id)
            ? {
                id: m.product_id,
                sku: productById.get(m.product_id)!.sku,
                name: m.product_name,
                unit: productById.get(m.product_id)!.unit,
              }
            : null,
        }),
      );
    },
    staleTime: 10_000,
    select: (rows) => {
      let filtered = rows;
      if (filters.productId) filtered = filtered.filter((m) => m.product_id === filters.productId);
      if (filters.origin) filtered = filtered.filter((m) => m.origin === filters.origin);
      if (filters.sinceIso) filtered = filtered.filter((m) => m.created_at >= filters.sinceIso!);
      const sorted = [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
      return sorted.slice(0, filters.limit ?? 100);
    },
  });
}

export function useMovementMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
    qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
  };

  const create = useMutation({
    mutationFn: async (input: StockMovementInsert) => {
      const movement = await createStockMovement(input);
      // No balance trigger on Neon (view/RPC dropped) -- adjust the product's
      // current_stock in the same mutation.
      const products = await listProducts();
      const product = products.find((p) => p.id === input.product_id);
      if (product) {
        const delta =
          input.type === "out"
            ? -Math.abs(input.quantity)
            : input.type === "in"
              ? Math.abs(input.quantity)
              : input.quantity;
        await updateProduct(product.id, { current_stock: Number(product.current_stock) + delta });
      }
      return movement;
    },
    onSuccess: invalidate,
  });

  return { create };
}
