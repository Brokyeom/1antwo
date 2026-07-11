import { describe, expect, it } from "vitest";
import { normalizeStockCodes, quotesToPrices } from "@/lib/stocks/price-provider";

describe("normalizeStockCodes", () => {
  it("공백 제거·빈 값 필터·중복 제거", () => {
    expect(normalizeStockCodes([" 005930 ", "", "005930", "035720"])).toEqual(["005930", "035720"]);
  });
  it("빈 입력은 빈 배열", () => {
    expect(normalizeStockCodes([])).toEqual([]);
  });
});

describe("quotesToPrices", () => {
  it("quote 맵을 가격 맵으로 변환하고 null을 보존한다", () => {
    expect(
      quotesToPrices({
        "005930": {
          code: "005930",
          price: 70000,
          previousClose: null,
          change: null,
          changeRate: null,
          fetchedAt: "t",
          source: "naver",
        },
        "000000": null,
      }),
    ).toEqual({ "005930": 70000, "000000": null });
  });
});
