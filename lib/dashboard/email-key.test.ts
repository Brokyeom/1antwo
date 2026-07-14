import { describe, expect, it } from "vitest";
import { emailToKey, isValidEmail } from "./email-key";

describe("emailToKey", () => {
  it("replaces every dot and lowercases", () => {
    expect(emailToKey("hg.kim@flarelane.com")).toBe("hg,kim@flarelane,com");
  });

  it("trims and lowercases mixed case with surrounding spaces", () => {
    expect(emailToKey("  User.Name@Example.CO.KR  ")).toBe("user,name@example,co,kr");
  });

  it("leaves an already dotless address untouched", () => {
    expect(emailToKey("member@localhost")).toBe("member@localhost");
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
  });

  it("rejects missing parts and whitespace", () => {
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("a @b.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
