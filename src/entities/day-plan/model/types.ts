import type { PlanSectionKey } from "@/shared/config/planSections";

export interface DayData {
  date: string;
  athleteId: string;
  workoutName: string;
  plan: Plan;
}

export type Plan = Partial<Record<PlanSectionKey, string>>;

export interface DayArgs {
  date: string;
  athleteId: string;
}

export type SaveBuilderDayBody = {
  date: string;
  athleteId: string;
  workoutName: string;
  plan: Partial<Record<string, string>>;
};

export type SmartActionBody = {
  date: string;
  athleteId: string;
  action: string;
};
