// @layout.tsx - REFACTORED VERSION (150 lines → 80 lines)
import { Outlet, NavLink, useNavigate } from 'react-router';
import { Button } from '@vaadin/react-components';
import Font from 'react-font';
import './layout.css';
import { AuthProvider, useAuth } from 'Frontend/hooks/useAuth';
import { TagsProvider } from 'Frontend/hooks/useTags';
import { useNavigation } from 'Frontend/hooks/useNavigation';
import { useAuthRedirect } from 'Frontend/hooks/useAuthRedirect';

// Main wrapper with AuthProvider
export default function MainLayout() {
  return (
    <AuthProvider>
      <LayoutContent />
    </AuthProvider>
  );
}

// Layout content that uses auth
function LayoutContent() {
  const { logout, authenticated, authInitialized, loading } = useAuth();
  const navigate = useNavigate();

  // Navigation logic
  const { currentPath, navRoutes, isProtectedRoute, shouldShowLayout } = useNavigation(authenticated);

  // Authentication redirect
  useAuthRedirect({ authenticated, authInitialized, loading, currentPath, isProtectedRoute });

  // For login route, render without layout
  if (currentPath === '/login') {
    return <Outlet data-testid="outlet" />;
  }

  // Show loading while checking auth (only for protected routes)
  if ((!authInitialized || loading) && isProtectedRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // handle root path logic in root
  if (currentPath === '/') {
    return <Outlet data-testid="outlet" />;
  }

  // Render main layout for all users (authenticated and anonymous)
  if (shouldShowLayout) {
    return (
      <div className="min-h-screen">
        <div className="main-layout-root">
          <Font family='Merriweather'>
            <HeaderComponent
              navRoutes={navRoutes}
              currentPath={currentPath}
              authenticated={authenticated}
              onSignOut={() => logout('/')}
              onSignIn={() => navigate('/login')}
            />
            <main className="main-content">
              <TagsProvider>
                <Outlet data-testid="outlet" />
              </TagsProvider>
            </main>
            <FooterComponent />
          </Font>
        </div>
      </div>
    );
  }

  return <Outlet data-testid="outlet" />;
}

const HeaderComponent = ({ navRoutes, authenticated, onSignOut }: {
  navRoutes: Array<{ path: string; label: string }>;
  currentPath: string;
  authenticated: boolean;
  onSignOut: () => void;
  onSignIn: () => void;
}) => (
  <header className="main-header">
      <h1 className="main-title">EXAM VAULT</h1>
    <div className="main-header-controls">
      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {Array.isArray(navRoutes) && navRoutes.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            className="main-nav-link"
          >
            {label}
          </NavLink>
        ))}

        {/* Authentication controls */}
        {authenticated ? (
          <div className="flex items-center m-sm ml-md">
            <Button
              onClick={onSignOut}
              theme="tertiary"
              className='signout'
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="main-nav-link"
          >
            SIGN IN
          </NavLink>
        )}
      </nav>
    </div>
  </header>
);

const FooterComponent = () => (
  <footer className="main-footer">
    <p>© 2025 Exam Vault</p>
    <a target='_blank' href='https://github.com/alex-d-howell/examvault'>
      <i>Developed by Alex Howell</i>
    </a>
  </footer>
);