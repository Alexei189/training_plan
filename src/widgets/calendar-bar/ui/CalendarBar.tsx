import { setDate } from "@/features/select-day";
import { getCurrentWeekShort } from "@/shared/lib/date";
import { useAppDispatch } from "@/shared/lib/redux";

import styles from "./CalendarBar.module.css";

function CalendarBar() {
  const days = getCurrentWeekShort();
  const dispatch = useAppDispatch();
  const handleClick = (day: string) => {
    dispatch(setDate(day));
  };

  return (
    <div className={styles.bar__body}>
      {days.map((day) => (
        <button
          onClick={() => handleClick(`${day.day} ${day.weekday}`)}
          className={styles.cell}
          key={day.day}
        >
          <span className={styles.cell__content}>
            <span>{day.day}</span>
            <span>{day.weekday}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default CalendarBar;
