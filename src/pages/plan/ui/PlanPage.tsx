import { CalendarBar } from "@/widgets/calendar-bar";
import { DayView } from "@/widgets/day-view";

import styles from "./PlanPage.module.css";

function PlanPage() {
  return (
    <div className={styles.root}>
      <div className={styles.body}>
        <CalendarBar />
        <DayView />
      </div>
    </div>
  );
}

export default PlanPage;
