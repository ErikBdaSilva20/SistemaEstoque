// Inventory count sessions repo + items.
// Tables: count_sessions, count_items (items carry owner_id).
// RPC `close_count_session` dropped: closing computes diffs client-side and
// creates adjustment stock_movements (see useCountSessions, story 013).

import { db } from "./client";
import type { Database } from "./types.gen";

export type CountSession = Database["public"]["Tables"]["count_sessions"]["Row"];
export type CountSessionInsert = Database["public"]["Tables"]["count_sessions"]["Insert"];
export type CountSessionUpdate = Database["public"]["Tables"]["count_sessions"]["Update"];

export type CountItem = Database["public"]["Tables"]["count_items"]["Row"];
export type CountItemInsert = Database["public"]["Tables"]["count_items"]["Insert"];
export type CountItemUpdate = Database["public"]["Tables"]["count_items"]["Update"];

export const listCountSessions = () => db.table<CountSession>("count_sessions").list();
export const createCountSession = (input: CountSessionInsert) =>
  db.table<CountSession>("count_sessions").create(input);
export const updateCountSession = (id: string, patch: CountSessionUpdate) =>
  db.table<CountSession>("count_sessions").update(id, patch);

export const listCountItems = () => db.table<CountItem>("count_items").list();
export const createCountItem = (input: CountItemInsert) =>
  db.table<CountItem>("count_items").create(input);
export const updateCountItem = (id: string, patch: CountItemUpdate) =>
  db.table<CountItem>("count_items").update(id, patch);
