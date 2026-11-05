import { configureStore } from "@reduxjs/toolkit";

import { selectAthleteReducer } from "@/features/select-athlete";
import { dayCardReducer } from "@/features/select-day/model/dayCardSlice";
import { persistRole, sessionReducer } from "@/entities/session";
import { baseApi } from "@/shared/api";

import "@/entities/day-plan";

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    dayCard: dayCardReducer,
    selectAthlete: selectAthleteReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

store.subscribe(() => {
  persistRole(store.getState().session.role);
});
