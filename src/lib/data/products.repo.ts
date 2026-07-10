// Products repo.
// Table: products.
// owner_id is never sent (the gateway sets it from the session).

import { db } from "./client";
import type { Database } from "./types.gen";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export const listProducts = () => db.table<Product>("products").list();
export const createProduct = (input: ProductInsert) => db.table<Product>("products").create(input);
export const updateProduct = (id: string, patch: ProductUpdate) =>
  db.table<Product>("products").update(id, patch);
export const deleteProduct = (id: string) => db.table<Product>("products").remove(id);
