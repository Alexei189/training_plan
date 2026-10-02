import getTranslation from "../Shared/getTranslation";
import HomeLoader from "../Pages/PageHome/loader.router";
import { RouteItem, RoutePath } from "./types";
import PagePlan from "../Pages/PagePlan";

const routes: RouteItem[] = [
  {
    index: true,
    displayName: getTranslation("homePageTitle"),
    key: RoutePath.Home,
    loader: HomeLoader,
    element: <PagePlan />,
  },
];

export default routes;
