import { getDateString } from "@/shared/lib/date";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const todayISO: string = new Date().toISOString();

export interface DayCardState {
  currentDate: string;
  pendingDate: string | null;
}

const initialState: DayCardState = {
  currentDate: getDateString(),
  pendingDate: null,
};

const dayCardSlice = createSlice({
  name: "dayCard",
  initialState,
  reducers: {
    setDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
      state.pendingDate = null;
    },
    requestDate: (state, action: PayloadAction<string>) => {
      if (action.payload === state.currentDate) {
        return;
      }

      state.pendingDate = action.payload;
    },
    commitDate: (state) => {
      if (!state.pendingDate) {
        return;
      }

      state.currentDate = state.pendingDate;
      state.pendingDate = null;
    },
    cancelDateRequest: (state) => {
      state.pendingDate = null;
    },
  },
});

export const { setDate, requestDate, commitDate, cancelDateRequest } =
  dayCardSlice.actions;
export const dayCardReducer = dayCardSlice.reducer;
