import { useEffect, useRef } from "react";

import { selectAthleteId } from "@/features/select-athlete";
import { setDate } from "@/features/select-day";
import { getDateString } from "@/shared/lib/date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

export function useReturnToCurrentWeek() {
  const athleteId = useAppSelector(selectAthleteId);
  const dispatch = useAppDispatch();
  const previousAthleteId = useRef(athleteId);

  useEffect(() => {
    if (previousAthleteId.current === athleteId) {
      return;
    }

    previousAthleteId.current = athleteId;
    dispatch(setDate(getDateString()));
  }, [athleteId, dispatch]);
}
