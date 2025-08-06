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
      <div className="min-h-screen bg-gray-50">
        <div className="main-layout-root">
          <Font family='Montserrat'>
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

const HeaderComponent = ({ navRoutes, currentPath, authenticated, onSignOut }: {
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
            style={currentPath === path ? activeNavStyle : inactiveNavStyle}
            className="main-nav-link"
            onMouseEnter={e => {
              if (currentPath !== path) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)';
                e.currentTarget.style.color = '#ffe066';
                e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(99,102,241,0.10)';
              }
            }}
            onMouseLeave={e => {
              if (currentPath !== path) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.boxShadow = '';
              }
            }}
          >
            {label}
          </NavLink>
        ))}

        {/* Authentication controls */}
        {authenticated ? (
          <div className="flex items-center ml-4">
            <Button
              onClick={onSignOut}
              theme="tertiary small"
              style={{ color: 'white', minHeight: '32px' }}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <NavLink
            to="/login"
            style={signInNavStyle}
            className="main-nav-link"
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = '#ffe066';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'white';
            }}
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

const activeNavStyle = {
  textDecoration: 'none' as const,
  color: '#0A21C0',
  fontWeight: 'bold' as const,
  padding: '0.25rem .5rem',
  borderRadius: '4px',
  backgroundColor: 'white',
};

const inactiveNavStyle = {
  textDecoration: 'none' as const,
  color: 'white',
  fontWeight: 'normal' as const,
  padding: '0.25rem .5rem',
  borderRadius: '4px',
  backgroundColor: 'transparent',
};

const signInNavStyle = {
  textDecoration: 'none' as const,
  color: 'white',
  fontWeight: 'normal' as const,
  padding: '0.25rem .5rem',
  borderRadius: '4px',
  backgroundColor: 'rgba(255,255,255,0.1)',
  marginLeft: '1rem'
};