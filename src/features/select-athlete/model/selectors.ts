import type { SelectAthleteState } from "./athleteSlice";

type StateWithAthlete = {
  selectAthlete: SelectAthleteState;
};

export const selectAthleteId = (state: StateWithAthlete) =>
  state.selectAthlete.athleteId;

export const selectPendingAthleteId = (state: StateWithAthlete) =>
  state.selectAthlete.pendingAthleteId;

export const selectLeaveGuard = (state: StateWithAthlete) =>
  state.selectAthlete.leaveGuard;
