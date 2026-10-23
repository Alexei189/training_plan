import { DayCardState } from "./dayCardSlice";

type StateWithDayCard = {
  dayCard: DayCardState;
};

export const selectCurrentDate = (state: StateWithDayCard) =>
  state.dayCard.currentDate;
