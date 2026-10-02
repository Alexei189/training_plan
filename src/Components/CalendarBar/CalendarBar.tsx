import { log } from "console";
import styles from "./CalendarBar.module.css";
import { getCurrentWeekShort } from "../../Utils/getDateCalendarBar";

function CalendarBar() {
  const days = getCurrentWeekShort();

  const handleClick = (day) => console.log(day);

  return (
    <div className={styles.bar__body}>
      {days.map((day) => (
        <button
          onClick={() => handleClick(day)}
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
