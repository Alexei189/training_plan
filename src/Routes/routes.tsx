import PageHome from '../Pages/PageHome';
import getTranslation from '../Shared/getTranslation';
import HomeLoader from '../Pages/PageHome/loader.router';
import { RouteItem, RoutePath } from './types';

const routes: RouteItem[] = [
	{
		index: true,
		displayName: getTranslation('homePageTitle'),
		key: RoutePath.Home,
		loader: HomeLoader,
		element: <PageHome />,
	},
];

export default routes;
