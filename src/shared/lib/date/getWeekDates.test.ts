import { describe, expect, it } from "vitest";

import { getWeekDates, shiftDate } from "./getWeekDates";

describe("getWeekDates", () => {
  it("неделя среды начинается в понедельник и кончается в воскресенье", () => {
    expect(getWeekDates("2026-11-04")).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
  });

  it("сдвиг на 7 дней сохраняет день недели и даёт соседние недели", () => {
    expect(shiftDate("2026-11-04", -7)).toBe("2026-10-28");
    expect(shiftDate("2026-11-04", 7)).toBe("2026-11-11");
    expect(getWeekDates(shiftDate("2026-11-04", -7))[0]).toBe("2026-10-26");
    expect(getWeekDates(shiftDate("2026-11-04", 7))[0]).toBe("2026-11-09");
  });
});
