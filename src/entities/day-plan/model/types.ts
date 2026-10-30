import type { PlanSectionKey } from "@/shared/config/planSections";

export interface DayData {
  date: string;
  plan: Plan;
}

export type Plan = Partial<Record<PlanSectionKey, string>>;
export interface DayArgs {
  date: string;
}
