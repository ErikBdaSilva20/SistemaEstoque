// Stock destinations repo (lookup, no owner_id).
// Table: stock_destinations. Write restricted to admin/manager.

import { db } from "./client";
import type { Database } from "./types.gen";

export type StockDestination = Database["public"]["Tables"]["stock_destinations"]["Row"];
export type StockDestinationInsert = Database["public"]["Tables"]["stock_destinations"]["Insert"];
export type StockDestinationUpdate = Database["public"]["Tables"]["stock_destinations"]["Update"];

export const listStockDestinations = () => db.table<StockDestination>("stock_destinations").list();
export const createStockDestination = (input: StockDestinationInsert) =>
  db.table<StockDestination>("stock_destinations").create(input);
export const updateStockDestination = (id: string, patch: StockDestinationUpdate) =>
  db.table<StockDestination>("stock_destinations").update(id, patch);
export const deleteStockDestination = (id: string) =>
  db.table<StockDestination>("stock_destinations").remove(id);
