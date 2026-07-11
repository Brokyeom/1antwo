import type { DashboardData } from "@/types/dashboard";
import type { StockQuote } from "@/lib/stocks/price-provider";

export type TabKey = "portfolio" | "analysis" | "presentations" | "notice" | "board";

export type Patch = (current: DashboardData) => DashboardData;

export type NaverPriceResponse = {
  prices?: Record<string, number | null>;
  quotes?: Record<string, StockQuote | null>;
};
