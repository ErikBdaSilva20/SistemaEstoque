// Movement reasons repo (lookup, no owner_id).
// Table: movement_reasons. Write restricted to admin/manager (RoleGate in the UI).

import { db } from "./client";
import type { Database } from "./types.gen";

export type MovementReason = Database["public"]["Tables"]["movement_reasons"]["Row"];
export type MovementReasonInsert = Database["public"]["Tables"]["movement_reasons"]["Insert"];
export type MovementReasonUpdate = Database["public"]["Tables"]["movement_reasons"]["Update"];

export const listMovementReasons = () => db.table<MovementReason>("movement_reasons").list();
export const createMovementReason = (input: MovementReasonInsert) =>
  db.table<MovementReason>("movement_reasons").create(input);
export const updateMovementReason = (id: string, patch: MovementReasonUpdate) =>
  db.table<MovementReason>("movement_reasons").update(id, patch);
export const deleteMovementReason = (id: string) =>
  db.table<MovementReason>("movement_reasons").remove(id);
