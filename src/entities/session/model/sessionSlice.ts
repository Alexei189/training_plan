import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { Role } from "@/shared/config/roles";

import { readStoredRole } from "./storage";

export interface SessionState {
  role: Role;
}

const initialState: SessionState = {
  role: readStoredRole(),
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setRole: (state, action: PayloadAction<Role>) => {
      state.role = action.payload;
    },
  },
});

export const { setRole } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
