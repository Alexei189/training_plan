import { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";

import { StoreProvider } from "./StoreProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <StoreProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </StoreProvider>
  );
}
