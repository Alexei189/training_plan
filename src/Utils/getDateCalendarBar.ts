export function getCurrentWeekShort() {
  const daysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const today = new Date();
  const currentDayIndex = today.getDay();

  // Смещение, чтобы начать с понедельника
  const offsetToMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

  const monday = new Date(today);
  monday.setDate(monday.getDate() - offsetToMonday);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);

    week.push({
      day: day.getDate(), // только число (например, 14)
      weekday: daysShort[i], // две буквы (Пн, Вт и т.д.)
    });
  }

  return week;
}
