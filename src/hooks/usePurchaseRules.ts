import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPurchaseRules,
  updatePurchaseRule,
  type PurchaseRule,
  type PurchaseRuleUpdate,
} from "@/lib/data/purchase_rules.repo";

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
