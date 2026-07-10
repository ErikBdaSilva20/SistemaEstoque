import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/data/products.repo";
import { listStockMovements, type StockMovement } from "@/lib/data/stock_movements.repo";

export interface AbcRow {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  currentStock: number;
  cost: number;
  price: number;
  revenue30d: number;
  qtySold30d: number;
  cumulativeShare: number;
  class: "A" | "B" | "C";
}

export interface TurnoverRow {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  currentStock: number;
  cost: number;
  qtyOut30d: number;
  avgInventory: number;
  turnover: number;
  coverageDays: number | null;
}

export interface StockoutEvent {
  productId: string;
  sku: string;
  name: string;
  unit: string;
  stockoutAt: string;
  daysAgo: number;
}

export interface ReportsData {
  abc: AbcRow[];
  turnover: TurnoverRow[];
  stockouts: StockoutEvent[];
  totals: {
    inventoryValue: number;
    inventoryCost: number;
    revenue30d: number;
    productsCount: number;
    lowStockCount: number;
    stockoutCount: number;
  };
}

export const REPORTS_QUERY_KEY = ["reports"] as const;

// No aggregate RPC/view in generic mode -- loads products + movements and
// computes ABC/turnover/stockout client-side (React Query + memo).
export function useReports(periodDays = 30) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, periodDays],
    staleTime: 60_000,
    queryFn: async (): Promise<ReportsData> => {
      const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
      const [allProducts, allMovements] = await Promise.all([listProducts(), listStockMovements()]);
      const products = allProducts.filter((p) => p.active);
      const movements = allMovements.filter((m) => m.created_at >= since);

      const qtyOutByProduct = new Map<string, number>();
      const qtyInByProduct = new Map<string, number>();
      for (const m of movements) {
        const abs = Math.abs(Number(m.quantity));
        if (m.type === "out")
          qtyOutByProduct.set(m.product_id, (qtyOutByProduct.get(m.product_id) ?? 0) + abs);
        else if (m.type === "in")
          qtyInByProduct.set(m.product_id, (qtyInByProduct.get(m.product_id) ?? 0) + abs);
      }

      const abcEntries = products
        .map((p) => {
          const qtySold = qtyOutByProduct.get(p.id) ?? 0;
          const revenue = qtySold * Number(p.sale_price);
          return { p, qtySold, revenue };
        })
        .sort((a, b) => b.revenue - a.revenue);

      const totalRevenue = abcEntries.reduce((acc, e) => acc + e.revenue, 0);
      let cumulative = 0;
      const abc: AbcRow[] = abcEntries.map((e) => {
        const share = totalRevenue > 0 ? e.revenue / totalRevenue : 0;
        cumulative += share;
        let cls: "A" | "B" | "C" = "C";
        if (cumulative <= 0.8) cls = "A";
        else if (cumulative <= 0.95) cls = "B";
        return {
          productId: e.p.id,
          sku: e.p.sku,
          name: e.p.name,
          unit: e.p.unit,
          currentStock: e.p.current_stock,
          cost: e.p.cost_price,
          price: e.p.sale_price,
          revenue30d: e.revenue,
          qtySold30d: e.qtySold,
          cumulativeShare: cumulative,
          class: cls,
        };
      });

      const turnover: TurnoverRow[] = products.map((p) => {
        const out = qtyOutByProduct.get(p.id) ?? 0;
        const current = Number(p.current_stock);
        const inn = qtyInByProduct.get(p.id) ?? 0;
        const estimatedStart = current - inn + out;
        const avgInventory = Math.max(1, (current + Math.max(0, estimatedStart)) / 2);
        const dailyOut = out / periodDays;
        return {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          currentStock: current,
          cost: p.cost_price,
          qtyOut30d: out,
          avgInventory,
          turnover: out / avgInventory,
          coverageDays: dailyOut > 0 ? current / dailyOut : null,
        };
      });

      const stockouts: StockoutEvent[] = [];
      const movementsByProduct = new Map<string, StockMovement[]>();
      for (const m of movements) {
        const arr = movementsByProduct.get(m.product_id) ?? [];
        arr.push(m);
        movementsByProduct.set(m.product_id, arr);
      }
      for (const [productId, ms] of movementsByProduct) {
        const product = products.find((p) => p.id === productId);
        if (!product) continue;
        ms.sort((a, b) => a.created_at.localeCompare(b.created_at));

        let balance = Number(product.current_stock);
        for (let i = ms.length - 1; i >= 0; i--) {
          const q = Number(ms[i].quantity);
          if (ms[i].type === "in") balance -= Math.abs(q);
          else if (ms[i].type === "out") balance += Math.abs(q);
          else balance -= q;
        }
        for (const m of ms) {
          const q = Number(m.quantity);
          if (m.type === "in") balance += Math.abs(q);
          else if (m.type === "out") balance -= Math.abs(q);
          else balance += q;
          if (balance <= 0) {
            stockouts.push({
              productId: product.id,
              sku: product.sku,
              name: product.name,
              unit: product.unit,
              stockoutAt: m.created_at,
              daysAgo: Math.floor((Date.now() - new Date(m.created_at).getTime()) / 86_400_000),
            });
            break;
          }
        }
      }
      for (const p of products) {
        if (Number(p.current_stock) <= 0 && !stockouts.some((s) => s.productId === p.id)) {
          stockouts.push({
            productId: p.id,
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            stockoutAt: new Date().toISOString(),
            daysAgo: 0,
          });
        }
      }
      stockouts.sort((a, b) => a.daysAgo - b.daysAgo);

      const inventoryCost = products.reduce(
        (acc, p) => acc + Number(p.current_stock) * Number(p.cost_price),
        0,
      );
      const inventoryValue = products.reduce(
        (acc, p) => acc + Number(p.current_stock) * Number(p.sale_price),
        0,
      );

      return {
        abc,
        turnover,
        stockouts,
        totals: {
          inventoryValue,
          inventoryCost,
          revenue30d: totalRevenue,
          productsCount: products.length,
          lowStockCount: products.filter((p) => Number(p.current_stock) < Number(p.min_stock))
            .length,
          stockoutCount: stockouts.length,
        },
      };
    },
  });
}
