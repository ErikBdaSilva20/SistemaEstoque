import { useQuery } from "@tanstack/react-query";
import { listStockMovements } from "@/lib/data/stock_movements.repo";
import { listProducts, type Product } from "@/lib/data/products.repo";
import { listSuppliers } from "@/lib/data/suppliers.repo";

export interface KardexEntry {
  id: string;
  createdAt: string;
  type: "in" | "out" | "adjustment" | "transfer";
  origin: "manual" | "purchase" | "sale" | "other";
  quantity: number;
  referenceId: string | null;
  runningBalance: number;
  weightedAvgCost: number;
  unitCostEstimate: number;
}

export interface KardexSummary {
  product: Product & { supplierName: string | null };
  entries: KardexEntry[];
  currentBalance: number;
  weightedAvgCost: number;
  totalIn30d: number;
  totalOut30d: number;
  totalAdjustment30d: number;
  daysOfStock: number | null;
}

export const KARDEX_QUERY_KEY = ["kardex"] as const;

export function useKardex(productId: string | undefined) {
  return useQuery({
    queryKey: [...KARDEX_QUERY_KEY, productId],
    enabled: !!productId,
    staleTime: 30_000,
    queryFn: async (): Promise<KardexSummary | null> => {
      const [products, suppliers, movements] = await Promise.all([
        listProducts(),
        listSuppliers(),
        listStockMovements(),
      ]);
      const product = products.find((p) => p.id === productId);
      if (!product) return null;
      const supplier = product.supplier_id
        ? (suppliers.find((s) => s.id === product.supplier_id) ?? null)
        : null;

      const productCost = Number(product.cost_price);
      let balance = 0;
      let totalCost = 0;

      const sortedMovements = movements
        .filter((m) => m.product_id === productId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

      const entries: KardexEntry[] = sortedMovements.map((m) => {
        const qty = Number(m.quantity);
        const absQty = Math.abs(qty);

        if (m.type === "in") {
          totalCost = totalCost + absQty * productCost;
          balance = balance + absQty;
        } else if (m.type === "out") {
          const wac = balance > 0 ? totalCost / balance : productCost;
          totalCost = Math.max(0, totalCost - absQty * wac);
          balance = balance - absQty;
        } else {
          // adjustment/transfer -- assumes it keeps the weighted average cost (WAC).
          balance = balance + qty;
          if (qty > 0) totalCost += qty * productCost;
          else {
            const wac = balance > 0 ? totalCost / (balance - qty) : productCost;
            totalCost = Math.max(0, totalCost + qty * wac);
          }
        }

        const wac = balance > 0 ? totalCost / balance : 0;
        return {
          id: m.id,
          createdAt: m.created_at,
          type: m.type,
          origin: m.origin,
          quantity: qty,
          referenceId: m.reference_id,
          runningBalance: balance,
          weightedAvgCost: wac,
          unitCostEstimate: productCost,
        };
      });

      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      let totalIn = 0;
      let totalOut = 0;
      let totalAdj = 0;
      for (const e of entries) {
        if (new Date(e.createdAt).getTime() < cutoff) continue;
        const abs = Math.abs(e.quantity);
        if (e.type === "in") totalIn += abs;
        else if (e.type === "out") totalOut += abs;
        else totalAdj += abs;
      }

      const dailyAvgOut = totalOut / 30;
      const daysOfStock = dailyAvgOut > 0 ? balance / dailyAvgOut : null;

      return {
        product: { ...product, supplierName: supplier?.name ?? null },
        entries: entries.reverse(),
        currentBalance: balance,
        weightedAvgCost: balance > 0 ? totalCost / balance : productCost,
        totalIn30d: totalIn,
        totalOut30d: totalOut,
        totalAdjustment30d: totalAdj,
        daysOfStock,
      };
    },
  });
}
