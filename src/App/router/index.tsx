import { Navigate, Route, Routes } from "react-router-dom";

import { PlanPage } from "@/pages/plan";
import { RecordsPage } from "@/pages/records";
import { TrainerPage } from "@/pages/trainer";
import { appRoutes } from "@/shared/config/routes";

import { AppLayout } from "../layouts/AppLayout";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to={appRoutes.plan} replace />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="trainer" element={<TrainerPage />} />
      </Route>
    </Routes>
  );
}
