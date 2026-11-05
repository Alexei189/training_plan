import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { mockAthletes } from "@/entities/athlete";

export interface SelectAthleteState {
  athleteId: string;
}

const initialState: SelectAthleteState = {
  athleteId: mockAthletes[0].id,
};

const selectAthleteSlice = createSlice({
  name: "selectAthlete",
  initialState,
  reducers: {
    setAthleteId: (state, action: PayloadAction<string>) => {
      state.athleteId = action.payload;
    },
  },
});

export const { setAthleteId } = selectAthleteSlice.actions;
export const selectAthleteReducer = selectAthleteSlice.reducer;
