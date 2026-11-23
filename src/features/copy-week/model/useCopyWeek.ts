import { useEffect, useRef, useState } from "react";

import { dayPlanApi, useGetDayPlanQuery, type DayData } from "@/entities/day-plan";
import { useAppDispatch } from "@/shared/lib/redux";

import {
  cloneWeekDraft,
  draftFromDayData,
  draftHasRecord,
  type WeekDayDraft,
} from "./weekDraft";

interface CopyWeekArgs {
  athleteId: string;
  dates: readonly string[];
  draftAt: (date: string) => WeekDayDraft | null;
}

function readError(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string" &&
      data.message.length > 0
    ) {
      return data.message;
    }
  }

  return "Не удалось скопировать неделю";
}

export function useCopyWeek({ athleteId, dates, draftAt }: CopyWeekArgs) {
  const dispatch = useAppDispatch();
  const [buffer, setBuffer] = useState<WeekDayDraft[] | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const generation = useRef(0);
  const copyingRef = useRef(false);
  const datesKey = dates.join("|");
  const knownDrafts = dates.map((date) => draftAt(date));
  const first = useGetDayPlanQuery(
    { date: dates[0] ?? "", athleteId },
    { skip: !dates[0] || knownDrafts[0] !== null },
  );
  const second = useGetDayPlanQuery(
    { date: dates[1] ?? "", athleteId },
    { skip: !dates[1] || knownDrafts[1] !== null },
  );
  const third = useGetDayPlanQuery(
    { date: dates[2] ?? "", athleteId },
    { skip: !dates[2] || knownDrafts[2] !== null },
  );
  const fourth = useGetDayPlanQuery(
    { date: dates[3] ?? "", athleteId },
    { skip: !dates[3] || knownDrafts[3] !== null },
  );
  const fifth = useGetDayPlanQuery(
    { date: dates[4] ?? "", athleteId },
    { skip: !dates[4] || knownDrafts[4] !== null },
  );
  const sixth = useGetDayPlanQuery(
    { date: dates[5] ?? "", athleteId },
    { skip: !dates[5] || knownDrafts[5] !== null },
  );
  const seventh = useGetDayPlanQuery(
    { date: dates[6] ?? "", athleteId },
    { skip: !dates[6] || knownDrafts[6] !== null },
  );
  const queries = [first, second, third, fourth, fifth, sixth, seventh];
  const knownRecord = knownDrafts.some((draft, index) => {
    if (draft) {
      return draftHasRecord(draft);
    }

    const query = queries[index];

    return query.isSuccess && draftHasRecord(draftFromDayData(query.data));
  });

  useEffect(() => {
    return () => {
      generation.current += 1;
    };
  }, [athleteId, datesKey]);

  const copyWeek = async () => {
    if (copyingRef.current) {
      return;
    }

    const requestGeneration = generation.current;
    const requestAthleteId = athleteId;
    const requestDates = [...dates];
    const locals = requestDates.map((date) => draftAt(date));

    if (locals.every((draft) => draft !== null && !draftHasRecord(draft))) {
      return;
    }

    copyingRef.current = true;
    setIsCopying(true);

    try {
      const slots: WeekDayDraft[] = [];

      for (let index = 0; index < requestDates.length; index += 1) {
        const local = locals[index];

        if (local) {
          slots.push(cloneWeekDraft(local));
          continue;
        }

        const data = await dispatch(
          dayPlanApi.endpoints.getDayPlan.initiate({
            date: requestDates[index],
            athleteId: requestAthleteId,
          }),
        ).unwrap();

        slots.push(draftFromDayData(data as DayData));
      }

      if (
        generation.current !== requestGeneration ||
        !slots.some(draftHasRecord)
      ) {
        return;
      }

      setBuffer(slots);
    } catch (error) {
      if (generation.current !== requestGeneration) {
        return;
      }

      // TODO: replace with Toast
      alert(readError(error));
    } finally {
      copyingRef.current = false;
      setIsCopying(false);
    }
  };

  const pasteWeek = () => {
    if (!buffer) {
      return null;
    }

    return buffer.map(cloneWeekDraft);
  };

  return {
    copyWeek,
    pasteWeek,
    hasWeek: buffer !== null,
    isCopying,
    canCopy: knownRecord && !isCopying,
  };
}
