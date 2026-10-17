import { describe, expect, it } from "vitest";
import { clientIp, hashValue, isDisposable, normalizeEmail } from "./abuse";

describe("normalizeEmail", () => {
  it("treats Gmail dots, plus tags and case as the same mailbox", () => {
    const forms = ["Maya.Rao@gmail.com", "mayarao@gmail.com", "maya.rao+promo@gmail.com", "MAYARAO@googlemail.com"];
    expect(new Set(forms.map(normalizeEmail))).toEqual(new Set(["mayarao@gmail.com"]));
  });

  it("keeps dots for other providers but drops plus tags", () => {
    expect(normalizeEmail("a.b+x@example.com")).toBe("a.b@example.com");
    expect(normalizeEmail("a.b@example.com")).not.toBe(normalizeEmail("ab@example.com"));
  });
});

describe("isDisposable", () => {
  it("flags known throwaway domains only", () => {
    expect(isDisposable("x@Mailinator.com")).toBe(true);
    expect(isDisposable("x@gmail.com")).toBe(false);
  });
});

describe("hashValue", () => {
  it("is stable per salt and differs between salts", () => {
    expect(hashValue("s1", "v")).toBe(hashValue("s1", "v"));
    expect(hashValue("s1", "v")).not.toBe(hashValue("s2", "v"));
    expect(hashValue("s1", "v")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("clientIp", () => {
  it("uses the first forwarded address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
    expect(clientIp(new Headers())).toBeNull();
  });
});
