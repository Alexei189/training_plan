import type { DayData } from "@/entities/day-plan";
import { type PlanSectionKey, planSectionKeys } from "@/shared/config/planSections";

export interface WeekDayDraft {
  workoutName: string;
  activeKeys: PlanSectionKey[];
  texts: Partial<Record<PlanSectionKey, string>>;
}

export function emptyWeekDraft(): WeekDayDraft {
  return {
    workoutName: "",
    activeKeys: [],
    texts: {},
  };
}

export function cloneWeekDraft(draft: WeekDayDraft): WeekDayDraft {
  return {
    workoutName: draft.workoutName,
    activeKeys: [...draft.activeKeys],
    texts: { ...draft.texts },
  };
}

export function draftFromDayData(data: DayData): WeekDayDraft {
  const plan = data.plan as Partial<Record<string, unknown>>;
  const activeKeys = planSectionKeys.filter(
    (key) => typeof plan[key] === "string",
  );
  const texts: WeekDayDraft["texts"] = {};

  for (const key of activeKeys) {
    texts[key] = plan[key] as string;
  }

  return {
    workoutName: data.workoutName,
    activeKeys,
    texts,
  };
}

export function draftHasRecord(draft: WeekDayDraft): boolean {
  return draft.workoutName !== "" || draft.activeKeys.length > 0;
}
