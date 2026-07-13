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
import { toastSuccess, toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface MovementDestinationFieldProps {
  destinations: any[];
  createDestinationPending: boolean;
  onCreateDestination: (name: string, kind: string) => Promise<{ id: string }>;
}

export function MovementDestinationField({
  destinations,
  createDestinationPending,
  onCreateDestination,
}: MovementDestinationFieldProps) {
  const form = useFormContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <FormField
      control={form.control}
      name="destination_id"
      render={({ field }) => {
        const selectedDestination = destinations.find((d) => d.id === field.value);
        const searchTrimmed = search.trim();
        const nameAlreadyExists = destinations.some(
          (d) => d.name.toLowerCase() === searchTrimmed.toLowerCase(),
        );

        const handleCreate = async (kind: string) => {
          if (!searchTrimmed) return;
          try {
            const created = await onCreateDestination(searchTrimmed, kind);
            field.onChange(created.id);
            setSearch("");
            setOpen(false);
            toastSuccess("Destino cadastrado.");
          } catch (e) {
            toastError(e);
          }
        };

        return (
          <FormItem className="flex flex-col">
            <FormLabel>Destino *</FormLabel>
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
                    {selectedDestination
                      ? `${selectedDestination.name} (${selectedDestination.kind})`
                      : "Selecione ou cadastre um destino"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter>
                  <CommandInput
                    placeholder="Buscar ou digitar novo..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {searchTrimmed ? (
                        <div className="space-y-2 p-2 text-left">
                          <p className="text-xs text-muted-foreground">
                            Cadastrar "{searchTrimmed}" como:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              disabled={createDestinationPending}
                              onClick={() => handleCreate("sector")}
                            >
                              Setor
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              disabled={createDestinationPending}
                              onClick={() => handleCreate("consumer")}
                            >
                              Consumidor
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              disabled={createDestinationPending}
                              onClick={() => handleCreate("other")}
                            >
                              Outro
                            </Button>
                          </div>
                        </div>
                      ) : (
                        "Digite para buscar ou cadastrar."
                      )}
                    </CommandEmpty>
                    {destinations.length > 0 && (
                      <CommandGroup>
                        {destinations.map((d) => (
                          <CommandItem
                            key={d.id}
                            value={`${d.name} ${d.kind}`}
                            onSelect={() => {
                              field.onChange(d.id);
                              setOpen(false);
                              setSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === d.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="flex-1">{d.name}</span>
                            <span className="text-xs text-muted-foreground">{d.kind}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {searchTrimmed && !nameAlreadyExists && destinations.length > 0 && (
                      <CommandGroup heading="Cadastrar novo">
                        <CommandItem
                          value={`__create_sector__${searchTrimmed}`}
                          onSelect={() => handleCreate("sector")}
                        >
                          + Cadastrar "{searchTrimmed}" como Setor
                        </CommandItem>
                        <CommandItem
                          value={`__create_consumer__${searchTrimmed}`}
                          onSelect={() => handleCreate("consumer")}
                        >
                          + Cadastrar "{searchTrimmed}" como Consumidor
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
