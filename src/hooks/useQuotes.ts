import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listQuotes,
  createQuote,
  updateQuote,
  listQuoteItems,
  createQuoteItem,
  listQuoteSuppliers,
  createQuoteSupplier,
  type Quote,
} from "@/lib/data/quotes.repo";
import {
  listQuoteResponses,
  createQuoteResponse,
  type QuoteResponse,
} from "@/lib/data/quote_responses.repo";
import { listSuppliers } from "@/lib/data/suppliers.repo";
import { listProducts } from "@/lib/data/products.repo";
import {
  createPurchaseOrder,
  createPurchaseOrderItem,
  listPurchaseOrders,
} from "@/lib/data/purchase_orders.repo";
import { nextSequentialCode } from "@/lib/sequential-code";

export type { Quote, QuoteResponse };

export type QuoteWithRefs = Quote & { supplierCount: number; responseCount: number };

export interface QuoteDetail extends Quote {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    notes: string | null;
    product: { id: string; sku: string; name: string; unit: string } | null;
  }>;
  suppliers: Array<{
    id: string;
    supplierId: string;
    sentAt: string | null;
    supplier: { id: string; name: string; email: string | null; phone: string | null } | null;
  }>;
  responses: Array<QuoteResponse & { supplierName: string }>;
}

export interface CreateQuoteInput {
  title: string;
  deadline?: string | null;
  notes?: string | null;
  items: Array<{ productId: string; quantity: number; notes?: string | null }>;
  supplierIds: string[];
}

export interface CreateQuoteResponseInput {
  quoteId: string;
  supplierId: string;
  items: Array<{ productId: string; unitPrice: number; quantityOffered: number }>;
  deliveryDays?: number | null;
  paymentTerms?: string | null;
  notes?: string | null;
}

export const QUOTES_QUERY_KEY = ["quotes"] as const;

