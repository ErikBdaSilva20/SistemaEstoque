import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProducts } from "@/hooks/useProducts";
import { useCountSessionMutations } from "@/hooks/useCountSessions";
import { mapGatewayError } from "@/lib/errors";
import { formatNumber } from "@/lib/formatters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  /** IDs de produtos já presentes na sessão (filtrados na busca) */
  existingProductIds: string[];
}

export function AddCountItemDialog({ open, onOpenChange, sessionId, existingProductIds }: Props) {
  const { data: products = [], isLoading } = useProducts({ includeInactive: false });
  const { addItem } = useCountSessionMutations();
  const [search, setSearch] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const existingSet = useMemo(() => new Set(existingProductIds), [existingProductIds]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const list = products.filter((p) => !existingSet.has(p.id));
    if (!s) return list.slice(0, 50);
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.sku.toLowerCase().includes(s) ||
          (p.barcode ?? "").toLowerCase().includes(s),
      )
      .slice(0, 50);
  }, [products, search, existingSet]);

  const handleAdd = async (productId: string) => {
    setPendingId(productId);
    try {
      await addItem.mutateAsync({ sessionId, productId });
      toast.success("Produto adicionado à contagem.");
      setSearch("");
    } catch (e) {
      toast.error(mapGatewayError(e));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar produto à contagem</DialogTitle>
          <DialogDescription>
            Busque pelo nome, SKU ou código de barras. A quantidade do sistema é capturada no
            momento da inclusão.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            className="pl-9"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-80 rounded-md border border-border">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {search.trim()
                ? "Nenhum produto encontrado."
                : "Comece digitando para buscar produtos."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {p.sku}
                      {p.barcode ? ` · ${p.barcode}` : ""} · estoque {formatNumber(p.current_stock)}{" "}
                      {p.unit}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdd(p.id)}
                    disabled={pendingId === p.id || addItem.isPending}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {pendingId === p.id ? "..." : "Adicionar"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
