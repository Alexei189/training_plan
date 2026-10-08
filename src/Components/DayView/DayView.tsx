import styles from "./DayView.module.css";
import { useAppSelector } from "../../Store/hooks";
function DayView() {
  const { currentDate } = useAppSelector((state) => state.dayCard);
  return (
    <div className={styles.root}>
      <div className={styles.header}>{currentDate}</div>
      <div className={styles.body}>,jlb</div>
    </div>
  );
}

export default DayView;
