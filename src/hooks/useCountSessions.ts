import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCountSessions,
  createCountSession,
  updateCountSession,
  listCountItems,
  createCountItem,
  updateCountItem,
  type CountSession,
  type CountItem,
} from "@/lib/data/count_sessions.repo";
import { listLocations } from "@/lib/data/locations.repo";
import { listProducts, updateProduct } from "@/lib/data/products.repo";
import { createStockMovement } from "@/lib/data/stock_movements.repo";
import { nextSequentialCode } from "@/lib/sequential-code";
import { auth } from "@/lib/data/client";
import { PRODUCTS_QUERY_KEY } from "./useProducts";
import { MOVEMENTS_QUERY_KEY } from "./useMovements";

export type { CountSession, CountItem };

export interface CountSessionWithStats extends CountSession {
  locationName: string | null;
  itemsTotal: number;
  itemsCounted: number;
  itemsWithDiff: number;
}

export interface CountItemWithRefs extends CountItem {
  product: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    barcode: string | null;
    currentStock: number;
  } | null;
}

export interface CreateSessionInput {
  name: string;
  locationId?: string | null;
  category?: string | null;
  notes?: string | null;
}

export const COUNT_SESSIONS_QUERY_KEY = ["count_sessions"] as const;

export function useCountSessions(status?: CountSession["status"]) {
  return useQuery({
    queryKey: COUNT_SESSIONS_QUERY_KEY,
    staleTime: 15_000,
    queryFn: async (): Promise<CountSessionWithStats[]> => {
      const [sessions, items, locations] = await Promise.all([
        listCountSessions(),
        listCountItems(),
        listLocations(),
      ]);
      const locationById = new Map(locations.map((l) => [l.id, l]));
      const stats = new Map<string, { total: number; counted: number; withDiff: number }>();
      for (const it of items) {
        const s = stats.get(it.count_session_id) ?? { total: 0, counted: 0, withDiff: 0 };
        s.total++;
        if (it.counted_quantity !== null && it.counted_quantity !== undefined) {
          s.counted++;
          if (Number(it.counted_quantity) !== Number(it.expected_quantity)) s.withDiff++;
        }
        stats.set(it.count_session_id, s);
      }

      return sessions
        .filter((s) => !status || s.status === status)
        .map((s) => ({
          ...s,
          locationName: s.location_id ? (locationById.get(s.location_id)?.name ?? null) : null,
          itemsTotal: stats.get(s.id)?.total ?? 0,
          itemsCounted: stats.get(s.id)?.counted ?? 0,
          itemsWithDiff: stats.get(s.id)?.withDiff ?? 0,
        }))
        .sort((a, b) => b.opened_at.localeCompare(a.opened_at));
    },
  });
}

export function useCountSession(id: string | undefined) {
  return useQuery({
    queryKey: [...COUNT_SESSIONS_QUERY_KEY, "detail", id],
    enabled: !!id,
    staleTime: 5_000,
    queryFn: async () => {
      const [sessions, items, locations, products] = await Promise.all([
        listCountSessions(),
        listCountItems(),
        listLocations(),
        listProducts(),
      ]);
      const session = sessions.find((s) => s.id === id);
      if (!session) return null;
      const productById = new Map(products.map((p) => [p.id, p]));

      return {
        session: {
          ...session,
          locationName: session.location_id
            ? (locations.find((l) => l.id === session.location_id)?.name ?? null)
            : null,
        },
        items: items
          .filter((i) => i.count_session_id === id)
          .map((i): CountItemWithRefs => {
            const product = productById.get(i.product_id);
            return {
              ...i,
              product: product
                ? {
                    id: product.id,
                    sku: product.sku,
                    name: product.name,
                    unit: product.unit,
                    barcode: product.barcode,
                    currentStock: product.current_stock,
                  }
                : null,
            };
          }),
      };
    },
  });
}

export function useCountSessionMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: COUNT_SESSIONS_QUERY_KEY });

  const create = useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const [existing, products] = await Promise.all([listCountSessions(), listProducts()]);
      const session = await createCountSession({
        code: nextSequentialCode(
          existing.map((s) => s.code),
          "CONT",
        ),
        name: input.name,
        location_id: input.locationId ?? null,
        category: input.category ?? null,
        notes: input.notes ?? null,
        status: "open",
      });

      const eligible = products.filter(
        (p) => p.active && (!input.category || p.category === input.category),
      );
      await Promise.all(
        eligible.map((p) =>
          createCountItem({
            count_session_id: session.id,
            product_id: p.id,
            expected_quantity: p.current_stock,
          }),
        ),
      );

      return session;
    },
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: async ({
      itemId,
      countedQuantity,
      notes,
    }: {
      itemId: string;
      countedQuantity: number | null;
      notes?: string | null;
    }) => {
      const session = await auth.me().catch(() => null);
      return updateCountItem(itemId, {
        counted_quantity: countedQuantity,
        counted_at: countedQuantity != null ? new Date().toISOString() : null,
        counted_by: countedQuantity != null ? (session?.user.id ?? null) : null,
        notes: notes ?? null,
      });
    },
    onSuccess: invalidate,
  });

  // RPC `close_count_session` dropped: the client computes the diffs, creates
  // an adjustment stock_movement per divergent item and updates current_stock.
  const close = useMutation({
    mutationFn: async (sessionId: string) => {
      const [items, products] = await Promise.all([listCountItems(), listProducts()]);
      const sessionItems = items.filter((i) => i.count_session_id === sessionId);
      const productById = new Map(products.map((p) => [p.id, p]));

      let adjustments = 0;
      let totalDiff = 0;
      for (const item of sessionItems) {
        if (item.counted_quantity === null || item.counted_quantity === undefined) continue;
        const diff = Number(item.counted_quantity) - Number(item.expected_quantity);
        if (diff === 0) continue;
        adjustments++;
        totalDiff += diff;
        const product = productById.get(item.product_id);
        if (!product) continue;
        await createStockMovement({
          product_id: product.id,
          product_name: product.name,
          type: "adjustment",
          origin: "manual",
          quantity: diff,
          reference_id: sessionId,
        });
        await updateProduct(product.id, { current_stock: Number(item.counted_quantity) });
      }

      await updateCountSession(sessionId, {
        status: "closed",
        closed_at: new Date().toISOString(),
      });
      return { adjustments, totalDiff };
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
    },
  });

  const cancel = useMutation({
    mutationFn: (sessionId: string) => updateCountSession(sessionId, { status: "cancelled" }),
    onSuccess: invalidate,
  });

  const addItem = useMutation({
    mutationFn: async ({ sessionId, productId }: { sessionId: string; productId: string }) => {
      const [items, products] = await Promise.all([listCountItems(), listProducts()]);
      const already = items.some(
        (i) => i.count_session_id === sessionId && i.product_id === productId,
      );
      if (already) throw new Error("Product is already in this count session.");
      const product = products.find((p) => p.id === productId);
      return createCountItem({
        count_session_id: sessionId,
        product_id: productId,
        expected_quantity: product?.current_stock ?? 0,
      });
    },
    onSuccess: invalidate,
  });

  return { create, updateItem, close, cancel, addItem };
}
