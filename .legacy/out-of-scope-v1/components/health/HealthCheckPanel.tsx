import { useCallback, useState } from "react";
import { CheckCircle2, Loader2, MinusCircle, Play, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdge } from "@/lib/edge-fn";
import { useStore } from "@/hooks/useStore";

type Status = "idle" | "running" | "ok" | "fail" | "skipped";

interface CheckResult {
  name: string;
  group: string;
  status: Status;
  detail?: string;
  error?: string;
  elapsedMs?: number;
}

const TABLES = [
  "profiles",
  "user_roles",
  "project_config",
  "api_keys",
  "integrations",
  "suppliers",
  "products",
  "stock_movements",
  "purchase_orders",
  "purchase_order_items",
  "webhook_events",
  "ai_audit_log",
  "notification_log",
  "locations",
  "product_batches",
  "stock_by_location",
  "count_sessions",
  "count_items",
  "external_product_mappings",
] as const;

async function runCheck(
  name: string,
  group: string,
  fn: () => Promise<string | "skipped" | void>,
): Promise<CheckResult> {
  const started = Date.now();
  try {
    const r = await fn();
    const elapsed = Date.now() - started;
    if (r === "skipped") return { name, group, status: "skipped", elapsedMs: elapsed };
    return {
      name,
      group,
      status: "ok",
      detail: typeof r === "string" ? r : undefined,
      elapsedMs: elapsed,
    };
  } catch (e) {
    return {
      name,
      group,
      status: "fail",
      error: (e as Error).message,
      elapsedMs: Date.now() - started,
    };
  }
}

