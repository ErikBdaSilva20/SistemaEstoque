import type { PurchaseOrder } from "@/hooks/usePurchases";

export type PurchaseOrderStatus = PurchaseOrder["status"];

export interface PurchaseOrderStatusMeta {
  label: string;
  badgeClassName: string;
}

/**
 * Single source of truth for how each purchase-order status is labeled and
 * colored. Previously duplicated (and drifting) across Purchases list,
 * PurchaseOrderDetail and the Dashboard — same status showed different text
 * ("Aguarda aprovação" / "Aguardando aprovação" / "Pendente aprovação") and
 * even different colors ("cancelled" was red in two places, gray in another).
 */
export const PURCHASE_ORDER_STATUS_META: Record<PurchaseOrderStatus, PurchaseOrderStatusMeta> = {
  draft: { label: "Rascunho", badgeClassName: "bg-muted text-muted-foreground" },
  pending_approval: {
    label: "Aguardando aprovação",
    badgeClassName: "bg-warning/15 text-warning",
  },
  rejected: { label: "Rejeitado", badgeClassName: "bg-destructive/15 text-destructive" },
  sent: { label: "Enviado", badgeClassName: "bg-accent-primary/15 text-accent-primary" },
  partially_received: {
    label: "Parcialmente recebido",
    badgeClassName: "bg-warning/15 text-warning",
  },
  fully_received: { label: "Recebido", badgeClassName: "bg-accent-success/15 text-accent-success" },
  cancelled: { label: "Cancelado", badgeClassName: "bg-muted text-muted-foreground" },
};

/** Chronological-ish order used everywhere a status list/filter is rendered. */
export const PURCHASE_ORDER_STATUS_ORDER: PurchaseOrderStatus[] = [
  "draft",
  "pending_approval",
  "rejected",
  "sent",
  "partially_received",
  "fully_received",
  "cancelled",
];
