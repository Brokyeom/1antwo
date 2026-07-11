import { describe, expect, it } from "vitest";
import { removePerformance, upsertPerformance } from "@/features/dashboard/lib/performance";
import { DEFAULT_DATA } from "@/lib/dashboard/default-data";
import type { DashboardData, PerformanceRecord } from "@/types/dashboard";

const record = (id: string, year: string, revenue = 100): PerformanceRecord => ({
  id,
  year,
  revenue,
  opProfit: 10,
  netProfit: 5,
});

const base = (): DashboardData => ({ ...DEFAULT_DATA, annualData: {} });

describe("upsertPerformance", () => {
  it("새 레코드를 추가하고 라벨 순으로 정렬한다", () => {
    let data = base();
    data = upsertPerformance(data, "annualData", "삼성", record("a", "2024"), 5, "year") as DashboardData;
    data = upsertPerformance(data, "annualData", "삼성", record("b", "2022"), 5, "year") as DashboardData;
    expect(data.annualData["삼성"].map((r) => r.year)).toEqual(["2022", "2024"]);
  });

  it("같은 라벨은 병합(교체)한다", () => {
    let data = base();
    data = upsertPerformance(data, "annualData", "삼성", record("a", "2024", 100), 5, "year") as DashboardData;
    data = upsertPerformance(data, "annualData", "삼성", record("b", "2024", 200), 5, "year") as DashboardData;
    expect(data.annualData["삼성"]).toHaveLength(1);
    expect(data.annualData["삼성"][0].revenue).toBe(200);
  });

  it("limit을 초과하면 앞(오래된 라벨)에서 잘라낸다", () => {
    let data = base();
    for (const year of ["2020", "2021", "2022", "2023"]) {
      data = upsertPerformance(data, "annualData", "삼성", record(year, year), 3, "year") as DashboardData;
    }
    expect(data.annualData["삼성"].map((r) => r.year)).toEqual(["2021", "2022", "2023"]);
  });

  it("다른 기업/섹션은 건드리지 않는다", () => {
    const data = base();
    const next = upsertPerformance(data, "annualData", "삼성", record("a", "2024"), 5, "year") as DashboardData;
    expect(next.quarterlyData).toBe(data.quarterlyData);
    expect(next.portfolio).toBe(data.portfolio);
  });
});

describe("removePerformance", () => {
  it("id로 삭제한다", () => {
    let data = base();
    data = upsertPerformance(data, "annualData", "삼성", record("a", "2024"), 5, "year") as DashboardData;
    data = removePerformance(data, "annualData", "삼성", "a") as DashboardData;
    expect(data.annualData["삼성"]).toEqual([]);
  });

  it("없는 기업이어도 안전하다", () => {
    const data = removePerformance(base(), "annualData", "없는기업", "x") as DashboardData;
    expect(data.annualData["없는기업"]).toEqual([]);
  });
});
