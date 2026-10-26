import { describe, expect, it } from "vitest";
import { AVATARS, validateAvatars } from "./avatars";

describe("premade avatars", () => {
  it("has a valid, distinct roster", () => {
    expect(validateAvatars()).toEqual([]);
  });

  it("flags a duplicate", () => {
    expect(validateAvatars([...AVATARS, AVATARS[0]]).length).toBeGreaterThan(0);
  });
});
