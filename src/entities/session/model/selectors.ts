import type { SessionState } from "./sessionSlice";

type StateWithSession = {
  session: SessionState;
};

export const selectRole = (state: StateWithSession) => state.session.role;
