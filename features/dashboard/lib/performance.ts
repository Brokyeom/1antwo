import type { DashboardData, PerformanceRecord } from "@/types/dashboard";

export function upsertPerformance(
  current: DashboardData,
  target: "annualData" | "quarterlyData",
  company: string,
  record: PerformanceRecord,
  limit: number,
  labelKey: "year" | "quarter",
) {
  const records = [...(current[target][company] || [])];
  const label = record[labelKey];
  const existingIndex = records.findIndex((item) => item[labelKey] === label);
  if (existingIndex >= 0) records[existingIndex] = { ...records[existingIndex], ...record };
  else records.push(record);
  records.sort((a, b) => String(a[labelKey]).localeCompare(String(b[labelKey])));
  return { ...current, [target]: { ...current[target], [company]: records.slice(-limit) } };
}

export function removePerformance(
  current: DashboardData,
  target: "annualData" | "quarterlyData",
  company: string,
  id: string,
) {
  return {
    ...current,
    [target]: { ...current[target], [company]: (current[target][company] || []).filter((record) => record.id !== id) },
  };
}
