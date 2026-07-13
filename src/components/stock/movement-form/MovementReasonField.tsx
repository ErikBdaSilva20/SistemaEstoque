import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REASON_FREEFORM = "__custom__";

interface MovementReasonFieldProps {
  reasons: { id: string; label: string }[];
  type: string;
}

export function MovementReasonField({ reasons, type }: MovementReasonFieldProps) {
  const form = useFormContext();
  const [reasonMode, setReasonMode] = useState<string>("");

  useEffect(() => {
    setReasonMode("");
    form.setValue("reason", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  return (
    <FormField
      control={form.control}
      name="reason"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Motivo</FormLabel>
          {reasons.length > 0 ? (
            <div className="space-y-2">
              <Select
                value={reasonMode}
                onValueChange={(value) => {
                  setReasonMode(value);
                  if (value === REASON_FREEFORM) {
                    field.onChange("");
                  } else if (value === "") {
                    field.onChange("");
                  } else {
                    field.onChange(value);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um motivo cadastrado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r.id} value={r.label}>
                      {r.label}
                    </SelectItem>
                  ))}
                  <SelectItem value={REASON_FREEFORM}>✏️ Outro motivo (digitar)</SelectItem>
                </SelectContent>
              </Select>
              {reasonMode === REASON_FREEFORM && (
                <FormControl>
                  <Input
                    placeholder="Digite o motivo"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
              )}
            </div>
          ) : (
            <FormControl>
              <Input placeholder="Ex: Venda balcão, Contagem, Quebra..." {...field} />
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
