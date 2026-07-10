// Product batches repo.
// Table: product_batches (expiration/quantity tracking per batch).

import { db } from "./client";
import type { Database } from "./types.gen";

export type ProductBatch = Database["public"]["Tables"]["product_batches"]["Row"];
export type ProductBatchInsert = Database["public"]["Tables"]["product_batches"]["Insert"];
export type ProductBatchUpdate = Database["public"]["Tables"]["product_batches"]["Update"];

export const listProductBatches = () => db.table<ProductBatch>("product_batches").list();
export const createProductBatch = (input: ProductBatchInsert) =>
  db.table<ProductBatch>("product_batches").create(input);
export const updateProductBatch = (id: string, patch: ProductBatchUpdate) =>
  db.table<ProductBatch>("product_batches").update(id, patch);
export const deleteProductBatch = (id: string) =>
  db.table<ProductBatch>("product_batches").remove(id);
