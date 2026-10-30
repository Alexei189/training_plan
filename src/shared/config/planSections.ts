import type { CSSProperties } from "react";

export interface PlanSection {
  label: string;
  backgroundColor: CSSProperties["backgroundColor"];
}

export const planSections = {
  warmUp: {
    label: "Разминка",
    backgroundColor: "#F6E7C1",
  },
  main: {
    label: "Основная работа",
    backgroundColor: "#D6E6F6",
  },
  intervals: {
    label: "Интервальная работа",
    backgroundColor: "#F6D6D6",
  },
  stretch: {
    label: "Растяжка",
    backgroundColor: "#E8DCF6",
  },
  strength: {
    label: "Силовая",
    backgroundColor: "#D8EEDC",
  },
  coolDown: {
    label: "Заминка",
    backgroundColor: "#F0F0F0",
  },
  note: {
    label: "Примечание",
    backgroundColor: "#FFF3C4",
  },
} as const satisfies Record<string, PlanSection>;

export type PlanSectionKey = keyof typeof planSections;

export const planSectionKeys = Object.keys(planSections) as PlanSectionKey[];
