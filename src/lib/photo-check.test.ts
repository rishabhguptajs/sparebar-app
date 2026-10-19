import { describe, expect, it } from "vitest";
import { judge, measure } from "./photo-check";

function image(w: number, h: number, pixel: (x: number, y: number) => number) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const v = pixel(x, y);
      const i = (y * w + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  return data;
}

describe("measure", () => {
  it("reads a flat dark image as dark and blurry", () => {
    const m = measure(image(64, 64, () => 20), 64, 64);
    expect(m.brightness).toBeCloseTo(20, 0);
    expect(m.sharpness).toBeCloseTo(0, 5);
  });

  it("reads a checkerboard as sharp", () => {
    const m = measure(image(64, 64, (x, y) => ((x + y) % 2 ? 220 : 40)), 64, 64);
    expect(m.sharpness).toBeGreaterThan(1000);
    expect(m.brightness).toBeGreaterThan(100);
  });
});

describe("judge", () => {
  const ok = { width: 1200, height: 1600, brightness: 120, sharpness: 400 };
  it("passes a good photo", () => expect(judge(ok)).toEqual([]));
  it("flags each problem", () => {
    expect(judge({ ...ok, width: 300 })).toContain("small");
    expect(judge({ ...ok, brightness: 30 })).toContain("dark");
    expect(judge({ ...ok, brightness: 245 })).toContain("bright");
    expect(judge({ ...ok, sharpness: 5 })).toContain("blurry");
  });
});
