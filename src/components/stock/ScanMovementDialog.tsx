import { useCallback, useRef, useState } from "react";
import { PackageSearch } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "@/components/scan/BarcodeScanner";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { useProducts, type Product } from "@/hooks/useProducts";
import { MovementFormDialog } from "./MovementFormDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Scans a barcode with the device camera and matches it against products
// already registered (`barcode` or, as a fallback, `sku` -- our own printed
// labels fall back to the SKU when a product has no real barcode set).
// - Match found -> hands off to MovementFormDialog pre-filled with that product.
// - No match -> offers to register a new product with that code as barcode,
//   then continues straight into the movement form for it.
export function ScanMovementDialog({ open, onOpenChange }: Props) {
  const { data: products = [] } = useProducts();
  const [matchedProductId, setMatchedProductId] = useState<string | null>(null);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const lastMissRef = useRef<string | null>(null);
  const justCreatedIdRef = useRef<string | null>(null);

  const resetFlow = () => {
    setMatchedProductId(null);
    setNotFoundCode(null);
    setRegistering(false);
    lastMissRef.current = null;
    justCreatedIdRef.current = null;
  };

  const handleDetected = useCallback(
    (code: string) => {
      const trimmed = code.trim();
      if (!trimmed || trimmed === lastMissRef.current) return;

      const product = products.find((p) => p.barcode === trimmed || p.sku === trimmed);
      if (!product) {
        lastMissRef.current = trimmed;
        setNotFoundCode(trimmed);
        return;
      }
      setMatchedProductId(product.id);
    },
    [products],
  );

  const handleClose = (next: boolean) => {
    if (!next) resetFlow();
    onOpenChange(next);
  };

  const handleRetry = () => {
    lastMissRef.current = null;
    setNotFoundCode(null);
  };

  const handleProductCreated = (product: Product) => {
    // Stashed in a ref (not state) so it survives the same-tick close that
    // follows creation without racing a stale "phase" read on that close.
    justCreatedIdRef.current = product.id;
  };

  const handleRegisterOpenChange = (next: boolean) => {
    if (next) return;
    if (justCreatedIdRef.current) {
      setMatchedProductId(justCreatedIdRef.current);
      setRegistering(false);
      setNotFoundCode(null);
      justCreatedIdRef.current = null;
    } else {
      setRegistering(false);
      handleRetry();
    }
  };

  if (matchedProductId) {
    return (
      <MovementFormDialog
        open={open}
        onOpenChange={handleClose}
        defaultProductId={matchedProductId}
      />
    );
  }

  if (registering) {
    return (
      <ProductFormDialog
        open={open}
        onOpenChange={handleRegisterOpenChange}
        initialBarcode={notFoundCode ?? undefined}
        onCreated={handleProductCreated}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Escanear código de barras</DialogTitle>
        </DialogHeader>
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
              <Button variant="outline" onClick={handleRetry}>
                Tentar novamente
              </Button>
              <Button onClick={() => setRegistering(true)}>Cadastrar produto</Button>
            </div>
          </div>
        ) : (
          <BarcodeScanner onDetected={handleDetected} />
        )}
      </DialogContent>
    </Dialog>
  );
}
