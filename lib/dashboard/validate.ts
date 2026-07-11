import type { DashboardData } from "@/types/dashboard";

type SectionShape = "array" | "record-of-arrays" | "record" | "returns";

const SECTION_SHAPES: Record<keyof Omit<DashboardData, "updatedAt">, SectionShape> = {
  portfolio: "array",
  tradeJournal: "array",
  returnsData: "returns",
  financials: "record",
  companyDocs: "record-of-arrays",
  companyNotes: "record-of-arrays",
  reports: "record-of-arrays",
  reportComments: "record-of-arrays",
  presentations: "array",
  announcements: "array",
  boardPosts: "array",
  annualData: "record-of-arrays",
  quarterlyData: "record-of-arrays",
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// RTDB set()은 undefined 값에서 throw하므로 저장 전에 전부 제거한다.
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map((item) => stripUndefined(item)) as T;
  }
  if (isPlainObject(value)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) cleaned[key] = stripUndefined(item);
    }
    return cleaned as T;
  }
  return value;
}

function sanitizeSection(shape: SectionShape, value: unknown): unknown | undefined {
  switch (shape) {
    case "array":
      return Array.isArray(value) ? value.filter(isPlainObject) : undefined;
    case "record":
      return isPlainObject(value) ? value : undefined;
    case "record-of-arrays": {
      if (!isPlainObject(value)) return undefined;
      const cleaned: Record<string, unknown[]> = {};
      for (const [key, entries] of Object.entries(value)) {
        if (Array.isArray(entries)) cleaned[key] = entries.filter(isPlainObject);
      }
      return cleaned;
    }
    case "returns": {
      if (!isPlainObject(value)) return undefined;
      const labels = value.labels;
      const data = value.data;
      if (!Array.isArray(labels) || !Array.isArray(data)) return undefined;
      return {
        labels: labels.filter((item) => typeof item === "string"),
        data: data.filter((item) => typeof item === "number" && Number.isFinite(item)),
      };
    }
  }
}

/**
 * 백업 JSON을 검증해 알려진 섹션만, 올바른 형태인 것만 남긴다.
 * 유효한 섹션이 하나도 없으면 null을 반환한다.
 */
export function sanitizeBackup(input: unknown): Partial<DashboardData> | null {
  if (!isPlainObject(input)) return null;

  const result: Partial<DashboardData> = {};
  for (const [key, shape] of Object.entries(SECTION_SHAPES) as Array<[keyof DashboardData, SectionShape]>) {
    if (!(key in input)) continue;
    const sanitized = sanitizeSection(shape, input[key]);
    if (sanitized !== undefined) {
      (result as Record<string, unknown>)[key] = stripUndefined(sanitized);
    }
  }

  return Object.keys(result).length ? result : null;
}
