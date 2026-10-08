import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Описываем тип состояния
interface DayCardState {
  currentDate: string;
}

// Начальное состояние
const initialState: DayCardState = {
  currentDate: "5 октября",
};

const dayCardSlice = createSlice({
  name: "dayCard", // Имя слайса
  initialState,
  reducers: {
    // Экшены (методы изменения состояния)
    setDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
    },
  },
});

// Экспортируем экшены
export const { setDate } = dayCardSlice.actions;
// Экспортируем редьюсер
export default dayCardSlice.reducer;
