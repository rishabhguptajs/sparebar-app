import { describe, expect, it } from "vitest";
import { fitWithin } from "./resize-image";

describe("fitWithin", () => {
  it("shrinks a large phone photo to 1536 on the long side and keeps the shape", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1536, height: 1152 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1152, height: 1536 });
  });

  it("never enlarges a small photo", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("keeps at least one pixel on a very thin image", () => {
    expect(fitWithin(10000, 2)).toEqual({ width: 1536, height: 1 });
  });
});
