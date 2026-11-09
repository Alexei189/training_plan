import { selectAthleteId } from "@/features/select-athlete";
import { selectCurrentDate, useDayPlanQuery } from "@/features/select-day";
import { planSectionKeys, planSections } from "@/shared/config/planSections";
import { getDateWithWeekDay } from "@/shared/lib/date";
import { useAppSelector } from "@/shared/lib/redux";
import { TextCard } from "@/shared/ui/text-card";

import styles from "./DayView.module.css";

function DayView() {
  const currentDate = useAppSelector(selectCurrentDate);
  const athleteId = useAppSelector(selectAthleteId);
  const { data } = useDayPlanQuery(athleteId);
  const workoutName = (data?.workoutName ?? "").trim();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>{getDateWithWeekDay(currentDate)}</div>
        {workoutName ? <div className={styles.title}>{workoutName}</div> : null}
      </div>
      <div className={styles.body}>
        {planSectionKeys.map(
          (key) =>
            data?.plan[key] && (
              <TextCard
                key={key}
                header={planSections[key].label}
                text={data?.plan[key]}
                backgroundColor={planSections[key].backgroundColor}
              />
            ),
        )}
      </div>
    </div>
  );
}

export default DayView;
