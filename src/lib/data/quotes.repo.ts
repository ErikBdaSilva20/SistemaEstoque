// Quotes (RFQ) repo + items + invited suppliers.
// Tables: quotes, quote_items, quote_suppliers (all carry owner_id).

import { db } from "./client";
import type { Database } from "./types.gen";

export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type QuoteInsert = Database["public"]["Tables"]["quotes"]["Insert"];
export type QuoteUpdate = Database["public"]["Tables"]["quotes"]["Update"];

export type QuoteItem = Database["public"]["Tables"]["quote_items"]["Row"];
export type QuoteItemInsert = Database["public"]["Tables"]["quote_items"]["Insert"];

export type QuoteSupplier = Database["public"]["Tables"]["quote_suppliers"]["Row"];
export type QuoteSupplierInsert = Database["public"]["Tables"]["quote_suppliers"]["Insert"];

export const listQuotes = () => db.table<Quote>("quotes").list();
export const createQuote = (input: QuoteInsert) => db.table<Quote>("quotes").create(input);
export const updateQuote = (id: string, patch: QuoteUpdate) =>
  db.table<Quote>("quotes").update(id, patch);
export const deleteQuote = (id: string) => db.table<Quote>("quotes").remove(id);

export const listQuoteItems = () => db.table<QuoteItem>("quote_items").list();
export const createQuoteItem = (input: QuoteItemInsert) =>
  db.table<QuoteItem>("quote_items").create(input);

export const listQuoteSuppliers = () => db.table<QuoteSupplier>("quote_suppliers").list();
export const createQuoteSupplier = (input: QuoteSupplierInsert) =>
  db.table<QuoteSupplier>("quote_suppliers").create(input);
export const updateQuoteSupplier = (id: string, patch: Partial<QuoteSupplierInsert>) =>
  db.table<QuoteSupplier>("quote_suppliers").update(id, patch);
