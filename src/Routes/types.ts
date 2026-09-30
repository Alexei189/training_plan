import {
	ActionFunction,
	LoaderFunction,
	RouteObject,
	ShouldRevalidateFunction,
} from 'react-router-dom';

export type NavigationItem = {
	key: string;
	displayName: string;
	href: string;
	isActive?: boolean;
	children?: NavigationItem[];
	renderFn?: (
		navigationItem: NavigationItem,
		rootStyles?: Record<string, string>,
	) => React.ReactNode;
};

type InitialRouteItem = {
	path?: string;
	displayName: string;
	key: string;
	index?: boolean;
	element?: React.ReactNode | null;
	caseSensitive?: boolean;
	id?: string;
	errorElement?: React.ReactNode | null;
	handle?: RouteObject['handle'];
	children?: RouteItem[];
	loader?: LoaderFunction;
	action?: ActionFunction;
	shouldRevalidate?: ShouldRevalidateFunction;
	renderFn?: (
		navigationItem: NavigationItem,
		rootStyles?: Record<string, string>,
	) => React.ReactNode;
};
type NonIndexRouteItem = InitialRouteItem & {
	index?: false;
	children?: RouteItem[];
};
type IndexRouteItem = InitialRouteItem & {
	index?: true;
	children?: undefined;
};

export type RouteItem = NonIndexRouteItem | IndexRouteItem;

export enum RoutePath {
	Home = 'home',
	Handbooks = 'handbooks',
}

export default {};
