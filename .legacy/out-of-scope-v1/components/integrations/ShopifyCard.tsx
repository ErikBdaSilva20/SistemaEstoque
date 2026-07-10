import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCcw, ShoppingBag, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invokeEdge } from "@/lib/edge-fn";
import { mapSupabaseError } from "@/lib/errors";

interface IntegrationRow {
  id: string;
  type: string;
  is_active: boolean;
  config: unknown;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_test_message: string | null;
  updated_at: string;
}

interface Props {
  integration?: IntegrationRow;
  onSaved: () => void;
}

interface Config {
  shop_domain?: string;
  location_id?: string | null;
  push_inventory?: boolean;
}

export function ShopifyCard({ integration, onSaved }: Props) {
  const cfg = (integration?.config as Config | undefined) ?? {};

  const [isActive, setIsActive] = useState(integration?.is_active ?? true);
  const [shopDomain, setShopDomain] = useState(cfg.shop_domain ?? "");
  const [locationId, setLocationId] = useState(cfg.location_id ?? "");
  const [pushInventory, setPushInventory] = useState(cfg.push_inventory ?? true);
  const [accessToken, setAccessToken] = useState("");
  const [syncMode, setSyncMode] = useState<"match_only" | "create_new">("match_only");

  const save = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "upsert",
        type: "shopify",
        is_active: isActive,
        shop_domain: shopDomain.trim(),
        location_id: locationId.trim() || null,
        push_inventory: pushInventory,
        access_token: accessToken.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Shopify configurado.");
      setAccessToken("");
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const sync = useMutation({
    mutationFn: async () =>
      invokeEdge<{
        remote_count: number;
        matched: number;
        created: number;
        unmatched: number;
      }>("admin-integrations", {
        action: "sync_catalog",
        platform: "shopify",
        mode: syncMode,
      }),
    onSuccess: (r) => {
      toast.success(
        `${r.matched} mapeados, ${r.created} criados, ${r.unmatched} sem correspondência (de ${r.remote_count}).`,
      );
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const remove = useMutation({
    mutationFn: async () =>
      invokeEdge<{ success: boolean }>("admin-integrations", {
        action: "delete",
        type: "shopify",
      }),
    onSuccess: () => {
      toast.success("Shopify removido.");
      onSaved();
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  return (
    <Card className="rounded-2xl shadow-elevation-1">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingBag className="h-4 w-4 text-accent-success" />
            Shopify
            {integration && (
              <Badge variant="secondary" className="ml-1">
                {integration.is_active ? "Ativo" : "Desativado"}
              </Badge>
            )}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Sincroniza catálogo por SKU. Vendas caem por webhook (use o endpoint "Sales Webhook" com
            o secret Shopify).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Label className="text-sm">Ativo</Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Shop domain</Label>
            <Input
              placeholder="minha-loja.myshopify.com"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Location ID (opcional)</Label>
            <Input
              placeholder="Ex: 12345678"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="mt-1 font-mono text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Admin API access token</Label>
          <Input
            type="password"
            placeholder={integration ? "•••••••• (deixe vazio para manter)" : "shpat_..."}
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="mt-1 font-mono text-sm"
            autoComplete="new-password"
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={pushInventory}
            onChange={(e) => setPushInventory(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            <span className="font-medium">Empurrar estoque para o Shopify</span>
            <span className="block text-xs text-muted-foreground">
              Quando o estoque local mudar, atualiza a quantidade no Shopify.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {integration ? "Salvar alterações" : "Conectar Shopify"}
          </Button>
          {integration && (
            <>
              <div className="ml-auto flex items-center gap-2">
                <Select
                  value={syncMode}
                  onValueChange={(v) => setSyncMode(v as "match_only" | "create_new")}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match_only">Só mapear (não cria produtos)</SelectItem>
                    <SelectItem value="create_new">Criar produtos que faltam</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending}>
                  <RefreshCcw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
                  {sync.isPending ? "Sincronizando..." : "Sincronizar catálogo"}
                </Button>
              </div>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remover
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