export function HealthCheckPanel() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);
  const { insertStoreId } = useStore();

  const runAll = useCallback(async () => {
    setRunning(true);
    const out: CheckResult[] = [];
    const push = (r: CheckResult) => {
      out.push(r);
      setResults([...out]);
    };

    // Auth
    const sess = await supabase.auth.getSession();
    const userId = sess.data.session?.user.id;
    push(
      await runCheck("Sessão válida", "auth", async () => {
        if (!userId) throw new Error("Sem sessão");
        return `user_id=${userId.slice(0, 8)}...`;
      }),
    );

    push(
      await runCheck("Profile + aprovação", "auth", async () => {
        if (!userId) throw new Error("Sem sessão");
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, is_active")
          .eq("id", userId)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) throw new Error("profile ausente");
        if (!data.is_active) throw new Error("usuário inativo");
        return data.full_name;
      }),
    );

    // Schema
    for (const t of TABLES) {
      push(
        await runCheck(t, "schema", async () => {
          const { error, count } = await supabase
            .from(t)
            .select("*", { count: "exact", head: true });
          if (error) throw new Error(`${error.code ?? ""} ${error.message}`);
          return `${count ?? 0} linhas`;
        }),
      );
    }

    push(
      await runCheck("VIEW v_expiring_batches", "schema", async () => {
        const { error } = await supabase.from("v_expiring_batches").select("batch_id").limit(1);
        if (error) throw new Error(error.message);
      }),
    );

    // RPC
    push(
      await runCheck("RPC next_purchase_order_code", "rpc", async () => {
        const { data, error } = await supabase.rpc("next_purchase_order_code");
        if (error) throw new Error(error.message);
        if (!String(data).startsWith("PO-")) throw new Error(`retorno inesperado: ${data}`);
        return String(data);
      }),
    );

    push(
      await runCheck("RPC has_role(admin)", "rpc", async () => {
        if (!userId) return "skipped";
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: userId,
          _role: "admin",
        });
        if (error) throw new Error(error.message);
        return String(data);
      }),
    );

    // CRUD
    let supplierId: string | null = null;
    let productId: string | null = null;
    const ts = Date.now();

    push(
      await runCheck("INSERT suppliers", "crud", async () => {
        if (!insertStoreId) throw new Error("sem PDV ativo");
        const { data, error } = await supabase
          .from("suppliers")
          .insert({ name: `HealthTest ${ts}`, lead_time_days: 5, store_id: insertStoreId })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        supplierId = data.id;
      }),
    );

    push(
      await runCheck("INSERT products", "crud", async () => {
        if (!supplierId) throw new Error("sem supplier");
        if (!insertStoreId) throw new Error("sem PDV ativo");
        const { data, error } = await supabase
          .from("products")
          .insert({
            sku: `HTEST-${ts}`,
            name: "Health Test Product",
            unit: "un",
            cost: 10,
            price: 20,
            min_stock: 5,
            supplier_id: supplierId,
            store_id: insertStoreId,
          })
          .select("id, current_stock")
          .single();
        if (error) throw new Error(error.message);
        productId = data.id;
        if (Number(data.current_stock) !== 0) throw new Error("current_stock inicial != 0");
      }),
    );

    push(
      await runCheck("Trigger recalc_stock_on_movement", "crud", async () => {
        if (!productId) throw new Error("sem product");
        const { error } = await supabase.from("stock_movements").insert({
          product_id: productId,
          type: "in",
          quantity: 10,
          origin: "manual",
          reason: "Health test",
        });
        if (error) throw new Error(error.message);
        const { data } = await supabase
          .from("products")
          .select("current_stock")
          .eq("id", productId)
          .single();
        if (Number(data?.current_stock ?? 0) !== 10)
          throw new Error(`estoque=${data?.current_stock} (esperado 10)`);
        return "estoque=10 ✓";
      }),
    );

    push(
      await runCheck("Cleanup", "crud", async () => {
        if (productId) {
          await supabase.from("stock_movements").delete().eq("product_id", productId);
          await supabase.from("stock_by_location").delete().eq("product_id", productId);
          await supabase.from("products").delete().eq("id", productId);
        }
        if (supplierId) await supabase.from("suppliers").delete().eq("id", supplierId);
      }),
    );

    // Edge functions
    push(
      await runCheck("admin-audit", "edge", async () => {
        const r = await invokeEdge<{ rows: unknown[] }>("admin-audit", {
          action: "list",
          kind: "ai",
          limit: 1,
        });
        if (!Array.isArray(r.rows)) throw new Error("rows não é array");
        return `${r.rows.length} registros`;
      }),
    );

    push(
      await runCheck("admin-integrations", "edge", async () => {
        const r = await invokeEdge<{ integrations: unknown[] }>("admin-integrations", {
          action: "list",
        });
        if (!Array.isArray(r.integrations)) throw new Error("integrations não é array");
        return `${r.integrations.length} configuradas`;
      }),
    );

    push(
      await runCheck("admin-api-keys", "edge", async () => {
        const r = await invokeEdge<{
          keys: Array<{ provider: string; is_valid: boolean }>;
        }>("admin-api-keys", { action: "list" });
        if (!Array.isArray(r.keys)) throw new Error("keys não é array");
        const s = r.keys.map((k) => `${k.provider}:${k.is_valid ? "ok" : "invalid"}`).join(", ");
        return s || "nenhuma chave";
      }),
    );

    // Anthropic-dependent (só roda se houver chave)
    const { data: anthropicKey } = await supabase
      .from("api_keys")
      .select("is_valid")
      .eq("provider", "anthropic")
      .maybeSingle();
    const hasAnthropic = !!anthropicKey && (anthropicKey as { is_valid: boolean }).is_valid;

    push(
      await runCheck("ai-chat (se Anthropic ok)", "edge", async () => {
        if (!hasAnthropic) return "skipped";
        const r = await invokeEdge<{ reply: string; tools_used: number }>("ai-chat", {
          messages: [{ role: "user", content: "Qual o valor total do meu estoque?" }],
        });
        if (typeof r.reply !== "string" || r.reply.length < 5) throw new Error("reply inválido");
        return `${r.tools_used} tools usadas`;
      }),
    );

    push(
      await runCheck("ai-suggest-reorder (se Anthropic ok)", "edge", async () => {
        if (!hasAnthropic) return "skipped";
        const r = await invokeEdge<{
          summary: string;
          suggestions: unknown[];
        }>("ai-suggest-reorder");
        if (typeof r.summary !== "string") throw new Error("summary inválido");
        return `${r.suggestions?.length ?? 0} sugestões`;
      }),
    );

    setRunning(false);
  }, []);

  const stats = {
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    fail: results.filter((r) => r.status === "fail").length,
    skipped: results.filter((r) => r.status === "skipped").length,
  };

  // Agrupa por group
  const groups = results.reduce(
    (acc, r) => {
      if (!acc[r.group]) acc[r.group] = [];
      acc[r.group].push(r);
      return acc;
    },
    {} as Record<string, CheckResult[]>,
  );

  const GROUP_LABELS: Record<string, string> = {
    auth: "Autenticação",
    schema: "Schema (tabelas)",
    rpc: "RPC (Postgres functions)",
    crud: "CRUD + Triggers",
    edge: "Edge Functions",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Health check</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Valida migrations, CRUDs, edge functions e integrações em tempo real. Rode após aplicar
            as migrations ou quando algo estiver estranho.
          </p>
        </div>
        <Button onClick={runAll} disabled={running}>
          {running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Rodando...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Rodar todos
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-accent-success/15 text-accent-success">
            {stats.ok} OK
          </Badge>
          {stats.fail > 0 && (
            <Badge variant="secondary" className="bg-destructive/15 text-destructive">
              {stats.fail} falharam
            </Badge>
          )}
          {stats.skipped > 0 && (
            <Badge variant="secondary" className="bg-warning/15 text-warning">
              {stats.skipped} skipped
            </Badge>
          )}
          <Badge variant="outline">{stats.total} testes</Badge>
        </div>
      )}

      {Object.entries(groups).map(([group, items]) => (
        <Card key={group} className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {GROUP_LABELS[group] ?? group}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {items.map((r, i) => (
                <li key={i} className="flex items-start gap-3 py-2">
                  {r.status === "ok" && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-success" />
                  )}
                  {r.status === "fail" && (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  {r.status === "skipped" && (
                    <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={r.status === "fail" ? "font-medium text-destructive" : ""}>
                        {r.name}
                      </span>
                      {r.elapsedMs !== undefined && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {r.elapsedMs}ms
                        </span>
                      )}
                    </div>
                    {r.detail && <div className="text-xs text-muted-foreground">{r.detail}</div>}
                    {r.error && <div className="font-mono text-xs text-destructive">{r.error}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {results.length === 0 && !running && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Clique em "Rodar todos" para validar o sistema.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
