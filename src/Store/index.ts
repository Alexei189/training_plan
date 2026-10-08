import { configureStore } from "@reduxjs/toolkit";
import dayCardSlice from "./dayCard";

export const store = configureStore({
  reducer: {
    dayCard: dayCardSlice,
    // Сюда добавляйте другие редьюсеры по мере роста проекта
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
