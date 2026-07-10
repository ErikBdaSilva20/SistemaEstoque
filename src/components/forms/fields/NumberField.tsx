import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export interface NumberFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  step?: string;
  min?: string;
}

export function NumberField({ name, label, placeholder, step = "1", min = "0" }: NumberFieldProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              min={min}
              placeholder={placeholder}
              {...field}
              value={field.value as number | string | undefined}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
