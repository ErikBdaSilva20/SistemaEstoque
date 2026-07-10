import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { invokeEdge } from "@/lib/edge-fn";
import { SaleWebhookCard } from "./SaleWebhookCard";
import { WhatsappCard } from "./WhatsappCard";
import { EmailCard } from "./EmailCard";
import { ShopifyCard } from "./ShopifyCard";
import { BlingCard } from "./BlingCard";

export interface IntegrationRow {
  id: string;
  type: string;
  is_active: boolean;
  config: unknown;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  updated_at: string;
}

export function IntegrationsPanel() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["integrations"],
    queryFn: () =>
      invokeEdge<{ integrations: IntegrationRow[] }>("admin-integrations", {
        action: "list",
      }),
    staleTime: 10_000,
  });

  const list = data?.integrations ?? [];
  const saleWebhook = list.find((i) => i.type === "sale_webhook");
  const whatsapp = list.find((i) => i.type === "whatsapp_evolution");
  const email = list.find((i) => i.type === "email_resend");
  const shopify = list.find((i) => i.type === "shopify");
  const bling = list.find((i) => i.type === "bling");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Integrações</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure webhooks, WhatsApp, email e plataformas externas (Shopify, Bling).
        </p>
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </>
      ) : (
        <>
          <SaleWebhookCard integration={saleWebhook} onSaved={refetch} />
          <ShopifyCard integration={shopify} onSaved={refetch} />
          <BlingCard integration={bling} onSaved={refetch} />
          <WhatsappCard integration={whatsapp} onSaved={refetch} />
          <EmailCard integration={email} onSaved={refetch} />
        </>
      )}
    </div>
  );
}
