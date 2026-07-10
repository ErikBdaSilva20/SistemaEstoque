// Stock movements repo (kardex).
// Table: stock_movements. No balance RPC -- current_stock on `products` is
// adjusted client-side on every movement (see useMovements).

import { db } from "./client";
import type { Database } from "./types.gen";

export type StockMovement = Database["public"]["Tables"]["stock_movements"]["Row"];
export type StockMovementInsert = Database["public"]["Tables"]["stock_movements"]["Insert"];

export const listStockMovements = () => db.table<StockMovement>("stock_movements").list();
export const createStockMovement = (input: StockMovementInsert) =>
  db.table<StockMovement>("stock_movements").create(input);
