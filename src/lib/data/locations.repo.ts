// Stock locations repo.
// Table: locations. Carries owner_id (pattern suggested in stories/v1/016 -- rep
// registers their own location).

import { db } from "./client";
import type { Database } from "./types.gen";

export type Location = Database["public"]["Tables"]["locations"]["Row"];
export type LocationInsert = Database["public"]["Tables"]["locations"]["Insert"];
export type LocationUpdate = Database["public"]["Tables"]["locations"]["Update"];

export const listLocations = () => db.table<Location>("locations").list();
export const createLocation = (input: LocationInsert) =>
  db.table<Location>("locations").create(input);
export const updateLocation = (id: string, patch: LocationUpdate) =>
  db.table<Location>("locations").update(id, patch);
export const deleteLocation = (id: string) => db.table<Location>("locations").remove(id);
