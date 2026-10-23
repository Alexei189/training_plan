import { useMemo } from "react";

import { DayArgs, useGetDayPlanQuery } from "@/entities/day-plan";
import { useAppSelector } from "@/shared/lib/redux";

import { selectCurrentDate } from "./selectors";

export function useDayPlanQuery() {
  const date = useAppSelector(selectCurrentDate);
  const args = useMemo<DayArgs>(() => ({ date }), [date]);

  return useGetDayPlanQuery(args);
}
