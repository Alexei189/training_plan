import routes from './routes';
import { NavigationItem } from './types';

const navigationMenu: NavigationItem[] = routes.map(
	({ path, index, displayName, key, renderFn }) =>
		({
			key,
			href: !index ? path : '/',
			displayName,
			renderFn,
		}) as NavigationItem,
);

export default navigationMenu;
