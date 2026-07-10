import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  listPurchaseOrderItems,
  createPurchaseOrderItem,
  updatePurchaseOrderItem,
  type PurchaseOrder,
  type PurchaseOrderItem,
} from "@/lib/data/purchase_orders.repo";
import { listSuppliers, type Supplier } from "@/lib/data/suppliers.repo";
import { listProducts, updateProduct } from "@/lib/data/products.repo";
import { createStockMovement } from "@/lib/data/stock_movements.repo";
import { nextSequentialCode } from "@/lib/sequential-code";
import { PRODUCTS_QUERY_KEY } from "./useProducts";
import { MOVEMENTS_QUERY_KEY } from "./useMovements";

export type { PurchaseOrder, PurchaseOrderItem };

export type PurchaseOrderWithRefs = PurchaseOrder & {
  supplier: Pick<Supplier, "id" | "name" | "lead_time_days"> | null;
  itemsCount: number;
};

export type PurchaseOrderDetail = PurchaseOrder & {
  supplier: Supplier | null;
  items: Array<
    PurchaseOrderItem & {
      product: {
        id: string;
        sku: string;
        unit: string;
        current_stock: number;
        min_stock: number;
      } | null;
    }
  >;
};

export interface PurchaseOrderInput {
  supplierId: string;
  expectedDate?: string | null;
  notes?: string | null;
  items: { productId: string; quantityOrdered: number; unitCost: number }[];
}

export interface ReceiveItemsInput {
  orderId: string;
  items: { itemId: string; quantityToReceive: number }[];
}

export const PURCHASES_QUERY_KEY = ["purchase_orders"] as const;

