import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface Props {
  value: string;
  format?: "CODE128" | "EAN13" | "EAN8" | "UPC";
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
}

export function BarcodeSvg({
  value,
  format,
  width = 1.6,
  height = 40,
  displayValue = true,
  fontSize = 11,
  margin = 2,
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !value) return;

    const detectedFormat = format ?? detectFormat(value);

    try {
      JsBarcode(ref.current, value, {
        format: detectedFormat,
        width,
        height,
        displayValue,
        fontSize,
        margin,
        background: "#ffffff",
        lineColor: "#000000",
        textMargin: 1,
      });
    } catch {
      // fallback to CODE128 if format is invalid (e.g. EAN13 with wrong length)
      try {
        JsBarcode(ref.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize,
          margin,
          background: "#ffffff",
          lineColor: "#000000",
          textMargin: 1,
        });
      } catch {
        // swallow — svg will be empty
      }
    }
  }, [value, format, width, height, displayValue, fontSize, margin]);

  return <svg ref={ref} />;
}

function detectFormat(value: string): Props["format"] {
  if (/^\d{13}$/.test(value)) return "EAN13";
  if (/^\d{8}$/.test(value)) return "EAN8";
  if (/^\d{12}$/.test(value)) return "UPC";
  return "CODE128";
}
