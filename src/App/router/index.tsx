import { Route, Routes } from "react-router-dom";

import { PlanPage } from "@/pages/plan";
import { RecordsPage } from "@/pages/records";
import { TrainerPage } from "@/pages/trainer";

import { AppLayout } from "../layouts/AppLayout";

import { RoleGuard, RoleHomeRedirect } from "./RoleGuard";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<RoleHomeRedirect />} />
        <Route
          path="plan"
          element={
            <RoleGuard>
              <PlanPage />
            </RoleGuard>
          }
        />
        <Route
          path="records"
          element={
            <RoleGuard>
              <RecordsPage />
            </RoleGuard>
          }
        />
        <Route
          path="trainer"
          element={
            <RoleGuard>
              <TrainerPage />
            </RoleGuard>
          }
        />
        <Route path="*" element={<RoleHomeRedirect />} />
      </Route>
    </Routes>
  );
}
