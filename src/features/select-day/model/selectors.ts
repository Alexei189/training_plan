import { DayCardState } from "./dayCardSlice";

type StateWithDayCard = {
  dayCard: DayCardState;
};

export const selectCurrentDate = (state: StateWithDayCard) =>
  state.dayCard.currentDate;

export const selectPendingDate = (state: StateWithDayCard) =>
  state.dayCard.pendingDate;
