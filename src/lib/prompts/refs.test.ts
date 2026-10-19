import { describe, expect, it } from "vitest";
import { planRefs } from "./refs";

const base = { framing: "half" as const, maxRefs: 3, outfit: false, productPhotos: 0, hasCharacter: true };

describe("planRefs", () => {
  it("sends all photos of an old character in the order they were uploaded", () => {
    expect(planRefs({ ...base, tags: ["photo", "photo", "photo"] }).character).toEqual([0, 1, 2]);
    expect(planRefs({ ...base, tags: [] }).character).toEqual([]);
  });

  it("leaves room for one product photo, as before", () => {
    const r = planRefs({ ...base, tags: ["photo", "photo", "photo"], productPhotos: 1 });
    expect(r.character).toEqual([0, 1]);
    expect(r.product).toBe(1);
  });

  it("puts the front shot first for close ups and the full body first for outfit shots", () => {
    const tags = ["angle", "full", "front"];
    expect(planRefs({ ...base, tags, framing: "close", maxRefs: 1 }).character).toEqual([2]);
    expect(planRefs({ ...base, tags, framing: "full", maxRefs: 1 }).character).toEqual([1]);
  });

  it("makes room for person, outfit and product on a three photo model", () => {
    const r = planRefs({ ...base, tags: ["front", "angle", "full"], outfit: true, productPhotos: 2 });
    expect(r.character).toHaveLength(1);
    expect(r.outfit).toBe(true);
    expect(r.product).toBe(1);
  });

  it("gives the label close up a slot when there is room", () => {
    const r = planRefs({ ...base, tags: ["front", "angle", "full"], productPhotos: 2 });
    expect(r.character).toHaveLength(1);
    expect(r.product).toBe(2);
  });

  it("refuses a product photo on a one photo model with a clear message", () => {
    expect(() => planRefs({ ...base, tags: ["photo"], maxRefs: 1, productPhotos: 1 })).toThrow(/one reference photo/);
  });

  it("is fine with a product and no character", () => {
    const r = planRefs({ ...base, tags: [], hasCharacter: false, productPhotos: 2, maxRefs: 3 });
    expect(r).toEqual({ character: [], outfit: false, product: 2 });
  });
});
