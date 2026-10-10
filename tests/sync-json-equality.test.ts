import { expect, it } from "vitest";
import { jsonEqual, stableStringify } from "../src/syncCodec";

it("erhält den kanonischen Vergleich von JSON-Einträgen einschließlich optionaler Felder und Feldreihenfolge", () => {
  const values: unknown[] = [
    undefined,
    null,
    true,
    false,
    0,
    -0,
    1,
    1.5,
    "",
    "1",
    "Grüße 🎬",
    {},
    { optional: undefined },
    [],
    [null],
    [""],
    [1, 2],
    [2, 1],
    { id: "a", values: [{ at: 1, optional: undefined }, null] },
    { values: [{ optional: undefined, at: 1 }, null], id: "a" },
    { id: "b", values: [{ at: 1 }, null] },
    { id: "a", values: [{ at: 2 }, null] },
    { id: "a", values: [{ at: 1 }] },
  ];
  for (const left of values)
    for (const right of values)
      expect(jsonEqual(left, right)).toBe(
        left === undefined || right === undefined
          ? left === right
          : stableStringify(left) === stableStringify(right),
      );
});
