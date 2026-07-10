import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPurchaseRules,
  updatePurchaseRule,
  type PurchaseRule,
  type PurchaseRuleUpdate,
} from "@/lib/data/purchase_rules.repo";
import { listPurchaseApprovals } from "@/lib/data/purchase_approvals.repo";
import { listPurchaseOrders } from "@/lib/data/purchase_orders.repo";
import { listSuppliers } from "@/lib/data/suppliers.repo";

export type { PurchaseRule };

export const PURCHASE_RULES_QUERY_KEY = ["purchase_rules"] as const;

// 1 Neon per tenant (ADR-003) -- no more per-store split. Assumes 1 active
// purchase_rules row for the whole tenant.
export function usePurchaseRules() {
  return useQuery({
    queryKey: PURCHASE_RULES_QUERY_KEY,
    staleTime: 5 * 60 * 1000,
    queryFn: listPurchaseRules,
    select: (rows) => rows.find((r) => r.active) ?? null,
  });
}

export function useUpdatePurchaseRules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: PurchaseRuleUpdate) => {
      const rows = await listPurchaseRules();
      const current = rows.find((r) => r.active);
      if (!current) throw new Error("No active purchase rule found.");
      return updatePurchaseRule(current.id, patch);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PURCHASE_RULES_QUERY_KEY }),
  });
}

export interface PendingApproval {
  id: string;
  orderId: string;
  createdAt: string;
  order: {
    id: string;
    code: string;
    totalAmount: number;
    supplierName: string | null;
    quotesCount: number;
    justification: string | null;
    submittedAt: string | null;
  };
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["purchase_approvals", "pending"],
    staleTime: 15_000,
    queryFn: async (): Promise<PendingApproval[]> => {
      const [approvals, orders, suppliers] = await Promise.all([
        listPurchaseApprovals(),
        listPurchaseOrders(),
        listSuppliers(),
      ]);
      const orderById = new Map(orders.map((o) => [o.id, o]));
      const supplierById = new Map(suppliers.map((s) => [s.id, s]));

      return approvals
        .filter((a) => a.decision === "pending")
        .map((a) => {
          const order = orderById.get(a.purchase_order_id);
          return {
            id: a.id,
            orderId: a.purchase_order_id,
            createdAt: a.created_at,
            order: {
              id: order?.id ?? a.purchase_order_id,
              code: order?.code ?? "",
              totalAmount: order ? Number(order.total_amount) : 0,
              supplierName: order ? (supplierById.get(order.supplier_id)?.name ?? null) : null,
              quotesCount: order?.quotes_count ?? 0,
              justification: order?.justification ?? null,
              submittedAt: order?.submitted_at ?? null,
            },
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  });
}
