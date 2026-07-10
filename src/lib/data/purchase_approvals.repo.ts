// Purchase order approvals repo.
// Table: purchase_approvals.

import { db } from "./client";
import type { Database } from "./types.gen";

export type PurchaseApproval = Database["public"]["Tables"]["purchase_approvals"]["Row"];
export type PurchaseApprovalInsert = Database["public"]["Tables"]["purchase_approvals"]["Insert"];
export type PurchaseApprovalUpdate = Database["public"]["Tables"]["purchase_approvals"]["Update"];

export const listPurchaseApprovals = () => db.table<PurchaseApproval>("purchase_approvals").list();
export const createPurchaseApproval = (input: PurchaseApprovalInsert) =>
  db.table<PurchaseApproval>("purchase_approvals").create(input);
export const updatePurchaseApproval = (id: string, patch: PurchaseApprovalUpdate) =>
  db.table<PurchaseApproval>("purchase_approvals").update(id, patch);
