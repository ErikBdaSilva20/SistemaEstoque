import { Link } from "react-router-dom";
import { ArrowRight, FileCheck, FileText, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChainNode {
  type: "pr" | "rfq" | "po" | "received";
  id?: string | null;
  code?: string | null;
  active?: boolean;
}

interface Props {
  pr?: { id: string; code: string } | null;
  rfq?: { id: string; code: string } | null;
  po?: { id: string; code: string } | null;
  receivedFull?: boolean;
  active: "pr" | "rfq" | "po" | "received";
}

const ICONS = {
  pr: FileCheck,
  rfq: FileText,
  po: ShoppingCart,
  received: Package,
} as const;

const LABELS = {
  pr: "Solicitação",
  rfq: "Cotação",
  po: "Pedido",
  received: "Recebido",
} as const;

export function PurchaseChainBreadcrumb({ pr, rfq, po, receivedFull, active }: Props) {
  const nodes: ChainNode[] = [];
  if (pr) nodes.push({ type: "pr", id: pr.id, code: pr.code, active: active === "pr" });
  if (rfq) nodes.push({ type: "rfq", id: rfq.id, code: rfq.code, active: active === "rfq" });
  if (po) nodes.push({ type: "po", id: po.id, code: po.code, active: active === "po" });
  if (receivedFull) {
    nodes.push({ type: "received", code: "OK", active: active === "received" });
  }

  if (nodes.length <= 1) return null;

  return (
    <nav
      aria-label="Cadeia de compra"
      className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm shadow-elevation-1"
    >
      {nodes.map((node, i) => {
        const Icon = ICONS[node.type];
        const path =
          node.type === "pr"
            ? `/requests/${node.id}`
            : node.type === "rfq"
              ? `/quotes/${node.id}`
              : node.type === "po"
                ? `/purchases/${node.id}`
                : null;
        const content = (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors",
              node.active
                ? "bg-accent-primary/15 text-accent-primary font-medium"
                : "text-muted-foreground hover:text-text-primary",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{LABELS[node.type]}</span>
            <span className="font-mono text-xs">{node.code}</span>
          </span>
        );
        return (
          <span key={`${node.type}-${i}`} className="inline-flex items-center gap-2">
            {path && !node.active ? <Link to={path}>{content}</Link> : content}
            {i < nodes.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/60" />}
          </span>
        );
      })}
    </nav>
  );
}
