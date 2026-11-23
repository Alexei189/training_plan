import { getDateString } from "./getDateString";

function parseDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDate(date: string, days: number): string {
  const value = parseDate(date);
  value.setDate(value.getDate() + days);
  return getDateString(value);
}

export function getWeekDates(date: string): string[] {
  const value = parseDate(date);
  const offsetToMonday = value.getDay() === 0 ? 6 : value.getDay() - 1;
  const monday = new Date(value);
  monday.setDate(value.getDate() - offsetToMonday);

  return Array.from({ length: 7 }, (_, index) => shiftDate(getDateString(monday), index));
}
