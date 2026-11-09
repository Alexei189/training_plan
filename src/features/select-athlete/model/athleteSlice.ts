import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { mockAthletes } from "@/entities/athlete";

export interface SelectAthleteState {
  athleteId: string;
  pendingAthleteId: string | null;
  leaveGuard: boolean;
}

const initialState: SelectAthleteState = {
  athleteId: mockAthletes[0].id,
  pendingAthleteId: null,
  leaveGuard: false,
};

const selectAthleteSlice = createSlice({
  name: "selectAthlete",
  initialState,
  reducers: {
    setAthleteId: (state, action: PayloadAction<string>) => {
      state.athleteId = action.payload;
      state.pendingAthleteId = null;
    },
    requestAthleteId: (state, action: PayloadAction<string>) => {
      if (action.payload === state.athleteId) {
        return;
      }

      state.pendingAthleteId = action.payload;
    },
    commitAthlete: (state) => {
      if (!state.pendingAthleteId) {
        return;
      }

      state.athleteId = state.pendingAthleteId;
      state.pendingAthleteId = null;
    },
    cancelAthleteRequest: (state) => {
      state.pendingAthleteId = null;
    },
    setLeaveGuard: (state, action: PayloadAction<boolean>) => {
      state.leaveGuard = action.payload;
    },
  },
});

export const {
  setAthleteId,
  requestAthleteId,
  commitAthlete,
  cancelAthleteRequest,
  setLeaveGuard,
} = selectAthleteSlice.actions;
export const selectAthleteReducer = selectAthleteSlice.reducer;
