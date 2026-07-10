import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useForecast, type Granularity } from "@/hooks/useForecast";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
];

export default function Forecast() {
  const { data: products = [], isLoading: loadingProducts } = useProducts({
    includeInactive: false,
  });
  const [productId, setProductId] = useState<string>("");
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [pickerOpen, setPickerOpen] = useState(false);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const currentStock = product ? Number(product.current_stock) : null;

  const { data, isLoading, isFetching } = useForecast(
    productId || undefined,
    granularity,
    currentStock,
  );

  const chartData = useMemo(() => {
    if (!data) return [];
    const hist = data.history.map((h) => ({
      label: h.label,
      actual: Math.round(h.actual * 100) / 100,
    }));
    const fc = data.forecast.map((f) => ({
      label: f.label,
      forecast: Math.round(f.forecast * 100) / 100,
      range: [Math.round(f.lower * 100) / 100, Math.round(f.upper * 100) / 100] as [number, number],
    }));
    return [...hist, ...fc];
  }, [data]);

  const trendLabel = useMemo(() => {
    if (!data) return null;
    const slope = data.stats.trendPerPeriod;
    if (Math.abs(slope) < 0.01)
      return { label: "estável", className: "bg-muted text-muted-foreground" };
    if (slope > 0)
      return {
        label: `crescendo +${formatNumber(slope)}/período`,
        className: "bg-warning/15 text-warning",
      };
    return {
      label: `caindo ${formatNumber(slope)}/período`,
      className: "bg-accent-success/15 text-accent-success",
    };
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-content p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Previsibilidade de consumo</h1>
          <p className="text-sm text-muted-foreground">
            Projeção estatística (média móvel + tendência linear) sobre histórico real de saídas.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <LineChartIcon className="h-3.5 w-3.5" />
          Estimativa — não é receita fechada
        </Badge>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_220px]">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
            Produto
          </label>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={loadingProducts}
                className={cn(
                  "w-full justify-between font-normal",
                  !product && "text-muted-foreground",
                )}
              >
                {product ? `${product.name} (${product.sku})` : "Selecione um produto"}
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar produto..." />
                <CommandList>
                  <CommandEmpty>Nenhum produto.</CommandEmpty>
                  <CommandGroup>
                    {products.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`${p.name} ${p.sku} ${p.barcode ?? ""}`}
                        onSelect={() => {
                          setProductId(p.id);
                          setPickerOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            p.id === productId ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.sku} · estoque {formatNumber(p.current_stock)} {p.unit}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-muted-foreground">
            Granularidade
          </label>
          <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GRANULARITIES.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!productId ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Selecione um produto para ver a previsão.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-[420px] w-full" />
      ) : data ? (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-4">
            <StatCard
              label="Consumo médio por período"
              value={`${formatNumber(data.stats.mean)} ${product?.unit ?? ""}`}
              hint={`±${formatNumber(data.stats.stdDev)} desvio`}
            />
            <StatCard
              label="Último período"
              value={`${formatNumber(data.stats.lastPeriod)} ${product?.unit ?? ""}`}
              hint={
                trendLabel ? (
                  <Badge variant="secondary" className={cn("gap-1", trendLabel.className)}>
                    {data.stats.trendPerPeriod > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {trendLabel.label}
                  </Badge>
                ) : null
              }
            />
            <StatCard
              label="Projeção próximos períodos"
              value={`${formatNumber(data.stats.totalForecast)} ${product?.unit ?? ""}`}
              hint={`${data.forecast.length} períodos à frente`}
            />
            <StatCard
              label="Cobertura atual"
              value={
                data.stats.coverageDays != null
                  ? `${formatNumber(data.stats.coverageDays)} dias`
                  : "—"
              }
              hint={
                currentStock != null
                  ? `${formatNumber(currentStock)} ${product?.unit ?? ""} em estoque`
                  : undefined
              }
              critical={data.stats.coverageDays != null && data.stats.coverageDays < 7}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Histórico &amp; projeção</CardTitle>
              {isFetching && <span className="text-xs text-muted-foreground">atualizando…</span>}
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: unknown, name) => {
                        if (Array.isArray(value)) {
                          return [`${formatNumber(value[0])} - ${formatNumber(value[1])}`, name];
                        }
                        return [formatNumber(Number(value)), name];
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="range"
                      name="Faixa (80% confiança)"
                      stroke="none"
                      fill="hsl(var(--accent-primary))"
                      fillOpacity={0.12}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Histórico real"
                      stroke="hsl(var(--accent-primary))"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Projeção"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {data.history.filter((h) => h.actual > 0).length < 3 && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm">
              <AlertCircle className="h-4 w-4 text-warning" />
              <p className="text-text-primary">
                Histórico curto: só {data.history.filter((h) => h.actual > 0).length} período(s) com
                movimentação. Projeção fica menos confiável.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  critical,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  critical?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4",
        critical && "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div
        className={cn("mt-1 text-xl font-semibold tabular-nums", critical && "text-destructive")}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
