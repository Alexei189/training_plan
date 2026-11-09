import { selectLeaveGuard } from "@/features/select-athlete";
import { requestDate, setDate } from "@/features/select-day";
import { getCurrentWeekShort } from "@/shared/lib/date";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import styles from "./CalendarBar.module.css";

function CalendarBar() {
  const days = getCurrentWeekShort();
  const dispatch = useAppDispatch();
  const leaveGuard = useAppSelector(selectLeaveGuard);
  const handleClick = (day: string) => {
    dispatch(leaveGuard ? requestDate(day) : setDate(day));
  };

  return (
    <div className={styles.bar__body}>
      {days.map((day) => (
        <button
          onClick={() => handleClick(day.date)}
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
