export const smartDayActions = [
  { id: "ease", label: "Сделай этот день легче" },
  { id: "intervals", label: "Замени основную работу на интервалы" },
] as const;

export type SmartDayActionId = (typeof smartDayActions)[number]["id"];
