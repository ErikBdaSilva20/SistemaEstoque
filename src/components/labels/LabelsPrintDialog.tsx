import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BarcodeSvg } from "./BarcodeSvg";
import { formatBRL } from "@/lib/formatters";

export interface LabelProduct {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  price: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: LabelProduct[];
}

type Layout = "a4-30" | "a4-24" | "a4-12" | "zebra-58x40";

const LAYOUTS: Record<
  Layout,
  {
    label: string;
    description: string;
    gridCols: number;
    gridRows: number;
    pageClass: string;
    labelClass: string;
  }
> = {
  "a4-30": {
    label: "A4 · 30 etiquetas (3×10)",
    description: "25,4mm × 19mm",
    gridCols: 3,
    gridRows: 10,
    pageClass: "print-page-a4",
    labelClass: "h-[27mm] border border-dashed border-border p-1",
  },
  "a4-24": {
    label: "A4 · 24 etiquetas (3×8)",
    description: "63,5mm × 33,9mm (Pimaco 6180)",
    gridCols: 3,
    gridRows: 8,
    pageClass: "print-page-a4",
    labelClass: "h-[33mm] border border-dashed border-border p-2",
  },
  "a4-12": {
    label: "A4 · 12 etiquetas (2×6)",
    description: "99,1mm × 42,3mm",
    gridCols: 2,
    gridRows: 6,
    pageClass: "print-page-a4",
    labelClass: "h-[42mm] border border-dashed border-border p-2",
  },
  "zebra-58x40": {
    label: "Zebra/Argox · 58×40mm (1 por página)",
    description: "Impressora térmica",
    gridCols: 1,
    gridRows: 1,
    pageClass: "print-page-58x40",
    labelClass: "h-full w-full p-1",
  },
};

export function LabelsPrintDialog({ open, onOpenChange, products }: Props) {
  const [layout, setLayout] = useState<Layout>("a4-24");
  const [copies, setCopies] = useState<number>(1);
  const [showPrice, setShowPrice] = useState(true);
  const [showSku, setShowSku] = useState(true);

  const cfg = LAYOUTS[layout];

  const expanded = useMemo(() => {
    const out: LabelProduct[] = [];
    for (const p of products) {
      for (let i = 0; i < copies; i++) out.push(p);
    }
    return out;
  }, [products, copies]);

  const pages = useMemo(() => {
    const perPage = cfg.gridCols * cfg.gridRows;
    const result: LabelProduct[][] = [];
    for (let i = 0; i < expanded.length; i += perPage) {
      result.push(expanded.slice(i, i + perPage));
    }
    return result;
  }, [expanded, cfg]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="print:hidden">
          <DialogTitle>Imprimir etiquetas</DialogTitle>
          <DialogDescription>
            {products.length} produto(s) selecionado(s) · {expanded.length} etiqueta(s) em{" "}
            {pages.length} página(s)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-4 print:hidden">
          <div>
            <Label className="text-xs">Formato</Label>
            <Select value={layout} onValueChange={(v) => setLayout(v as Layout)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LAYOUTS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[10px] text-muted-foreground">{cfg.description}</p>
          </div>
          <div>
            <Label className="text-xs">Cópias por produto</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={showSku} onCheckedChange={(v) => setShowSku(!!v)} />
              Mostrar SKU
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={showPrice} onCheckedChange={(v) => setShowPrice(!!v)} />
              Mostrar preço
            </label>
          </div>
        </div>

        <div className="print-preview max-h-[480px] overflow-auto rounded-md border border-border bg-white p-4 print:border-0 print:bg-white print:p-0 print:overflow-visible print:max-h-none">
          {pages.map((page, pi) => (
            <div
              key={pi}
              className={`${cfg.pageClass} grid bg-white`}
              style={{
                gridTemplateColumns: `repeat(${cfg.gridCols}, 1fr)`,
                gridTemplateRows: `repeat(${cfg.gridRows}, 1fr)`,
                gap: "2mm",
                marginBottom: "10mm",
                pageBreakAfter: pi < pages.length - 1 ? "always" : "auto",
              }}
            >
              {page.map((p, i) => (
                <LabelCell
                  key={`${pi}-${i}`}
                  product={p}
                  showSku={showSku}
                  showPrice={showPrice}
                  className={cfg.labelClass}
                />
              ))}
            </div>
          ))}
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handlePrint} disabled={products.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabelCell({
  product,
  showSku,
  showPrice,
  className,
}: {
  product: LabelProduct;
  showSku: boolean;
  showPrice: boolean;
  className: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-between gap-0.5 overflow-hidden bg-white text-center text-black ${className}`}
    >
      <div className="line-clamp-2 text-[9px] font-medium leading-tight">{product.name}</div>
      <div className="flex items-center justify-center">
        <BarcodeSvg
          value={product.barcode || product.sku}
          height={28}
          fontSize={9}
          displayValue={false}
          margin={0}
        />
      </div>
      <div className="text-[8px] font-mono">{product.barcode || product.sku}</div>
      <div className="flex w-full items-center justify-between text-[8px]">
        {showSku && <span className="font-mono text-[7px] opacity-70">{product.sku}</span>}
        {showPrice && <span className="font-semibold">{formatBRL(product.price)}</span>}
      </div>
    </div>
  );
}
