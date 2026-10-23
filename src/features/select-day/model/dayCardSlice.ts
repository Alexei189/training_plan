import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface DayCardState {
  currentDate: string;
}

const initialState: DayCardState = {
  currentDate: "5 октября",
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
