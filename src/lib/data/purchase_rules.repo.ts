// Purchase rules repo (lookup, no owner_id).
// Table: purchase_rules. Write restricted to admin/manager.

import { db } from "./client";
import type { Database } from "./types.gen";

export type PurchaseRule = Database["public"]["Tables"]["purchase_rules"]["Row"];
export type PurchaseRuleUpdate = Database["public"]["Tables"]["purchase_rules"]["Update"];

export const listPurchaseRules = () => db.table<PurchaseRule>("purchase_rules").list();
export const updatePurchaseRule = (id: string, patch: PurchaseRuleUpdate) =>
  db.table<PurchaseRule>("purchase_rules").update(id, patch);
