import { useMemo } from 'react';
import { useLocation } from 'react-router';

interface NavRoute {
  path: string;
  label: string;
}

interface UseNavigationReturn {
  currentPath: string;
  navRoutes: NavRoute[];
  isProtectedRoute: boolean;
  shouldShowLayout: boolean;
}

const PROTECTED_ROUTES = ['/home', '/profile', '/exams/create'];
const LAYOUT_EXCLUDED_ROUTES = ['/login'];

export const useNavigation = (authenticated: boolean): UseNavigationReturn => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navRoutes = useMemo(() => {
    const baseRoutes: NavRoute[] = [{ path: '/exams', label: 'BROWSE EXAMS' }];

    if (authenticated) {
      return [{ path: '/home', label: 'HOME' }, ...baseRoutes, { path: '/exams/create', label: 'CREATE EXAM' }];
    }

    return baseRoutes;
  }, [authenticated]);

  const isProtectedRoute = useMemo(() => {
    return PROTECTED_ROUTES.some((route) => currentPath === route || currentPath.startsWith(route + '/'));
  }, [currentPath]);

  const shouldShowLayout = useMemo(() => {
    return !LAYOUT_EXCLUDED_ROUTES.includes(currentPath) && currentPath !== '/';
  }, [currentPath]);

  return {
    currentPath,
    navRoutes,
    isProtectedRoute,
    shouldShowLayout,
  };
};
