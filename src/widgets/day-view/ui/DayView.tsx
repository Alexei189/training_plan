import { selectCurrentDate, useDayPlanQuery } from "@/features/select-day";
import { useAppSelector } from "@/shared/lib/redux";
import { getDateWithWeekDay } from "@/shared/lib/date";
import styles from "./DayView.module.css";

function DayView() {
  const currentDate = useAppSelector(selectCurrentDate);
  console.log(currentDate);
  const { data } = useDayPlanQuery();
  console.log(data);

  return (
    <div className={styles.root}>
      <div className={styles.header}>{getDateWithWeekDay(currentDate)}</div>
      <div className={styles.body}>,jl</div>
    </div>
  );
}

export default DayView;
