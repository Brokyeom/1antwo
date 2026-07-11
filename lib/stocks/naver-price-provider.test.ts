import { afterEach, describe, expect, it, vi } from "vitest";
import { naverPriceProvider } from "@/lib/stocks/naver-price-provider";

const naverResponse = (body: Record<string, unknown>) =>
  ({ ok: true, json: () => Promise.resolve(body) }) as Response;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("naverPriceProvider.fetchQuotes", () => {
  it("응답을 파싱해 하락 방향은 음수 부호를 적용한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        naverResponse({
          itemCode: "005930",
          stockName: "삼성전자",
          closePrice: "70,000",
          compareToPreviousClosePrice: "1,000",
          compareToPreviousPrice: { name: "FALLING" },
          fluctuationsRatio: "1.41",
          marketStatus: "CLOSE",
          localTradedAt: "2026-07-11T15:30:00+09:00",
        }),
      ),
    );

    const quotes = await naverPriceProvider.fetchQuotes(["005930"]);
    const quote = quotes["005930"];
    expect(quote?.price).toBe(70000);
    expect(quote?.change).toBe(-1000);
    expect(quote?.changeRate).toBe(-1.41);
    expect(quote?.previousClose).toBe(71000);
    expect(quote?.name).toBe("삼성전자");
  });

  it("상승 방향은 양수 부호", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        naverResponse({
          itemCode: "005930",
          closePrice: "70,000",
          compareToPreviousClosePrice: "500",
          compareToPreviousPrice: { name: "RISING" },
          fluctuationsRatio: "0.72",
        }),
      ),
    );

    const quote = (await naverPriceProvider.fetchQuotes(["005930"]))["005930"];
    expect(quote?.change).toBe(500);
    expect(quote?.changeRate).toBe(0.72);
  });

  it("가격이 파싱 불가능하면 null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(naverResponse({ closePrice: "N/A" })));
    expect((await naverPriceProvider.fetchQuotes(["005930"]))["005930"]).toBeNull();
  });

  it("HTTP 오류·네트워크 실패는 해당 코드만 null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect((await naverPriceProvider.fetchQuotes(["005930"]))["005930"]).toBeNull();
  });

  it("코드를 정규화(트림·중복 제거)해 요청한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(naverResponse({ closePrice: "1,000" }));
    vi.stubGlobal("fetch", fetchMock);
    await naverPriceProvider.fetchQuotes([" 005930 ", "005930"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
