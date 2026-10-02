import CalendarBar from "../../Components/CalendarBar";
import DayView from "../../Components/DayView";
import TitleBar from "../../UiKit/TitleBar/TitleBar";
import styles from "./PagePlan.module.css";
function PagePlan() {
  return (
    <div className={styles.root}>
      <TitleBar />
      <div className={styles.body}>
        <CalendarBar />
        <DayView />
      </div>
    </div>
  );
}
export default PagePlan;
