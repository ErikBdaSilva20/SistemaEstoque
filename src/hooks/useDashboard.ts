import { useQuery } from "@tanstack/react-query";
import { listProducts, type Product } from "@/lib/data/products.repo";
import { listSuppliers } from "@/lib/data/suppliers.repo";
import { listStockMovements } from "@/lib/data/stock_movements.repo";
import { listPurchaseOrders, type PurchaseOrder } from "@/lib/data/purchase_orders.repo";

export interface DashboardKpis {
  totalProducts: number;
  movementsToday: number;
  criticalStockCount: number;
  pendingOrdersCount: number;
  stockValue: number;
}

export interface DashboardChartPoint {
  date: string;
  in: number;
  out: number;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  chart: DashboardChartPoint[];
  lowStock: (Product & { supplierName: string | null })[];
  openOrders: (PurchaseOrder & { supplierName: string | null })[];
}

export const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

const OPEN_STATUSES: PurchaseOrder["status"][] = ["draft", "sent", "partially_received"];

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

// Sem count/agregação server-side no modo genérico (§B5) — carrega as listas
// inteiras e agrega no front.
export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    staleTime: 30_000,
    queryFn: async (): Promise<DashboardSummary> => {
      const [products, suppliers, movements, orders] = await Promise.all([
        listProducts(),
        listSuppliers(),
        listStockMovements(),
        listPurchaseOrders(),
      ]);
      const supplierById = new Map(suppliers.map((s) => [s.id, s]));
      const activeProducts = products.filter((p) => p.active);

      const lowStock = activeProducts
        .filter((p) => Number(p.current_stock) < Number(p.min_stock))
        .map((p) => ({
          ...p,
          supplierName: p.supplier_id ? (supplierById.get(p.supplier_id)?.name ?? null) : null,
        }))
        .sort((a, b) => {
          const ratioA = Number(a.current_stock) / (Number(a.min_stock) || 1);
          const ratioB = Number(b.current_stock) / (Number(b.min_stock) || 1);
          return ratioA - ratioB;
        })
        .slice(0, 10);

      const stockValue = activeProducts.reduce(
        (acc, p) => acc + Number(p.current_stock) * Number(p.cost_price),
        0,
      );

      const chartMap = new Map<string, DashboardChartPoint>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        chartMap.set(key, { date: key, in: 0, out: 0 });
      }
      const todayKey = toDayKey(new Date().toISOString());
      let movementsToday = 0;
      for (const m of movements) {
        const key = toDayKey(m.created_at);
        if (key === todayKey) movementsToday++;
        const point = chartMap.get(key);
        if (!point) continue;
        const qty = Math.abs(Number(m.quantity));
        if (m.type === "in") point.in += qty;
        else if (m.type === "out") point.out += qty;
      }

      const openOrders = orders
        .filter((o) => OPEN_STATUSES.includes(o.status))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 10)
        .map((o) => ({ ...o, supplierName: supplierById.get(o.supplier_id)?.name ?? null }));

      return {
        kpis: {
          totalProducts: activeProducts.length,
          movementsToday,
          criticalStockCount: lowStock.length,
          pendingOrdersCount: openOrders.length,
          stockValue,
        },
        chart: Array.from(chartMap.values()),
        lowStock,
        openOrders,
      };
    },
  });
}
