import type { ReturnsData, Stock } from "@/types/dashboard";
import type { NaverPriceResponse } from "@/features/dashboard/types";

export function computePortfolioStats(portfolio: Stock[]) {
  const inv = portfolio.reduce((sum, stock) => sum + stock.buyPrice * stock.qty, 0);
  const cur = portfolio.reduce((sum, stock) => sum + stock.currentPrice * stock.qty, 0);
  const ret = cur - inv;
  const pct = inv > 0 ? ((ret / inv) * 100).toFixed(1) : "0.0";
  return { inv, cur, ret, pct };
}

export function computeSectorAllocation(portfolio: Stock[]) {
  const map = new Map<string, number>();
  portfolio.forEach((stock) => map.set(stock.sector, (map.get(stock.sector) || 0) + stock.currentPrice * stock.qty));
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function computeReturnsChart(returnsData: ReturnsData) {
  const points = returnsData.labels.map((label, index) => ({
    label,
    value: returnsData.data[index],
  }));
  const values = points.map((item) => item.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const zeroOffset = max === min ? 50 : (max / (max - min)) * 100;
  return { points, min, max, zeroOffset };
}

export function mergeNaverQuotes(portfolio: Stock[], json: NaverPriceResponse) {
  let updated = 0;
  const next = portfolio.map((stock) => {
    const code = stock.code?.trim() || "";
    const quote = json.quotes?.[code];
    const price = quote?.price ?? json.prices?.[code];
    if (price == null) return stock;
    updated += 1;
    if (!quote) return { ...stock, currentPrice: price };

    return {
      ...stock,
      currentPrice: price,
      previousClose: quote.previousClose,
      priceChange: quote.change,
      priceChangeRate: quote.changeRate,
      priceFetchedAt: quote.fetchedAt,
      priceSource: quote.source,
      marketStatus: quote.marketStatus,
    };
  });
  return { portfolio: next, updated };
}
