import { log } from "console";
import styles from "./CalendarBar.module.css";
import { getCurrentWeekShort } from "../../Utils/getDateCalendarBar";
import { useAppDispatch } from "../../Store/hooks";
import { setDate } from "../../Store/dayCard";

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
