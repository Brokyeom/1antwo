import { describe, expect, it } from "vitest";
import { sanitizeBackup } from "@/lib/dashboard/validate";

describe("sanitizeBackup", () => {
  it("객체가 아니면 null", () => {
    expect(sanitizeBackup(null)).toBeNull();
    expect(sanitizeBackup("문자열")).toBeNull();
    expect(sanitizeBackup([1, 2])).toBeNull();
  });

  it("유효한 섹션이 하나도 없으면 null", () => {
    expect(sanitizeBackup({})).toBeNull();
    expect(sanitizeBackup({ unknownKey: true, portfolio: "잘못된 타입" })).toBeNull();
  });

  it("알 수 없는 최상위 키를 제거한다", () => {
    const result = sanitizeBackup({ portfolio: [{ id: 1 }], evil: { hack: true } });
    expect(result).toEqual({ portfolio: [{ id: 1 }] });
  });

  it("배열 섹션에서 객체가 아닌 항목을 걸러낸다", () => {
    const result = sanitizeBackup({ boardPosts: [{ id: "a" }, "쓰레기", 42, null] });
    expect(result?.boardPosts).toEqual([{ id: "a" }]);
  });

  it("record-of-arrays 섹션에서 배열이 아닌 값을 제거한다", () => {
    const result = sanitizeBackup({
      companyDocs: { 삼성: [{ id: "x" }], 카카오: "잘못됨" },
    });
    expect(result?.companyDocs).toEqual({ 삼성: [{ id: "x" }] });
  });

  it("returnsData는 labels/data 배열 구조를 강제한다", () => {
    expect(sanitizeBackup({ returnsData: { labels: "x", data: [] } })).toBeNull();
    const result = sanitizeBackup({ returnsData: { labels: ["26.01", 5], data: [1.5, "x", NaN] } });
    expect(result?.returnsData).toEqual({ labels: ["26.01"], data: [1.5] });
  });

  it("undefined 값을 깊이 제거한다 (RTDB set이 throw하지 않도록)", () => {
    const result = sanitizeBackup({
      portfolio: [{ id: 1, code: undefined, nested: { keep: 1, drop: undefined } }],
    });
    expect(result?.portfolio).toEqual([{ id: 1, nested: { keep: 1 } }]);
  });

  it("정상 백업은 그대로 통과한다", () => {
    const backup = {
      portfolio: [{ id: 1, name: "삼성전자", buyPrice: 1, currentPrice: 2, qty: 3, sector: "IT" }],
      announcements: [{ id: "a", author: "u", title: "t", content: "c", createdAt: 1 }],
      financials: { 삼성전자: { per: 1, pbr: 1, roe: 1, debt: 1, rev: [], op: [], years: [], desc: "" } },
    };
    expect(sanitizeBackup(backup)).toEqual(backup);
  });
});
