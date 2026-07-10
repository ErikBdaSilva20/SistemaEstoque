// Quote responses repo (supplier proposals).
// Table: quote_responses.

import { db } from "./client";
import type { Database } from "./types.gen";

export type QuoteResponse = Database["public"]["Tables"]["quote_responses"]["Row"];
export type QuoteResponseInsert = Database["public"]["Tables"]["quote_responses"]["Insert"];

export const listQuoteResponses = () => db.table<QuoteResponse>("quote_responses").list();
export const createQuoteResponse = (input: QuoteResponseInsert) =>
  db.table<QuoteResponse>("quote_responses").create(input);
export const deleteQuoteResponse = (id: string) =>
  db.table<QuoteResponse>("quote_responses").remove(id);
