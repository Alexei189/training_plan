// features/orders/useOrdersQueryWithStore.ts
import { useMemo } from "react";
import { useAppSelector } from "../Store/hooks";
import { DayArgs } from "../API/trainingPlanApi/types";
import { useGetDayPlanQuery } from "../API/trainingPlanApi/dayPlan";

export function useOrdersQueryWithStore() {
  const date = useAppSelector((state) => state.dayCard.currentDate);

  const args = useMemo<DayArgs>(() => ({ date }), [date]);

  return useGetDayPlanQuery(args);
}
