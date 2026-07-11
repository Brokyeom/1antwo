import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = (value: number) => Number(value || 0).toLocaleString("ko-KR");

export const pctCalc = (buyPrice: number, currentPrice: number) => {
  if (!buyPrice) return "0.0";
  return (((currentPrice - buyPrice) / buyPrice) * 100).toFixed(1);
};

export const newWithin36Hours = (timestamp?: number) => {
  return Boolean(timestamp && Date.now() - timestamp < 36 * 60 * 60 * 1000);
};

export const escapeStorageName = (name: string) => name.replace(/[#/[\]?*]/g, "_");

export const newStringId = () => crypto.randomUUID();

// 숫자 id 스키마(Stock, TradeJournalEntry)를 유지하면서 같은 밀리초·다중 사용자
// 충돌을 피한다. Date.now()*4000 + 랜덤은 2041년까지 Number.MAX_SAFE_INTEGER 안에 든다.
export const newNumericId = () => Date.now() * 4000 + Math.floor(Math.random() * 4000);
