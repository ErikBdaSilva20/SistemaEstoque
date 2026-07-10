import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Info, Loader2, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { domainSchema } from "@/lib/validations";
import { mapSupabaseError } from "@/lib/errors";

const CONFIG_KEYS = ["restrict_signup_by_domain", "allowed_email_domains"] as const;

type ConfigKey = (typeof CONFIG_KEYS)[number];
type ConfigMap = Record<ConfigKey, string>;

const CONFIG_QUERY_KEY = ["project-config"] as const;

async function fetchConfig(): Promise<ConfigMap> {
  const { data, error } = await supabase
    .from("project_config")
    .select("key,value")
    .in("key", CONFIG_KEYS as unknown as string[]);
  if (error) throw error;
  const map = {} as ConfigMap;
  CONFIG_KEYS.forEach((k) => (map[k] = ""));
  (data ?? []).forEach((r) => {
    map[r.key as ConfigKey] = r.value;
  });
  return map;
}

export function SecuritySettings() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: fetchConfig,
  });
  const [domainInput, setDomainInput] = useState("");

  const update = useMutation({
    mutationFn: async ({ key, value }: { key: ConfigKey; value: string }) => {
      const { error } = await supabase.from("project_config").update({ value }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONFIG_QUERY_KEY }),
  });

  if (isLoading || !config) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const restrictDomain = config.restrict_signup_by_domain === "true";
  const domains = config.allowed_email_domains
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  const setBool = (key: ConfigKey, value: boolean) => {
    update.mutate(
      { key, value: value ? "true" : "false" },
      {
        onSuccess: () => toast.success("Configuração atualizada."),
        onError: (e) => toast.error(mapSupabaseError(e)),
      },
    );
  };

  const addDomain = () => {
    const parsed = domainSchema.safeParse(domainInput);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Domínio inválido");
      return;
    }
    if (domains.includes(parsed.data)) {
      toast.error("Domínio já adicionado.");
      return;
    }
    const next = [...domains, parsed.data].join(",");
    update.mutate(
      { key: "allowed_email_domains", value: next },
      {
        onSuccess: () => {
          setDomainInput("");
          toast.success("Domínio adicionado.");
        },
        onError: (e) => toast.error(mapSupabaseError(e)),
      },
    );
  };

  const removeDomain = (d: string) => {
    const next = domains.filter((x) => x !== d).join(",");
    update.mutate(
      { key: "allowed_email_domains", value: next },
      {
        onSuccess: () => toast.success("Domínio removido."),
        onError: (e) => toast.error(mapSupabaseError(e)),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Restrição de domínio */}
      <Card className="rounded-2xl shadow-elevation-1">
        <CardHeader>
          <CardTitle className="text-lg">Restrição por domínio de email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="restrict-domain" className="text-base font-medium">
                Restringir cadastro por domínio de email
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Quando ativo, apenas emails dos domínios listados abaixo poderão se cadastrar.
              </p>
            </div>
            <Switch
              id="restrict-domain"
              checked={restrictDomain}
              onCheckedChange={(v) => setBool("restrict_signup_by_domain", v)}
              disabled={update.isPending}
            />
          </div>

          {restrictDomain && (
            <>
              <div className="space-y-2">
                <Label>Adicionar domínio</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="empresa.com.br"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDomain();
                      }
                    }}
                    disabled={update.isPending}
                  />
                  <Button
                    type="button"
                    onClick={addDomain}
                    disabled={update.isPending || !domainInput}
                  >
                    {update.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Adicionar
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Domínios permitidos</Label>
                {domains.length === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      Nenhum domínio configurado. Nenhum novo cadastro será permitido.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {domains.map((d) => (
                      <Badge key={d} variant="secondary" className="gap-1 px-3 py-1">
                        {d}
                        <button
                          type="button"
                          onClick={() => removeDomain(d)}
                          className="ml-1 rounded-full hover:bg-foreground/10"
                          aria-label={`Remover ${d}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  O primeiro usuário (administrador) sempre pode se cadastrar independente do
                  domínio.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