export function useQuoteRequests(status?: Quote["status"]) {
  return useQuery({
    queryKey: QUOTES_QUERY_KEY,
    staleTime: 15_000,
    queryFn: async (): Promise<QuoteWithRefs[]> => {
      const [quotes, suppliers, responses] = await Promise.all([
        listQuotes(),
        listQuoteSuppliers(),
        listQuoteResponses(),
      ]);
      const supplierCount = new Map<string, number>();
      for (const s of suppliers)
        supplierCount.set(s.quote_id, (supplierCount.get(s.quote_id) ?? 0) + 1);
      const responseCount = new Map<string, number>();
      for (const r of responses)
        responseCount.set(r.quote_id, (responseCount.get(r.quote_id) ?? 0) + 1);

      return quotes
        .filter((q) => !status || q.status === status)
        .map((q) => ({
          ...q,
          supplierCount: supplierCount.get(q.id) ?? 0,
          responseCount: responseCount.get(q.id) ?? 0,
        }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
  });
}

export function useQuoteRequest(id: string | undefined) {
  return useQuery({
    queryKey: [...QUOTES_QUERY_KEY, "detail", id],
    enabled: !!id,
    staleTime: 10_000,
    queryFn: async (): Promise<QuoteDetail | null> => {
      const [quotes, items, quoteSuppliers, responses, products, suppliers] = await Promise.all([
        listQuotes(),
        listQuoteItems(),
        listQuoteSuppliers(),
        listQuoteResponses(),
        listProducts(),
        listSuppliers(),
      ]);
      const quote = quotes.find((q) => q.id === id);
      if (!quote) return null;

      const productById = new Map(products.map((p) => [p.id, p]));
      const supplierById = new Map(suppliers.map((s) => [s.id, s]));

      return {
        ...quote,
        items: items
          .filter((i) => i.quote_id === id)
          .map((i) => {
            const product = productById.get(i.product_id);
            return {
              id: i.id,
              productId: i.product_id,
              quantity: i.quantity,
              notes: i.notes,
              product: product
                ? { id: product.id, sku: product.sku, name: product.name, unit: product.unit }
                : null,
            };
          }),
        suppliers: quoteSuppliers
          .filter((s) => s.quote_id === id)
          .map((s) => {
            const supplier = supplierById.get(s.supplier_id);
            return {
              id: s.id,
              supplierId: s.supplier_id,
              sentAt: s.sent_at,
              supplier: supplier
                ? {
                    id: supplier.id,
                    name: supplier.name,
                    email: supplier.email,
                    phone: supplier.phone,
                  }
                : null,
            };
          }),
        responses: responses
          .filter((r) => r.quote_id === id)
          .map((r) => ({ ...r, supplierName: r.supplier_name }))
          .sort((a, b) => a.total_amount - b.total_amount),
      };
    },
  });
}

export function useQuoteMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });

  const create = useMutation({
    mutationFn: async (input: CreateQuoteInput) => {
      if (input.items.length === 0) throw new Error("Add at least one item.");
      if (input.supplierIds.length === 0) throw new Error("Add at least one supplier.");

      const existing = await listQuotes();
      const quote = await createQuote({
        code: nextSequentialCode(
          existing.map((q) => q.code),
          "COT",
        ),
        title: input.title,
        deadline: input.deadline ?? null,
        notes: input.notes ?? null,
        status: "draft",
      });

      await Promise.all([
        ...input.items.map((i) =>
          createQuoteItem({
            quote_id: quote.id,
            product_id: i.productId,
            quantity: i.quantity,
            notes: i.notes ?? null,
          }),
        ),
        ...input.supplierIds.map((supplierId) =>
          createQuoteSupplier({ quote_id: quote.id, supplier_id: supplierId }),
        ),
      ]);

      return quote;
    },
    onSuccess: invalidate,
  });

  // No send edge function (WhatsApp/email = extension, see
  // stories/gateway-extensions/ext-004). V1 only marks it as sent; the buyer
  // sends the quote out-of-band and registers the response manually.
  const markSent = useMutation({
    mutationFn: (quoteId: string) =>
      updateQuote(quoteId, { status: "sent", sent_at: new Date().toISOString() }),
    onSuccess: invalidate,
  });

  const addResponse = useMutation({
    mutationFn: async (input: CreateQuoteResponseInput) => {
      const suppliers = await listSuppliers();
      const supplier = suppliers.find((s) => s.id === input.supplierId);
      const totalAmount = input.items.reduce((acc, i) => acc + i.unitPrice * i.quantityOffered, 0);

      await createQuoteResponse({
        quote_id: input.quoteId,
        supplier_id: input.supplierId,
        supplier_name: supplier?.name ?? "",
        items: input.items,
        total_amount: totalAmount,
        delivery_days: input.deliveryDays ?? null,
        payment_terms: input.paymentTerms ?? null,
        notes: input.notes ?? null,
      });

      const quotes = await listQuotes();
      const quote = quotes.find((q) => q.id === input.quoteId);
      if (quote?.status === "sent") {
        await updateQuote(input.quoteId, { status: "receiving" });
      }
    },
    onSuccess: invalidate,
  });

  // RPC `convert_quote_to_purchase_order` dropped: creates the PO from the
  // chosen response, with its items (ADR-006).
  const convert = useMutation({
    mutationFn: async (input: {
      responseId: string;
      expectedDate?: string | null;
      notes?: string | null;
    }) => {
      const [responses, quotes, existingOrders] = await Promise.all([
        listQuoteResponses(),
        listQuotes(),
        listPurchaseOrders(),
      ]);
      const response = responses.find((r) => r.id === input.responseId);
      if (!response) throw new Error("Quote response not found.");
      const quote = quotes.find((q) => q.id === response.quote_id);

      const order = await createPurchaseOrder({
        code: nextSequentialCode(
          existingOrders.map((o) => o.code),
          "PO",
        ),
        supplier_id: response.supplier_id,
        supplier_name: response.supplier_name,
        purchase_request_id: quote?.purchase_request_id ?? null,
        expected_date: input.expectedDate ?? null,
        justification: input.notes ?? null,
        total_amount: response.total_amount,
        quotes_count: quote
          ? (await listQuoteResponses()).filter((r) => r.quote_id === quote.id).length
          : 0,
        status: "draft",
      });

      const products = await listProducts();
      const productById = new Map(products.map((p) => [p.id, p]));
      const items = response.items as Array<{
        productId: string;
        unitPrice: number;
        quantityOffered: number;
      }>;
      await Promise.all(
        items.map((i) =>
          createPurchaseOrderItem({
            purchase_order_id: order.id,
            product_id: i.productId,
            product_name: productById.get(i.productId)?.name ?? "",
            quantity_ordered: i.quantityOffered,
            unit_cost: i.unitPrice,
          }),
        ),
      );

      await updateQuote(response.quote_id, {
        status: "closed",
        closed_at: new Date().toISOString(),
        winning_response_id: response.id,
        converted_to_order_id: order.id,
      });

      return order;
    },
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (quoteId: string) => updateQuote(quoteId, { status: "cancelled" }),
    onSuccess: invalidate,
  });

  return { create, markSent, addResponse, convert, cancel };
}
