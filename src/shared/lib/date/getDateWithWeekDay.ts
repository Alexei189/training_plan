const WEEKDAYS_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'] as const;

export function getDateWithWeekDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) throw new Error(`Некорректная дата: ${date}`);
  return `${d} ${WEEKDAYS_RU[dt.getDay()]}`;
}

