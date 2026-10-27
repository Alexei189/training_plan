export function getCurrentWeekShort() {
  const daysShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const today = new Date();
  const currentDayIndex = today.getDay();
  
  const offsetToMonday = currentDayIndex === 0 ? 6 : currentDayIndex - 1;
  
  const monday = new Date(today);
  monday.setDate(monday.getDate() - offsetToMonday);
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
  
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, "0");
    const date = String(day.getDate()).padStart(2, "0");
  
    week.push({
      day: day.getDate(),
      weekday: daysShort[i],
      date: `${year}-${month}-${date}`,
    });
  }
  
  return week;
}
