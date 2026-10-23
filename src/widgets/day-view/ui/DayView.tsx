import { selectCurrentDate, useDayPlanQuery } from "@/features/select-day";
import { useAppSelector } from "@/shared/lib/redux";

import styles from "./DayView.module.css";

function DayView() {
  const currentDate = useAppSelector(selectCurrentDate);
  const { data } = useDayPlanQuery();
  console.log(data);

  return (
    <div className={styles.root}>
      <div className={styles.header}>{currentDate}</div>
      <div className={styles.body}>,jlb</div>
    </div>
  );
}

export default DayView;
