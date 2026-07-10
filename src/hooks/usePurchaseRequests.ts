import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequest,
  listPurchaseRequestItems,
  createPurchaseRequestItem,
  type PurchaseRequest,
  type PurchaseRequestItem,
} from "@/lib/data/purchase_requests.repo";
import { listProducts } from "@/lib/data/products.repo";
import {
  createQuote,
  createQuoteItem,
  createQuoteSupplier,
  listQuotes,
} from "@/lib/data/quotes.repo";
import {
  createPurchaseOrder,
  createPurchaseOrderItem,
  listPurchaseOrders,
} from "@/lib/data/purchase_orders.repo";
import { listSuppliers } from "@/lib/data/suppliers.repo";
import { nextSequentialCode } from "@/lib/sequential-code";
import { QUOTES_QUERY_KEY } from "./useQuotes";
import { PURCHASES_QUERY_KEY } from "./usePurchases";

export type { PurchaseRequest, PurchaseRequestItem };

export interface PurchaseRequestInput {
  title: string;
  justification?: string | null;
  priority: PurchaseRequest["priority"];
  expectedDate?: string | null;
  notes?: string | null;
  items: {
    productId: string;
    quantity: number;
    estimatedUnitCost?: number | null;
    notes?: string | null;
  }[];
}

export const PR_QUERY_KEY = ["purchase_requests"] as const;

export function usePurchaseRequests(status?: PurchaseRequest["status"]) {
  return useQuery({
    queryKey: PR_QUERY_KEY,
    queryFn: listPurchaseRequests,
    staleTime: 15_000,
    select: (rows) => {
      const filtered = status ? rows.filter((r) => r.status === status) : rows;
      return [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
  });
}

// list-then-find + 2nd query for items (no get-by-id or join in generic mode).
export function usePurchaseRequest(id: string | undefined) {
  return useQuery({
    queryKey: [...PR_QUERY_KEY, "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const [requests, items, products] = await Promise.all([
        listPurchaseRequests(),
        listPurchaseRequestItems(),
        listProducts(),
      ]);
      const request = requests.find((r) => r.id === id);
      if (!request) return null;
      const productById = new Map(products.map((p) => [p.id, p]));
      const requestItems = items
        .filter((i) => i.purchase_request_id === id)
        .map((i) => ({ ...i, product: productById.get(i.product_id) ?? null }));
      return { ...request, items: requestItems };
    },
  });
}

export function usePurchaseRequestMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: PR_QUERY_KEY });

  const create = useMutation({
    mutationFn: async (input: PurchaseRequestInput) => {
      if (input.items.length === 0) throw new Error("Add at least one item.");
      const existing = await listPurchaseRequests();
      const request = await createPurchaseRequest({
        code: nextSequentialCode(
          existing.map((r) => r.code),
          "SOL",
        ),
        title: input.title,
        justification: input.justification ?? null,
        priority: input.priority,
        expected_date: input.expectedDate ?? null,
        notes: input.notes ?? null,
        status: "draft",
      });
      try {
        await Promise.all(
          input.items.map((it) =>
            createPurchaseRequestItem({
              purchase_request_id: request.id,
              product_id: it.productId,
              quantity: it.quantity,
              estimated_unit_cost: it.estimatedUnitCost ?? null,
              notes: it.notes ?? null,
            }),
          ),
        );
      } catch (err) {
        // No transaction in generic mode: if items fail, cancel the header so
        // we don't leave an orphaned request with no items.
        await updatePurchaseRequest(request.id, { status: "cancelled" }).catch(() => {});
        throw err;
      }
      return request;
    },
    onSuccess: invalidate,
  });

  const submit = useMutation({
    mutationFn: ({ id }: { id: string; justification?: string | null }) =>
      updatePurchaseRequest(id, {
        status: "pending_approval",
        submitted_at: new Date().toISOString(),
      }),
    onSuccess: invalidate,
  });

  const approve = useMutation({
    mutationFn: ({ id }: { id: string; comment?: string | null }) =>
      updatePurchaseRequest(id, { status: "approved", approved_at: new Date().toISOString() }),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      updatePurchaseRequest(id, {
        status: "rejected",
        rejected_at: new Date().toISOString(),
        rejection_reason: reason,
      }),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => updatePurchaseRequest(id, { status: "cancelled" }),
    onSuccess: invalidate,
  });

  // RPC `convert_request_to_rfq` dropped (ADR-006): creates 1 quote + N supplier
  // invites + copied items, all client-side, no transaction.
  const convertToRfq = useMutation({
    mutationFn: async (input: {
      id: string;
      supplierIds: string[];
      deadline?: string | null;
      title?: string | null;
    }) => {
      const [requests, requestItems, existingQuotes] = await Promise.all([
        listPurchaseRequests(),
        listPurchaseRequestItems(),
        listQuotes(),
      ]);
      const request = requests.find((r) => r.id === input.id);
      if (!request) throw new Error("Purchase request not found.");

      const quote = await createQuote({
        code: nextSequentialCode(
          existingQuotes.map((q) => q.code),
          "COT",
        ),
        title: input.title ?? request.title,
        purchase_request_id: request.id,
        deadline: input.deadline ?? null,
        status: "draft",
      });

      await Promise.all([
        ...input.supplierIds.map((supplierId) =>
          createQuoteSupplier({ quote_id: quote.id, supplier_id: supplierId }),
        ),
        ...requestItems
          .filter((i) => i.purchase_request_id === request.id)
          .map((i) =>
            createQuoteItem({ quote_id: quote.id, product_id: i.product_id, quantity: i.quantity }),
          ),
      ]);

      await updatePurchaseRequest(request.id, {
        status: "converted",
        converted_to_quote_id: quote.id,
      });
      return quote;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: QUOTES_QUERY_KEY });
    },
  });

  // RPC `convert_request_to_po` dropped: creates the PO directly (no quote),
  // copying the request's items with the estimated cost as the unit cost.
  const convertToPo = useMutation({
    mutationFn: async (input: { id: string; supplierId: string; expectedDate?: string | null }) => {
      const [requests, requestItems, suppliers, existingOrders] = await Promise.all([
        listPurchaseRequests(),
        listPurchaseRequestItems(),
        listSuppliers(),
        listPurchaseOrders(),
      ]);
      const request = requests.find((r) => r.id === input.id);
      if (!request) throw new Error("Purchase request not found.");
      const supplier = suppliers.find((s) => s.id === input.supplierId);
      if (!supplier) throw new Error("Supplier not found.");

      const items = requestItems.filter((i) => i.purchase_request_id === request.id);
      const total = items.reduce(
        (acc, i) => acc + Number(i.quantity) * Number(i.estimated_unit_cost ?? 0),
        0,
      );

      const order = await createPurchaseOrder({
        code: nextSequentialCode(
          existingOrders.map((o) => o.code),
          "PO",
        ),
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        purchase_request_id: request.id,
        expected_date: input.expectedDate ?? null,
        total_amount: total,
        status: "draft",
      });

      const products = await listProducts();
      const productById = new Map(products.map((p) => [p.id, p]));
      await Promise.all(
        items.map((i) =>
          createPurchaseOrderItem({
            purchase_order_id: order.id,
            product_id: i.product_id,
            product_name: productById.get(i.product_id)?.name ?? "",
            quantity_ordered: i.quantity,
            unit_cost: Number(i.estimated_unit_cost ?? 0),
          }),
        ),
      );

      await updatePurchaseRequest(request.id, {
        status: "converted",
        converted_to_order_id: order.id,
      });
      return order;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });
    },
  });

  return { create, submit, approve, reject, cancel, convertToRfq, convertToPo };
}
