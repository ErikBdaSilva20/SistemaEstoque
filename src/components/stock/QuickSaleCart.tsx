import { useMemo, useRef, useState } from "react";
import { Camera, PackageSearch, ScanLine, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { BarcodeScanner } from "@/components/scan/BarcodeScanner";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import { useMovementMutations } from "@/hooks/useMovements";
import { formatBRL, formatNumber } from "@/lib/formatters";
import { toastSuccess, toastError } from "@/lib/toast";

interface CartLine {
  product: Product;
  quantity: number;
}

// Counter checkout: a USB/Bluetooth barcode reader in "keyboard mode" types the
// scanned code into whatever input is focused and finishes with Enter -- so all
// this needs is a text input that's always focused, no camera involved (that's
// ScanMovementDialog's job for the single-item stock-movement flow).
export function QuickSaleCart() {
  const { data: products = [] } = useProducts();
  const { data: locations = [] } = useLocations();
  const { create } = useMovementMutations();

  const [lines, setLines] = useState<CartLine[]>([]);
  const [scanValue, setScanValue] = useState("");
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const total = useMemo(
    () => lines.reduce((acc, l) => acc + l.quantity * Number(l.product.sale_price), 0),
    [lines],
  );

  const addProductToCart = (product: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const focusScanInput = () => {
    requestAnimationFrame(() => scanInputRef.current?.focus());
  };

  const handleScanSubmit = () => {
    const code = scanValue.trim();
    setScanValue("");
    if (!code) return;

    const product = products.find((p) => p.barcode === code || p.sku === code);
    if (!product) {
      setNotFoundCode(code);
      return;
    }
    addProductToCart(product);
  };

  const handleRetryScan = () => {
    setNotFoundCode(null);
    focusScanInput();
  };

  const handleCameraDetected = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setCameraOpen(false);

    const product = products.find((p) => p.barcode === trimmed || p.sku === trimmed);
    if (!product) {
      setNotFoundCode(trimmed);
      return;
    }
    addProductToCart(product);
    focusScanInput();
  };

  const handleProductCreated = (product: Product) => {
    addProductToCart(product);
    setRegistering(false);
    setNotFoundCode(null);
    focusScanInput();
  };

  const handleRegisterOpenChange = (next: boolean) => {
    if (!next) {
      setRegistering(false);
      focusScanInput();
    }
  };

  const setLineQuantity = (productId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) => (l.product.id === productId ? { ...l, quantity: Math.max(1, quantity) } : l)),
    );
  };

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const handleFinalize = async () => {
    if (lines.length === 0) return;
    const defaultLocation = locations.find((l) => l.is_default) ?? locations[0] ?? null;

    setFinalizing(true);
    try {
      for (const line of lines) {
        await create.mutateAsync({
          product_id: line.product.id,
          product_name: line.product.name,
          type: "out",
          quantity: line.quantity,
          origin: "sale",
          location_id: defaultLocation?.id ?? null,
          destination_id: null,
          batch_id: null,
          reason_id: null,
          notes: null,
        });
      }
      toastSuccess(
        `Venda registrada: ${lines.length} ${lines.length === 1 ? "item" : "itens"}, ${formatBRL(total)}.`,
      );
      setLines([]);
      focusScanInput();
    } catch (e) {
      toastError(e);
    } finally {
      setFinalizing(false);
    }
  };

  if (registering) {
    return (
      <ProductFormDialog
        open
        onOpenChange={handleRegisterOpenChange}
        initialBarcode={notFoundCode ?? undefined}
        onCreated={handleProductCreated}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl shadow-elevation-1">
        <CardContent className="p-4">
          {notFoundCode ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <PackageSearch className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Nenhum produto encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  O código <span className="font-mono">{notFoundCode}</span> não bate com nenhum
                  produto cadastrado.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRetryScan}>
                  Tentar novamente
                </Button>
                <Button onClick={() => setRegistering(true)}>Cadastrar produto</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <ScanLine className="h-5 w-5 shrink-0 text-accent-primary" />
                <Input
                  ref={scanInputRef}
                  autoFocus
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScanSubmit();
                    }
                  }}
                  placeholder="Aponte o leitor aqui ou digite o código e pressione Enter"
                  className="text-lg"
                />
              </div>
              <Button
                type="button"
                size="lg"
                onClick={() => setCameraOpen(true)}
                className="shrink-0"
              >
                <Camera className="mr-2 h-5 w-5" />
                Escanear com a câmera
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Escanear com a câmera</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onDetected={handleCameraDetected} />
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevation-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="w-32 text-right">Quantidade</TableHead>
              <TableHead className="text-right">Preço unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={ScanLine}
                    title="Carrinho vazio"
                    description="Escaneie um produto pra começar a venda."
                  />
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line) => {
                const overStock = line.quantity > Number(line.product.current_stock);
                return (
                  <TableRow key={line.product.id}>
                    <TableCell>
                      <div className="font-medium">{line.product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {line.product.sku} · estoque {formatNumber(line.product.current_stock)}{" "}
                        {line.product.unit}
                        {overStock && (
                          <span className="ml-2 text-destructive">⚠ acima do estoque</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        step="1"
                        value={line.quantity}
                        onChange={(e) =>
                          setLineQuantity(line.product.id, Number(e.target.value) || 1)
                        }
                        className={overStock ? "border-destructive text-right" : "text-right"}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(line.product.sale_price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatBRL(line.quantity * Number(line.product.sale_price))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.product.id)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-elevation-1">
        <div>
          <div className="text-xs font-medium uppercase text-muted-foreground">Total</div>
          <div className="text-2xl font-bold tabular-nums">{formatBRL(total)}</div>
        </div>
        <Button size="lg" onClick={handleFinalize} disabled={lines.length === 0 || finalizing}>
          {finalizing ? "Finalizando..." : "Finalizar venda"}
        </Button>
      </div>
    </div>
  );
}
