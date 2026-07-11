import { describe, expect, it } from "vitest";
import { formatSignedNumber, formatSignedPercent, getReturnTone } from "@/features/dashboard/lib/format";

describe("getReturnTone", () => {
  it("양수는 trading-up 톤", () => {
    expect(getReturnTone(1).text).toBe("text-trading-up");
  });
  it("음수는 trading-down 톤", () => {
    expect(getReturnTone(-1).text).toBe("text-trading-down");
  });
  it("0은 muted 톤", () => {
    expect(getReturnTone(0).text).toBe("text-muted-foreground");
  });
});

describe("formatSignedNumber", () => {
  it("양수에 + 접두어와 천단위 구분", () => {
    expect(formatSignedNumber(12345)).toBe("+12,345");
  });
  it("음수는 로케일 서식 그대로", () => {
    expect(formatSignedNumber(-12345)).toBe("-12,345");
  });
  it("0은 접두어 없음", () => {
    expect(formatSignedNumber(0)).toBe("0");
  });
});

describe("formatSignedPercent", () => {
  it("소수 둘째 자리와 부호", () => {
    expect(formatSignedPercent(1.456)).toBe("+1.46%");
    expect(formatSignedPercent(-2)).toBe("-2.00%");
    expect(formatSignedPercent(0)).toBe("0.00%");
  });
});
