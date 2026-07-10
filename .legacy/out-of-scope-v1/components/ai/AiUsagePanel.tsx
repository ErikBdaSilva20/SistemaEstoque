import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, Loader2, Save, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseError } from "@/lib/errors";

interface UsageRow {
  user_id: string;
  calls_today: number;
  input_tokens_today: number;
  output_tokens_today: number;
  total_tokens_today: number;
  full_name?: string;
  email?: string;
}

interface Config {
  limit: number;
  enabled: boolean;
}

async function fetchConfig(): Promise<Config> {
  const { data, error } = await supabase
    .from("project_config")
    .select("key, value")
    .in("key", ["ai_daily_token_limit_per_user", "ai_daily_limit_enabled"]);
  if (error) throw error;
  const byKey = Object.fromEntries((data ?? []).map((r) => [r.key, r.value] as [string, string]));
  return {
    limit: Number(byKey.ai_daily_token_limit_per_user ?? 200000) || 200000,
    enabled: (byKey.ai_daily_limit_enabled ?? "true") === "true",
  };
}

async function fetchUsage(): Promise<UsageRow[]> {
  // RPC admin-only: checa has_role('admin') no servidor e retorna já com join
  // em profiles. A view direta foi revogada pra authenticated/anon.
  const { data, error } = await supabase.rpc("admin_ai_usage_today");
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    user_id: string;
    full_name: string | null;
    email: string | null;
    calls_today: number;
    input_tokens_today: number;
    output_tokens_today: number;
    total_tokens_today: number;
  }>;
  return rows.map((r) => ({
    user_id: r.user_id,
    calls_today: Number(r.calls_today),
    input_tokens_today: Number(r.input_tokens_today),
    output_tokens_today: Number(r.output_tokens_today),
    total_tokens_today: Number(r.total_tokens_today),
    full_name: r.full_name ?? undefined,
    email: r.email ?? undefined,
  }));
}

export function AiUsagePanel() {
  const qc = useQueryClient();
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["ai-budget-config"],
    queryFn: fetchConfig,
  });
  const { data: usage = [], isLoading: loadingUsage } = useQuery({
    queryKey: ["ai-usage-today"],
    queryFn: fetchUsage,
    refetchInterval: 30_000,
  });

  const [draftLimit, setDraftLimit] = useState<string>("");
  const [draftEnabled, setDraftEnabled] = useState<boolean | null>(null);

  const effectiveLimit = draftLimit !== "" ? Number(draftLimit) : (config?.limit ?? 200000);
  const effectiveEnabled = draftEnabled ?? config?.enabled ?? true;

  const save = useMutation({
    mutationFn: async () => {
      if (!Number.isFinite(effectiveLimit) || effectiveLimit < 1000) {
        throw new Error("Limite mínimo é 1.000 tokens/dia.");
      }
      const updates = [
        supabase
          .from("project_config")
          .update({ value: String(Math.floor(effectiveLimit)) })
          .eq("key", "ai_daily_token_limit_per_user"),
        supabase
          .from("project_config")
          .update({ value: effectiveEnabled ? "true" : "false" })
          .eq("key", "ai_daily_limit_enabled"),
      ];
      const results = await Promise.all(updates);
      for (const r of results) if (r.error) throw r.error;
    },
    onSuccess: () => {
      toast.success("Configuração salva.");
      qc.invalidateQueries({ queryKey: ["ai-budget-config"] });
      setDraftLimit("");
      setDraftEnabled(null);
    },
    onError: (e) => toast.error(mapSupabaseError(e)),
  });

  const dirty = draftLimit !== "" || draftEnabled !== null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-accent-primary" />
            Budget diário de IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingConfig ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-bg-base/40 p-3">
                <div>
                  <Label className="text-sm font-medium">Aplicar limite</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando desligado, chamadas de IA não são bloqueadas por consumo (útil em
                    homologação/debug).
                  </p>
                </div>
                <Switch checked={effectiveEnabled} onCheckedChange={(v) => setDraftEnabled(v)} />
              </div>

              <div>
                <Label htmlFor="ai-limit" className="text-xs">
                  Limite diário por usuário (tokens input + output)
                </Label>
                <Input
                  id="ai-limit"
                  type="number"
                  min="1000"
                  step="1000"
                  value={draftLimit !== "" ? draftLimit : String(config?.limit ?? "")}
                  onChange={(e) => setDraftLimit(e.target.value)}
                  className="mt-1 font-mono"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Sugestão: 200.000 tokens/dia ≈ 30–50 interações típicas com Claude Haiku. Janela
                  rolante de 24h.
                </p>
              </div>

              {dirty && (
                <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
                  {save.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar configuração
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consumo nas últimas 24h</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsage ? (
            <Skeleton className="h-40 w-full" />
          ) : usage.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma chamada de IA nas últimas 24 horas.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-right">Chamadas</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">% do limite</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usage.map((u) => {
                    const pct =
                      effectiveLimit > 0 ? (u.total_tokens_today / effectiveLimit) * 100 : 0;
                    const over = effectiveEnabled && pct >= 100;
                    const near = effectiveEnabled && pct >= 80 && pct < 100;
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="font-medium">{u.full_name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {u.email ?? u.user_id.slice(0, 8)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{u.calls_today}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {u.input_tokens_today.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {u.output_tokens_today.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {u.total_tokens_today.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums ${
                            over
                              ? "text-destructive font-semibold"
                              : near
                                ? "text-warning font-medium"
                                : "text-muted-foreground"
                          }`}
                        >
                          {over && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                          {pct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
