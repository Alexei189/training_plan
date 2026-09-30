import { createHashRouter as createRouter } from 'react-router-dom';
import appLoader from '../App/loader.router';
import App from '../App';
import routes from './routes';
import PageError from '../Pages/PageError';

const router = createRouter([
	{
		path: '/',
		element: <App />,
		loader: appLoader,
		errorElement: <PageError />,
		children: routes,
	},
]);

export default router;
