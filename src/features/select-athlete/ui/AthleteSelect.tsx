import { mockAthletes } from "@/entities/athlete";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import { requestAthleteId, setAthleteId } from "../model/athleteSlice";
import { selectAthleteId, selectLeaveGuard } from "../model/selectors";

import styles from "./AthleteSelect.module.css";

function AthleteSelect() {
  const dispatch = useAppDispatch();
  const athleteId = useAppSelector(selectAthleteId);
  const leaveGuard = useAppSelector(selectLeaveGuard);

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor="athlete-select">
        Спортсмен
      </label>
      <select
        id="athlete-select"
        className={styles.select}
        value={athleteId}
        onChange={(event) => {
          const nextId = event.target.value;
          dispatch(leaveGuard ? requestAthleteId(nextId) : setAthleteId(nextId));
        }}
      >
        {mockAthletes.map((athlete) => (
          <option key={athlete.id} value={athlete.id}>
            {athlete.fullName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default AthleteSelect;
