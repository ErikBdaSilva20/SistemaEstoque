import { describe, expect, it } from "vitest";
import { filterRows, pageCount, paginate, sortRows } from "./data-table-utils";

interface Row {
  name: string;
  qty: number;
}

const rows: Row[] = [
  { name: "Banana", qty: 3 },
  { name: "Abacaxi", qty: 1 },
  { name: "Cereja", qty: 2 },
];

describe("filterRows", () => {
  it("returns all rows when query is empty", () => {
    expect(filterRows(rows, "", (r) => r.name)).toEqual(rows);
    expect(filterRows(rows, "   ", (r) => r.name)).toEqual(rows);
  });

  it("filters case-insensitively by the given accessor", () => {
    expect(filterRows(rows, "ban", (r) => r.name)).toEqual([rows[0]]);
    expect(filterRows(rows, "A", (r) => r.name)).toEqual(rows);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterRows(rows, "xyz", (r) => r.name)).toEqual([]);
  });
});

describe("sortRows", () => {
  it("sorts ascending by the accessor without mutating the input", () => {
    const result = sortRows(rows, (r) => r.name, "asc");
    expect(result.map((r) => r.name)).toEqual(["Abacaxi", "Banana", "Cereja"]);
    expect(rows.map((r) => r.name)).toEqual(["Banana", "Abacaxi", "Cereja"]);
  });

  it("sorts descending by a numeric accessor", () => {
    const result = sortRows(rows, (r) => r.qty, "desc");
    expect(result.map((r) => r.qty)).toEqual([3, 2, 1]);
  });
});

describe("paginate", () => {
  const many = Array.from({ length: 25 }, (_, i) => i + 1);

  it("slices the requested page", () => {
    expect(paginate(many, 1, 10)).toEqual(many.slice(0, 10));
    expect(paginate(many, 2, 10)).toEqual(many.slice(10, 20));
    expect(paginate(many, 3, 10)).toEqual(many.slice(20, 25));
  });

  it("returns an empty array past the last page", () => {
    expect(paginate(many, 4, 10)).toEqual([]);
  });
});

describe("pageCount", () => {
  it("computes how many pages fit the total", () => {
    expect(pageCount(25, 10)).toBe(3);
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(10, 10)).toBe(1);
  });
});
