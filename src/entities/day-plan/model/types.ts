import type { PlanSectionKey } from "@/shared/config/planSections";

export interface DayData {
  date: string;
  workoutName: string;
  plan: Plan;
}

export type Plan = Partial<Record<PlanSectionKey, string>>;

export interface DayArgs {
  date: string;
}

export type SaveBuilderDayBody = {
  date: string;
  athleteId: string;
  workoutName: string;
  sections: Partial<Record<PlanSectionKey, string>>;
};
