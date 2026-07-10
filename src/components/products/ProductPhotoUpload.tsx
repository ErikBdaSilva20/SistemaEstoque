import { ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  productSku?: string;
}

// ADR-005: sem storage/upload de arquivo no v1 — só URL externa (Drive/Imgur/CDN
// do cliente). Upload de arquivo vira extensão (ext-002-storage-uploads.md).
export function ProductPhotoUpload({ value, onChange }: Props) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {value ? (
          <img src={value} alt="Produto" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <Input
          placeholder="https://..."
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.trim() || null)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Cole a URL de uma imagem hospedada externamente (Drive, Imgur, CDN próprio).
        </p>
      </div>
    </div>
  );
}
