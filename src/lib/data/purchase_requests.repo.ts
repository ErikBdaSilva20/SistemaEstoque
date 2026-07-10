// Purchase requests repo + items.
// Tables: purchase_requests, purchase_request_items (items carry owner_id).
// RPCs dropped (ADR-006/rpcs-triggers.md): sequential code and status
// transitions become client-side logic (see usePurchaseRequests).

import { db } from "./client";
import type { Database } from "./types.gen";

export type PurchaseRequest = Database["public"]["Tables"]["purchase_requests"]["Row"];
export type PurchaseRequestInsert = Database["public"]["Tables"]["purchase_requests"]["Insert"];
export type PurchaseRequestUpdate = Database["public"]["Tables"]["purchase_requests"]["Update"];

export type PurchaseRequestItem = Database["public"]["Tables"]["purchase_request_items"]["Row"];
export type PurchaseRequestItemInsert =
  Database["public"]["Tables"]["purchase_request_items"]["Insert"];

export const listPurchaseRequests = () => db.table<PurchaseRequest>("purchase_requests").list();
export const createPurchaseRequest = (input: PurchaseRequestInsert) =>
  db.table<PurchaseRequest>("purchase_requests").create(input);
export const updatePurchaseRequest = (id: string, patch: PurchaseRequestUpdate) =>
  db.table<PurchaseRequest>("purchase_requests").update(id, patch);
export const deletePurchaseRequest = (id: string) =>
  db.table<PurchaseRequest>("purchase_requests").remove(id);

export const listPurchaseRequestItems = () =>
  db.table<PurchaseRequestItem>("purchase_request_items").list();
export const createPurchaseRequestItem = (input: PurchaseRequestItemInsert) =>
  db.table<PurchaseRequestItem>("purchase_request_items").create(input);
export const deletePurchaseRequestItem = (id: string) =>
  db.table<PurchaseRequestItem>("purchase_request_items").remove(id);
