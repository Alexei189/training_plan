import { selectLeaveGuard } from "@/features/select-athlete";
import { requestDate, selectCurrentDate, setDate } from "@/features/select-day";
import { getWeekDates, shiftDate } from "@/shared/lib/date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import styles from "./CalendarBar.module.css";

const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function CalendarBar() {
  const dispatch = useAppDispatch();
  const currentDate = useAppSelector(selectCurrentDate);
  const leaveGuard = useAppSelector(selectLeaveGuard);
  const days = getWeekDates(currentDate);

  const openDate = (date: string) => {
    dispatch(leaveGuard ? requestDate(date) : setDate(date));
  };

  return (
    <div className={styles.bar__body}>
      <button
        type="button"
        className={styles.shift}
        onClick={() => openDate(shiftDate(currentDate, -7))}
      >
        Предыдущая неделя
      </button>
      {days.map((date, index) => (
        <button
          type="button"
          onClick={() => openDate(date)}
          className={styles.cell}
          key={date}
        >
          <span className={styles.cell__content}>
            <span>{Number(date.slice(8, 10))}</span>
            <span>{weekdayLabels[index]}</span>
          </span>
        </button>
      ))}
      <button
        type="button"
        className={styles.shift}
        onClick={() => openDate(shiftDate(currentDate, 7))}
      >
        Следующая неделя
      </button>
    </div>
  );
}

export default CalendarBar;
