import { describe, expect, it } from "vitest";
import { computeReports } from "./reports";
import type { Product } from "@/lib/data/products.repo";
import type { StockMovement } from "@/lib/data/stock_movements.repo";

const NOW = Date.parse("2026-03-20T00:00:00Z");
const DAY = 86_400_000;

function makeProduct(overrides: Partial<Product> & Pick<Product, "id">): Product {
  return {
    owner_id: "u1",
    sku: `SKU-${overrides.id}`,
    name: `Product ${overrides.id}`,
    description: null,
    category: null,
    brand: null,
    model: null,
    unit: "un",
    cost_price: 10,
    sale_price: 20,
    current_stock: 0,
    min_stock: 0,
    barcode: null,
    ncm: null,
    cest: null,
    origin: null,
    weight_kg: null,
    dimensions: null,
    technical_spec: null,
    internal_notes: null,
    photo_url: null,
    supplier_id: null,
    track_batches: false,
    track_locations: false,
    active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeMovement(
  overrides: Partial<StockMovement> & Pick<StockMovement, "id">,
): StockMovement {
  return {
    owner_id: "u1",
    product_id: "p1",
    product_name: "Product",
    batch_id: null,
    location_id: null,
    destination_location_id: null,
    destination_id: null,
    type: "out",
    origin: "manual",
    quantity: 1,
    reason_id: null,
    reference_id: null,
    notes: null,
    created_at: "2026-03-10T00:00:00Z",
    ...overrides,
  };
}

describe("computeReports > abc", () => {
  it("classifies products A/B/C by cumulative revenue share", () => {
    const products = [
      makeProduct({ id: "p1", sale_price: 100 }),
      makeProduct({ id: "p2", sale_price: 100 }),
      makeProduct({ id: "p3", sale_price: 100 }),
    ];
    const movements = [
      makeMovement({ id: "m1", product_id: "p1", type: "out", quantity: 6 }),
      makeMovement({ id: "m2", product_id: "p2", type: "out", quantity: 3 }),
      makeMovement({ id: "m3", product_id: "p3", type: "out", quantity: 1 }),
    ];

    const { abc } = computeReports(products, movements, 30, NOW);

    expect(abc.map((r) => r.productId)).toEqual(["p1", "p2", "p3"]);
    expect(abc.map((r) => r.class)).toEqual(["A", "B", "C"]);
    expect(abc[0].revenue30d).toBe(600);
    expect(abc[0].cumulativeShare).toBeCloseTo(0.6);
    expect(abc[2].cumulativeShare).toBeCloseTo(1);
  });

  it("excludes inactive products entirely", () => {
    const products = [makeProduct({ id: "p1", active: false })];
    const { abc, totals } = computeReports(products, [], 30, NOW);
    expect(abc).toEqual([]);
    expect(totals.productsCount).toBe(0);
  });
});

describe("computeReports > turnover", () => {
  it("computes turnover and coverage days from in/out movements", () => {
    const products = [makeProduct({ id: "p1", current_stock: 10 })];
    const movements = [makeMovement({ id: "m1", product_id: "p1", type: "out", quantity: 5 })];

    const { turnover } = computeReports(products, movements, 30, NOW);

    expect(turnover).toHaveLength(1);
    const row = turnover[0];
    // current=10, in=0, out=5 -> estimatedStart=15, avgInventory=(10+15)/2=12.5
    expect(row.avgInventory).toBeCloseTo(12.5);
    expect(row.turnover).toBeCloseTo(5 / 12.5);
    expect(row.coverageDays).toBeCloseTo(10 / (5 / 30));
  });

  it("returns null coverageDays when there was no outbound movement", () => {
    const products = [makeProduct({ id: "p1", current_stock: 10 })];
    const { turnover } = computeReports(products, [], 30, NOW);
    expect(turnover[0].coverageDays).toBeNull();
  });
});

describe("computeReports > stockouts", () => {
  it("flags a product currently at zero stock with no movements", () => {
    const products = [makeProduct({ id: "p1", current_stock: 0 })];
    const { stockouts } = computeReports(products, [], 30, NOW);
    expect(stockouts).toHaveLength(1);
    expect(stockouts[0]).toMatchObject({ productId: "p1", daysAgo: 0 });
  });

  it("detects a mid-period stockout even if stock was later replenished", () => {
    const products = [makeProduct({ id: "p1", current_stock: 5 })];
    const movements = [
      makeMovement({
        id: "m1",
        product_id: "p1",
        type: "out",
        quantity: 5,
        created_at: new Date(NOW - 10 * DAY).toISOString(),
      }),
      makeMovement({
        id: "m2",
        product_id: "p1",
        type: "in",
        quantity: 5,
        created_at: new Date(NOW - 8 * DAY).toISOString(),
      }),
    ];

    const { stockouts } = computeReports(products, movements, 30, NOW);

    expect(stockouts).toHaveLength(1);
    expect(stockouts[0].daysAgo).toBe(10);
  });

  it("does not flag a product that never dropped to zero", () => {
    const products = [makeProduct({ id: "p1", current_stock: 5 })];
    const movements = [makeMovement({ id: "m1", product_id: "p1", type: "in", quantity: 5 })];
    const { stockouts } = computeReports(products, movements, 30, NOW);
    expect(stockouts).toEqual([]);
  });
});

describe("computeReports > totals", () => {
  it("sums inventory value/cost and counts low-stock products", () => {
    const products = [
      makeProduct({ id: "p1", current_stock: 10, cost_price: 5, sale_price: 8, min_stock: 20 }),
      makeProduct({ id: "p2", current_stock: 100, cost_price: 2, sale_price: 4, min_stock: 5 }),
    ];

    const { totals } = computeReports(products, [], 30, NOW);

    expect(totals.inventoryCost).toBe(10 * 5 + 100 * 2);
    expect(totals.inventoryValue).toBe(10 * 8 + 100 * 4);
    expect(totals.productsCount).toBe(2);
    expect(totals.lowStockCount).toBe(1);
  });

  it("ignores movements outside the requested period", () => {
    const products = [makeProduct({ id: "p1", current_stock: 10 })];
    const movements = [
      makeMovement({
        id: "m1",
        product_id: "p1",
        type: "out",
        quantity: 5,
        created_at: new Date(NOW - 60 * DAY).toISOString(),
      }),
    ];
    const { totals } = computeReports(products, movements, 30, NOW);
    expect(totals.revenue30d).toBe(0);
  });
});
