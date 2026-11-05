import type { SelectAthleteState } from "./athleteSlice";

type StateWithAthlete = {
  selectAthlete: SelectAthleteState;
};

export const selectAthleteId = (state: StateWithAthlete) =>
  state.selectAthlete.athleteId;
