import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type ProductInsert,
  type ProductUpdate,
} from "@/lib/data/products.repo";

export type { Product };

export interface ProductFilters {
  search?: string;
  category?: string;
  onlyLowStock?: boolean;
  includeInactive?: boolean;
}

export const PRODUCTS_QUERY_KEY = ["products"] as const;

// Generic gateway mode has no server-side filter/sort (SS B5) -- list everything
// and filter client-side. No join: to get the supplier name, resolve it with a
// second useQuery(['suppliers']) and build an id -> name map in the consumer.
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: listProducts,
    staleTime: 15_000,
    select: (products): Product[] => {
      let rows = products;
      if (!filters.includeInactive) rows = rows.filter((p) => p.active);
      if (filters.category) rows = rows.filter((p) => p.category === filters.category);
      if (filters.search && filters.search.trim().length > 0) {
        const s = filters.search.trim().toLowerCase();
        rows = rows.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            p.sku.toLowerCase().includes(s) ||
            (p.barcode ?? "").toLowerCase().includes(s),
        );
      }
      if (filters.onlyLowStock) {
        rows = rows.filter((p) => Number(p.current_stock) < Number(p.min_stock));
      }
      return rows;
    },
  });
}

// list-then-find: generic mode has no get-by-id (SS B5).
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: listProducts,
    enabled: !!id,
    select: (products) => products.find((p) => p.id === id) ?? null,
  });
}

export function useProductByBarcode(barcode: string | undefined) {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: listProducts,
    enabled: !!barcode && barcode.trim().length > 0,
    select: (products) => products.find((p) => p.active && p.barcode === barcode?.trim()) ?? null,
  });
}

export function useProductMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });

  const create = useMutation({
    mutationFn: (input: ProductInsert) => createProduct(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ProductUpdate }) => updateProduct(id, patch),
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateProduct(id, { active: isActive }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidate,
  });

  return { create, update, toggleActive, remove };
}
