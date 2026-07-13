// Testes do schema de validação de movimentação de estoque.
// O schema é lógica pura (Zod) — testável sem DOM, sem React, sem mocks de gateway.
// Garante que as regras de negócio codificadas no schema não regridam com refatorações futuras.
import { describe, expect, it } from "vitest";
import { movementSchema } from "@/components/stock/movement-form/useMovementForm";

// UUIDs v4 válidos (formato: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx)
const PRODUCT_UUID = "3f5e4c2a-1b2c-4d3e-8f9a-0b1c2d3e4f5a";
const LOCATION_A = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const LOCATION_B = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

/** Helper: retorna um input válido de "saída" com apenas o campo alterado. */
function baseOut(overrides?: Record<string, unknown>) {
  return {
    product_id: PRODUCT_UUID,
    type: "out",
    quantity: 5,
    location_id: LOCATION_A,
    destination_location_id: "",
    destination_id: "",
    batch_id: "",
    reason: "",
    notes: "",
    ...overrides,
  };
}

describe("movementSchema — campos obrigatórios", () => {
  it("aceita um payload mínimo válido de saída", () => {
    const result = movementSchema.safeParse(baseOut());
    expect(result.success).toBe(true);
  });

  it("rejeita product_id ausente ou não-UUID", () => {
    expect(movementSchema.safeParse(baseOut({ product_id: "" })).success).toBe(false);
    expect(movementSchema.safeParse(baseOut({ product_id: "not-a-uuid" })).success).toBe(false);
  });

  it("rejeita quantity zero", () => {
    const result = movementSchema.safeParse(baseOut({ quantity: 0 }));
    expect(result.success).toBe(false);
  });

  it("aceita quantity negativa (ajuste para baixo)", () => {
    const result = movementSchema.safeParse(baseOut({ type: "adjustment", quantity: -10 }));
    expect(result.success).toBe(true);
  });

  it("rejeita type inválido", () => {
    const result = movementSchema.safeParse(baseOut({ type: "unknown_type" }));
    expect(result.success).toBe(false);
  });
});

describe("movementSchema — regra de transferência", () => {
  it("aceita transferência com origem e destino diferentes", () => {
    const result = movementSchema.safeParse(
      baseOut({
        type: "transfer",
        location_id: LOCATION_A,
        destination_location_id: LOCATION_B,
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejeita transferência com origem === destino", () => {
    const result = movementSchema.safeParse(
      baseOut({
        type: "transfer",
        location_id: LOCATION_A,
        destination_location_id: LOCATION_A, // mesma localização
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("destination_location_id");
    }
  });

  it("rejeita transferência sem destino definido", () => {
    const result = movementSchema.safeParse(
      baseOut({
        type: "transfer",
        location_id: LOCATION_A,
        destination_location_id: "", // vazio = sem destino
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejeita transferência sem origem e sem destino", () => {
    const result = movementSchema.safeParse(
      baseOut({
        type: "transfer",
        location_id: "",
        destination_location_id: "",
      }),
    );
    expect(result.success).toBe(false);
  });
});

describe("movementSchema — campos opcionais", () => {
  it("aceita reason com até 200 caracteres", () => {
    const result = movementSchema.safeParse(baseOut({ reason: "A".repeat(200) }));
    expect(result.success).toBe(true);
  });

  it("rejeita reason com mais de 200 caracteres", () => {
    const result = movementSchema.safeParse(baseOut({ reason: "A".repeat(201) }));
    expect(result.success).toBe(false);
  });

  it("aceita notes com até 500 caracteres", () => {
    const result = movementSchema.safeParse(baseOut({ notes: "N".repeat(500) }));
    expect(result.success).toBe(true);
  });

  it("rejeita notes com mais de 500 caracteres", () => {
    const result = movementSchema.safeParse(baseOut({ notes: "N".repeat(501) }));
    expect(result.success).toBe(false);
  });

  it("coerce quantity de string para número", () => {
    const result = movementSchema.safeParse(baseOut({ quantity: "10" }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.quantity).toBe(10);
  });
});
