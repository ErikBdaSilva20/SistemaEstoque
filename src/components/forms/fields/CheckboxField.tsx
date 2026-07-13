import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

export interface CheckboxFieldProps {
  name: string;
  label: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function CheckboxField({ name, label, description, className }: CheckboxFieldProps) {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <label className={cn("flex cursor-pointer items-start gap-2 text-sm", className)}>
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="font-medium">{label}</span>
              {description && (
                <span className="block text-xs text-muted-foreground">{description}</span>
              )}
            </span>
          </label>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
