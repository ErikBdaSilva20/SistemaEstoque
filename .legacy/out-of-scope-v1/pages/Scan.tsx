import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  Hand,
  PackageSearch,
  Plus,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { BarcodeScanner } from "@/components/scan/BarcodeScanner";
import { MovementFormDialog } from "@/components/stock/MovementFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductByBarcode, PRODUCTS_QUERY_KEY } from "@/hooks/useProducts";
import { formatBRL, formatNumber } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { MOVEMENTS_QUERY_KEY } from "@/hooks/useMovements";
import { mapSupabaseError } from "@/lib/errors";

type Mode = "manual" | "rapid_out" | "rapid_in";

interface HistoryEntry {
  timestamp: number;
  code: string;
  productId: string | null;
  productName: string;
  productUnit: string;
  type: "out" | "in" | "not_found";
  qty: number;
}

export default function Scan() {
  const [mode, setMode] = useState<Mode>("manual");
  const [code, setCode] = useState<string | null>(null);
  const [movementOpen, setMovementOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const lastScanRef = useRef<{ code: string; ts: number }>({ code: "", ts: 0 });

  const qc = useQueryClient();
  const { data: product, isFetching } = useProductByBarcode(code ?? undefined);

  const rapidMovement = useMutation({
    mutationFn: async (params: { product_id: string; type: "out" | "in" }) => {
      const { error } = await supabase.from("stock_movements").insert({
        product_id: params.product_id,
        type: params.type,
        quantity: 1,
        origin: "manual",
        reason: `Leitura rápida (${params.type === "out" ? "saída" : "entrada"})`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
    },
  });

  // Modo rápido: dispara movimentação ao detectar produto
  useEffect(() => {
    if (mode === "manual" || !code || !product) return;
    const type = mode === "rapid_out" ? "out" : "in";
    rapidMovement.mutate(
      { product_id: product.id, type },
      {
        onSuccess: () => {
          if (navigator.vibrate) navigator.vibrate(80);
          setHistory((h): HistoryEntry[] =>
            [
              {
                timestamp: Date.now(),
                code,
                productId: product.id,
                productName: product.name,
                productUnit: product.unit,
                type: type as "in" | "out",
                qty: 1,
              },
              ...h,
            ].slice(0, 20),
          );
          toast.success(`${type === "out" ? "−" : "+"}1 ${product.unit} · ${product.name}`, {
            duration: 1500,
          });
          setCode(null);
        },
        onError: (e) => {
          toast.error(mapSupabaseError(e));
          setCode(null);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, code, product?.id]);

  // Modo rápido: produto não encontrado
  useEffect(() => {
    if (mode === "manual" || !code || isFetching) return;
    if (!product) {
      setHistory((h) =>
        [
          {
            timestamp: Date.now(),
            code,
            productId: null,
            productName: "(não cadastrado)",
            productUnit: "",
            type: "not_found" as const,
            qty: 0,
          },
          ...h,
        ].slice(0, 20),
      );
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      toast.error(`Código ${code} não encontrado`, { duration: 2000 });
      setCode(null);
    }
  }, [mode, code, isFetching, product]);

  const handleDetected = (value: string) => {
    // dedup: ignora mesma leitura < 1.2s
    const now = Date.now();
    if (lastScanRef.current.code === value && now - lastScanRef.current.ts < 1200) {
      return;
    }
    lastScanRef.current = { code: value, ts: now };

    if (value === code) return;
    setCode(value);
    if (mode === "manual") {
      if (navigator.vibrate) navigator.vibrate(120);
      toast.success(`Código lido: ${value}`, { duration: 1200 });
    }
  };

  const MODE_META: Record<
    Mode,
    { label: string; description: string; icon: typeof Hand; tone: string }
  > = {
    manual: {
      label: "Manual",
      description: "Abre formulário para confirmar cada movimentação",
      icon: Hand,
      tone: "text-muted-foreground",
    },
    rapid_out: {
      label: "Saída rápida",
      description: "Cada leitura = −1 automático (sem confirmação)",
      icon: ArrowUpCircle,
      tone: "text-destructive",
    },
    rapid_in: {
      label: "Entrada rápida",
      description: "Cada leitura = +1 automático (sem confirmação)",
      icon: ArrowDownCircle,
      tone: "text-accent-success",
    },
  };

  const currentMeta = MODE_META[mode];
  const ModeIcon = currentMeta.icon;

  return (
    <div className="mx-auto w-full max-w-content p-4 sm:p-6 lg:p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Escanear código de barras
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a câmera do celular. Instale como app para melhor experiência.
          </p>
        </div>
        <div className="min-w-[220px]">
          <label className="text-xs font-medium text-muted-foreground">Modo</label>
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  <Hand className="h-3 w-3" />
                  Manual (confirma cada)
                </div>
              </SelectItem>
              <SelectItem value="rapid_out">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-3 w-3 text-destructive" />
                  Saída rápida (−1)
                </div>
              </SelectItem>
              <SelectItem value="rapid_in">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-3 w-3 text-accent-success" />
                  Entrada rápida (+1)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 rounded-md bg-bg-base/40 p-3 text-xs">
        <ModeIcon className={`h-4 w-4 ${currentMeta.tone}`} />
        <span className="font-medium">{currentMeta.label}</span>
        <span className="text-muted-foreground">· {currentMeta.description}</span>
        {mode !== "manual" && <Zap className="ml-auto h-3 w-3 text-warning" />}
      </div>

      <BarcodeScanner onDetected={handleDetected} />

      {mode !== "manual" && history.length > 0 && (
        <Card className="mt-4 rounded-2xl">
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Sessão atual</h3>
              <Badge variant="secondary">
                {history.filter((h) => h.type !== "not_found").length} movimentações
              </Badge>
            </div>
            <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
              {history.map((h, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  {h.type === "out" && (
                    <ArrowUpCircle className="h-4 w-4 shrink-0 text-destructive" />
                  )}
                  {h.type === "in" && (
                    <ArrowDownCircle className="h-4 w-4 shrink-0 text-accent-success" />
                  )}
                  {h.type === "not_found" && (
                    <PackageSearch className="h-4 w-4 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{h.productName}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{h.code}</div>
                  </div>
                  {h.type !== "not_found" && (
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        h.type === "out" ? "text-destructive" : "text-accent-success"
                      }`}
                    >
                      {h.type === "out" ? "−" : "+"}
                      {h.qty} {h.productUnit}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {new Date(h.timestamp).toLocaleTimeString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {mode === "manual" && (
        <div className="mt-4">
          {!code && (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <PackageSearch className="h-8 w-8 opacity-40" />
                Aguardando leitura...
              </CardContent>
            </Card>
          )}

          {code && isFetching && (
            <Card className="rounded-2xl">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Buscando produto...
              </CardContent>
            </Card>
          )}

          {code && !isFetching && !product && (
            <Card className="rounded-2xl border-warning/40 bg-warning/5">
              <CardContent className="space-y-3 py-6 text-center">
                <div className="flex items-center justify-center gap-2 text-warning">
                  <PackageSearch className="h-5 w-5" />
                  <span className="font-medium">Produto não cadastrado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum produto ativo com o código <span className="font-mono">{code}</span>.
                </p>
                <Button asChild variant="outline">
                  <Link to="/products">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar produto
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {product && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{product.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {product.sku}
                      {product.barcode ? ` · ${product.barcode}` : ""}
                    </div>
                    {product.category && (
                      <Badge variant="outline" className="mt-1">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold tabular-nums ${
                        Number(product.current_stock) < Number(product.min_stock)
                          ? "text-warning"
                          : ""
                      }`}
                    >
                      {formatNumber(product.current_stock)}
                    </div>
                    <div className="text-xs text-muted-foreground">{product.unit} em estoque</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <InfoStat
                    label="Estoque mínimo"
                    value={`${formatNumber(product.min_stock)} ${product.unit}`}
                  />
                  <InfoStat label="Preço" value={formatBRL(Number(product.price))} />
                  <InfoStat label="Custo" value={formatBRL(Number(product.cost))} />
                  <InfoStat label="Fornecedor" value={product.supplier?.name ?? "—"} />
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button onClick={() => setMovementOpen(true)} className="flex-1 min-w-[140px]">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Dar baixa / entrada
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/products">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir em produtos
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {product && (
        <MovementFormDialog
          open={movementOpen}
          onOpenChange={setMovementOpen}
          defaultProductId={product.id}
        />
      )}
    </div>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
