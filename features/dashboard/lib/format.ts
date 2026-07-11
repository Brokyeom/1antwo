import { fmt } from "@/lib/utils";

export function getReturnTone(value: number) {
  if (value > 0) {
    return {
      text: "text-trading-up",
      strongText: "font-number font-semibold tabular-nums text-trading-up",
      badge: "border-trading-up/30 bg-trading-up/10 text-trading-up",
      row: "",
    };
  }

  if (value < 0) {
    return {
      text: "text-trading-down",
      strongText: "font-number font-semibold tabular-nums text-trading-down",
      badge: "border-trading-down/30 bg-trading-down/10 text-trading-down",
      row: "",
    };
  }

  return {
    text: "text-muted-foreground",
    strongText: "font-number font-semibold tabular-nums text-muted-foreground",
    badge: "border-muted bg-muted text-muted-foreground",
    row: "",
  };
}

export function formatSignedNumber(value: number) {
  return `${value > 0 ? "+" : ""}${fmt(value)}`;
}

export function formatSignedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}
