// Purchase orders repo + items.
// Tables: purchase_orders, purchase_order_items (items carry owner_id, plus
// product_name/supplier_name denormalized per SS B5).
// RPCs dropped: submit/approve/reject/receive become direct update() calls
// client-side (see docs/audit/by-area/rpcs-triggers.md and ADR-006).

import { db } from "./client";
import type { Database } from "./types.gen";

export type PurchaseOrder = Database["public"]["Tables"]["purchase_orders"]["Row"];
export type PurchaseOrderInsert = Database["public"]["Tables"]["purchase_orders"]["Insert"];
export type PurchaseOrderUpdate = Database["public"]["Tables"]["purchase_orders"]["Update"];

export type PurchaseOrderItem = Database["public"]["Tables"]["purchase_order_items"]["Row"];
export type PurchaseOrderItemInsert =
  Database["public"]["Tables"]["purchase_order_items"]["Insert"];
export type PurchaseOrderItemUpdate =
  Database["public"]["Tables"]["purchase_order_items"]["Update"];

export const listPurchaseOrders = () => db.table<PurchaseOrder>("purchase_orders").list();
export const createPurchaseOrder = (input: PurchaseOrderInsert) =>
  db.table<PurchaseOrder>("purchase_orders").create(input);
export const updatePurchaseOrder = (id: string, patch: PurchaseOrderUpdate) =>
  db.table<PurchaseOrder>("purchase_orders").update(id, patch);
export const deletePurchaseOrder = (id: string) =>
  db.table<PurchaseOrder>("purchase_orders").remove(id);

export const listPurchaseOrderItems = () =>
  db.table<PurchaseOrderItem>("purchase_order_items").list();
export const createPurchaseOrderItem = (input: PurchaseOrderItemInsert) =>
  db.table<PurchaseOrderItem>("purchase_order_items").create(input);
export const updatePurchaseOrderItem = (id: string, patch: PurchaseOrderItemUpdate) =>
  db.table<PurchaseOrderItem>("purchase_order_items").update(id, patch);