export function usePurchaseOrders(status?: PurchaseOrder["status"]) {
  return useQuery({
    queryKey: PURCHASES_QUERY_KEY,
    staleTime: 15_000,
    queryFn: async (): Promise<PurchaseOrderWithRefs[]> => {
      const [orders, items, suppliers] = await Promise.all([
        listPurchaseOrders(),
        listPurchaseOrderItems(),
        listSuppliers(),
      ]);
      const itemCountByOrder = new Map<string, number>();
      for (const i of items) {
        itemCountByOrder.set(
          i.purchase_order_id,
          (itemCountByOrder.get(i.purchase_order_id) ?? 0) + 1,
        );
      }
      const supplierById = new Map(suppliers.map((s) => [s.id, s]));

      return orders
        .map((o) => ({
          ...o,
          supplier: supplierById.get(o.supplier_id) ?? null,
          itemsCount: itemCountByOrder.get(o.id) ?? 0,
        }))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    // Filter client-side via `select`, not inside `queryFn` -- see useCountSessions.ts
    // for why filtering inside queryFn with a status-agnostic queryKey is a bug.
    select: (rows) => (status ? rows.filter((r) => r.status === status) : rows),
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: [...PURCHASES_QUERY_KEY, "detail", id],
    enabled: !!id,
    queryFn: async (): Promise<PurchaseOrderDetail | null> => {
      const [orders, items, suppliers, products] = await Promise.all([
        listPurchaseOrders(),
        listPurchaseOrderItems(),
        listSuppliers(),
        listProducts(),
      ]);
      const order = orders.find((o) => o.id === id);
      if (!order) return null;
      const productById = new Map(products.map((p) => [p.id, p]));

      return {
        ...order,
        supplier: suppliers.find((s) => s.id === order.supplier_id) ?? null,
        items: items
          .filter((i) => i.purchase_order_id === id)
          .map((i) => {
            const product = productById.get(i.product_id);
            return {
              ...i,
              product: product
                ? {
                    id: product.id,
                    sku: product.sku,
                    unit: product.unit,
                    current_stock: product.current_stock,
                    min_stock: product.min_stock,
                  }
                : null,
            };
          }),
      };
    },
  });
}

export function usePurchaseMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: PURCHASES_QUERY_KEY });

  const create = useMutation({
    mutationFn: async (input: PurchaseOrderInput) => {
      if (input.items.length === 0) throw new Error("Add at least one item to the order.");
      const [suppliers, products, existing] = await Promise.all([
        listSuppliers(),
        listProducts(),
        listPurchaseOrders(),
      ]);
      const supplier = suppliers.find((s) => s.id === input.supplierId);
      if (!supplier) throw new Error("Supplier not found.");
      const productById = new Map(products.map((p) => [p.id, p]));

      const total = input.items.reduce((acc, it) => acc + it.quantityOrdered * it.unitCost, 0);
      const order = await createPurchaseOrder({
        code: nextSequentialCode(
          existing.map((o) => o.code),
          "PO",
        ),
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        expected_date: input.expectedDate ?? null,
        notes: input.notes ?? null,
        total_amount: total,
        status: "draft",
      });

      try {
        await Promise.all(
          input.items.map((it) =>
            createPurchaseOrderItem({
              purchase_order_id: order.id,
              product_id: it.productId,
              product_name: productById.get(it.productId)?.name ?? "",
              quantity_ordered: it.quantityOrdered,
              unit_cost: it.unitCost,
            }),
          ),
        );
      } catch (err) {
        await updatePurchaseOrder(order.id, { status: "cancelled" }).catch(() => {});
        throw err;
      }

      return order;
    },
    onSuccess: invalidate,
  });

  // RPC `submit_purchase_order` dropped (ADR-006): the approval-amount rule
  // is evaluated client-side before calling this mutation -- see
  // PurchaseOrderDetail / purchase_rules.
  const submit = useMutation({
    mutationFn: ({ orderId, needsApproval }: { orderId: string; needsApproval: boolean }) =>
      updatePurchaseOrder(orderId, {
        status: needsApproval ? "pending_approval" : "sent",
        submitted_at: new Date().toISOString(),
        sent_at: needsApproval ? null : new Date().toISOString(),
      }),
    onSuccess: invalidate,
  });

  const approve = useMutation({
    mutationFn: ({ orderId }: { orderId: string; comment?: string | null }) =>
      updatePurchaseOrder(orderId, {
        status: "sent",
        approved_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      }),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ orderId }: { orderId: string; comment: string }) =>
      updatePurchaseOrder(orderId, { status: "rejected", rejected_at: new Date().toISOString() }),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (orderId: string) =>
      updatePurchaseOrder(orderId, { status: "cancelled", cancelled_at: new Date().toISOString() }),
    onSuccess: invalidate,
  });

  // RPC `receive_purchase_order_items` dropped: client-side loop -- each
  // received item becomes an update() on the item + createStockMovement of
  // type "in" (no transaction; ADR-006 accepts this risk at the expected volume).
  async function applyReceivedItems(
    orderId: string,
    toReceive: { itemId: string; quantityToReceive: number }[],
  ) {
    const [items, orders, products] = await Promise.all([
      listPurchaseOrderItems(),
      listPurchaseOrders(),
      listProducts(),
    ]);
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Purchase order not found.");
    const orderItems = items.filter((i) => i.purchase_order_id === orderId);
    const productById = new Map(products.map((p) => [p.id, p]));

    for (const receive of toReceive) {
      const item = orderItems.find((i) => i.id === receive.itemId);
      if (!item) continue;
      const newReceived = Number(item.quantity_received) + receive.quantityToReceive;
      await updatePurchaseOrderItem(item.id, { quantity_received: newReceived });
      await createStockMovement({
        product_id: item.product_id,
        product_name: item.product_name,
        type: "in",
        origin: "purchase",
        quantity: receive.quantityToReceive,
        reference_id: order.id,
      });
      const product = productById.get(item.product_id);
      if (product) {
        await updateProduct(product.id, {
          current_stock: Number(product.current_stock) + receive.quantityToReceive,
        });
      }
    }

    const allFull = orderItems.every((i) => {
      const receive = toReceive.find((r) => r.itemId === i.id);
      const received = receive
        ? Number(i.quantity_received) + receive.quantityToReceive
        : Number(i.quantity_received);
      return received >= Number(i.quantity_ordered);
    });

    await updatePurchaseOrder(order.id, {
      status: allFull ? "fully_received" : "partially_received",
      received_at: new Date().toISOString(),
    });
  }

  const receiveItems = useMutation({
    mutationFn: (input: ReceiveItemsInput) => applyReceivedItems(input.orderId, input.items),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });

  return { create, submit, approve, reject, cancel, receiveItems };
}
