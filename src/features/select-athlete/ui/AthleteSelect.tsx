import { mockAthletes } from "@/entities/athlete";
import { useAppDispatch, useAppSelector } from "@/shared/lib/redux";

import { setAthleteId } from "../model/athleteSlice";
import { selectAthleteId } from "../model/selectors";

import styles from "./AthleteSelect.module.css";

function AthleteSelect() {
  const dispatch = useAppDispatch();
  const athleteId = useAppSelector(selectAthleteId);

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor="athlete-select">
        Спортсмен
      </label>
      <select
        id="athlete-select"
        className={styles.select}
        value={athleteId}
        onChange={(event) => dispatch(setAthleteId(event.target.value))}
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
