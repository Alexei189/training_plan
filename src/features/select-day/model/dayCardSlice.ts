import { getDateString } from "@/shared/lib/date";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const todayISO: string = new Date().toISOString();

export interface DayCardState {
  currentDate: string;
}

const initialState: DayCardState = {
  currentDate: getDateString(),
};

const dayCardSlice = createSlice({
  name: "dayCard",
  initialState,
  reducers: {
    setDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
    },
  },
});

export const { setDate } = dayCardSlice.actions;
export const dayCardReducer = dayCardSlice.reducer;
