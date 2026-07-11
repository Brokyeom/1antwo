import { NextRequest, NextResponse } from "next/server";
import { naverPriceProvider } from "@/lib/stocks/naver-price-provider";
import { normalizeStockCodes, quotesToPrices } from "@/lib/stocks/price-provider";

const MAX_CODES = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

// 인스턴스 메모리 기반 best-effort 제한 — 서버리스 환경에서는 인스턴스마다
// 별도 카운터를 가지므로 완전한 방어가 아니라 남용 억제 목적이다.
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(ip, recent);
  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (!times.some((time) => now - time < RATE_LIMIT_WINDOW_MS)) requestLog.delete(key);
    }
  }
  return false;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const codes = normalizeStockCodes((request.nextUrl.searchParams.get("codes") || "").split(","));

  if (!codes.length) {
    return NextResponse.json({ error: "codes 파라미터 필요" }, { status: 400 });
  }
  if (codes.length > MAX_CODES) {
    return NextResponse.json({ error: `codes는 최대 ${MAX_CODES}개까지 요청할 수 있습니다.` }, { status: 400 });
  }

  const quotes = await naverPriceProvider.fetchQuotes(codes);

  return NextResponse.json(
    { prices: quotesToPrices(quotes), quotes },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
