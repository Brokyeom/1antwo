import { describe, expect, it } from "vitest";
import {
  escapeStorageName,
  fmt,
  newNumericId,
  newStringId,
  newWithin36Hours,
  pctCalc,
} from "@/lib/utils";

describe("fmt", () => {
  it("천단위 구분", () => {
    expect(fmt(1234567)).toBe("1,234,567");
  });
  it("falsy는 0", () => {
    expect(fmt(0)).toBe("0");
    expect(fmt(NaN)).toBe("0");
  });
});

describe("pctCalc", () => {
  it("수익률을 소수 첫째 자리로", () => {
    expect(pctCalc(10000, 11000)).toBe("10.0");
    expect(pctCalc(10000, 9000)).toBe("-10.0");
  });
  it("매입가 0이면 0.0", () => {
    expect(pctCalc(0, 11000)).toBe("0.0");
  });
});

describe("newWithin36Hours", () => {
  it("36시간 이내면 true", () => {
    expect(newWithin36Hours(Date.now() - 1000)).toBe(true);
  });
  it("36시간 초과·미정의는 false", () => {
    expect(newWithin36Hours(Date.now() - 37 * 60 * 60 * 1000)).toBe(false);
    expect(newWithin36Hours(undefined)).toBe(false);
  });
});

describe("escapeStorageName", () => {
  it("Storage 금지 문자를 밑줄로 치환", () => {
    expect(escapeStorageName("a#b/c[d]e?f*g.pdf")).toBe("a_b_c_d_e_f_g.pdf");
  });
});

describe("id 헬퍼", () => {
  it("newStringId는 UUID 형식", () => {
    expect(newStringId()).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("newStringId는 호출마다 다르다", () => {
    expect(newStringId()).not.toBe(newStringId());
  });
  it("newNumericId는 안전한 정수이며 같은 밀리초 폭주 호출에서도 대부분 유일하다", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newNumericId()));
    expect(ids.size).toBeGreaterThan(185);
    for (const id of ids) {
      expect(Number.isSafeInteger(id)).toBe(true);
    }
  });
});
