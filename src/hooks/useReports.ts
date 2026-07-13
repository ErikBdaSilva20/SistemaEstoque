import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/data/products.repo";
import { listStockMovements } from "@/lib/data/stock_movements.repo";
import { computeReports } from "@/lib/reports";

export type { AbcRow, TurnoverRow, StockoutEvent, ReportsData } from "@/lib/reports";

export const REPORTS_QUERY_KEY = ["reports"] as const;

export function useReports(periodDays = 30) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, periodDays],
    staleTime: 60_000,
    queryFn: async () => {
      const [products, movements] = await Promise.all([listProducts(), listStockMovements()]);
      return computeReports(products, movements, periodDays);
    },
  });
}
