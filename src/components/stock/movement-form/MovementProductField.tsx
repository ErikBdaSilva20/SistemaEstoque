import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface MovementProductFieldProps {
  products: any[];
  selectedProduct?: any;
}

export function MovementProductField({ products, selectedProduct }: MovementProductFieldProps) {
  const form = useFormContext();
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={form.control}
      name="product_id"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Produto *</FormLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between font-normal",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {selectedProduct
                    ? `${selectedProduct.name} (${selectedProduct.sku})`
                    : "Selecione um produto"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
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
                          form.setValue("product_id", p.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            p.id === field.value ? "opacity-100" : "opacity-0",
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
