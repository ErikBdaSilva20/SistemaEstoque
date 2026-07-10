// Suppliers repo.
// Table: suppliers.

import { db } from "./client";
import type { Database } from "./types.gen";

export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type SupplierInsert = Database["public"]["Tables"]["suppliers"]["Insert"];
export type SupplierUpdate = Database["public"]["Tables"]["suppliers"]["Update"];

export const listSuppliers = () => db.table<Supplier>("suppliers").list();
export const createSupplier = (input: SupplierInsert) =>
  db.table<Supplier>("suppliers").create(input);
export const updateSupplier = (id: string, patch: SupplierUpdate) =>
  db.table<Supplier>("suppliers").update(id, patch);
export const deleteSupplier = (id: string) => db.table<Supplier>("suppliers").remove(id);
