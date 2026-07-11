import { describe, expect, it } from "vitest";
import {
  computePortfolioStats,
  computeReturnsChart,
  computeSectorAllocation,
  mergeNaverQuotes,
} from "@/features/dashboard/lib/portfolio";
import type { Stock } from "@/types/dashboard";

const stock = (overrides: Partial<Stock>): Stock => ({
  id: 1,
  name: "테스트",
  buyPrice: 10000,
  currentPrice: 11000,
  qty: 10,
  sector: "IT",
  ...overrides,
});

describe("computePortfolioStats", () => {
  it("투자금·평가액·수익금·수익률을 계산한다", () => {
    const stats = computePortfolioStats([
      stock({ id: 1, buyPrice: 10000, currentPrice: 11000, qty: 10 }),
      stock({ id: 2, buyPrice: 20000, currentPrice: 18000, qty: 5 }),
    ]);
    expect(stats.inv).toBe(200000);
    expect(stats.cur).toBe(200000);
    expect(stats.ret).toBe(0);
    expect(stats.pct).toBe("0.0");
  });

  it("빈 포트폴리오는 0으로 나누지 않는다", () => {
    const stats = computePortfolioStats([]);
    expect(stats).toEqual({ inv: 0, cur: 0, ret: 0, pct: "0.0" });
  });
});

describe("computeSectorAllocation", () => {
  it("섹터별 평가액을 합산한다", () => {
    const sectors = computeSectorAllocation([
      stock({ id: 1, sector: "IT", currentPrice: 1000, qty: 1 }),
      stock({ id: 2, sector: "IT", currentPrice: 2000, qty: 1 }),
      stock({ id: 3, sector: "바이오", currentPrice: 500, qty: 2 }),
    ]);
    expect(sectors).toEqual([
      { name: "IT", value: 3000 },
      { name: "바이오", value: 1000 },
    ]);
  });
});

describe("computeReturnsChart", () => {
  it("라벨과 데이터를 포인트로 결합하고 0 기준 오프셋을 계산한다", () => {
    const chart = computeReturnsChart({ labels: ["26.01", "26.02"], data: [10, -10] });
    expect(chart.points).toEqual([
      { label: "26.01", value: 10 },
      { label: "26.02", value: -10 },
    ]);
    expect(chart.zeroOffset).toBe(50);
  });

  it("빈 데이터는 오프셋 50을 반환한다", () => {
    expect(computeReturnsChart({ labels: [], data: [] }).zeroOffset).toBe(50);
  });

  it("전부 양수면 오프셋 100", () => {
    expect(computeReturnsChart({ labels: ["a"], data: [5] }).zeroOffset).toBe(100);
  });
});

describe("mergeNaverQuotes", () => {
  it("quote가 있으면 시세 필드 전체를 갱신한다", () => {
    const { portfolio, updated } = mergeNaverQuotes([stock({ code: "005930" })], {
      quotes: {
        "005930": {
          code: "005930",
          price: 70000,
          previousClose: 69000,
          change: 1000,
          changeRate: 1.45,
          fetchedAt: "2026-07-11",
          source: "naver",
        },
      },
    });
    expect(updated).toBe(1);
    expect(portfolio[0].currentPrice).toBe(70000);
    expect(portfolio[0].priceChange).toBe(1000);
    expect(portfolio[0].priceChangeRate).toBe(1.45);
  });

  it("prices만 있으면 현재가만 갱신한다", () => {
    const { portfolio, updated } = mergeNaverQuotes([stock({ code: "005930", priceChange: 99 })], {
      prices: { "005930": 71000 },
    });
    expect(updated).toBe(1);
    expect(portfolio[0].currentPrice).toBe(71000);
    expect(portfolio[0].priceChange).toBe(99);
  });

  it("매칭되는 시세가 없으면 원본을 유지하고 updated=0", () => {
    const original = stock({ code: "000000" });
    const { portfolio, updated } = mergeNaverQuotes([original], { prices: { "005930": 1 } });
    expect(updated).toBe(0);
    expect(portfolio[0]).toBe(original);
  });

  it("코드 없는 종목은 건너뛴다", () => {
    const { updated } = mergeNaverQuotes([stock({ code: undefined })], { prices: { "005930": 1 } });
    expect(updated).toBe(0);
  });
});
