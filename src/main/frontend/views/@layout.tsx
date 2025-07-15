import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { Button } from '@vaadin/react-components';
import { useEffect } from 'react';
import Font from 'react-font';
import './layout.css';
import { AuthProvider, useAuth } from 'Frontend/hooks/useAuth.js';
import { TagsProvider } from 'Frontend/hooks/useTags';

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
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Define which routes require authentication
  const protectedRoutes = ['/home', '/profile', '/exams/create'];
  
  // Navigation routes - show different options based on auth status
  const getNavRoutes = () => {
    const baseRoutes = [
      { path: '/exams', label: 'BROWSE EXAMS' },
    ];
    
    if (authenticated) {
      return [
        { path: '/home', label: 'HOME' },
        ...baseRoutes,
        { path: '/exams/create', label: 'CREATE EXAM' }
      ];
    }
    
    return baseRoutes;
  };

  // Handle redirects for protected routes only
  useEffect(() => {
    if (authInitialized && !loading && !authenticated) {
      // Only redirect if on a truly protected route
      const isProtectedRoute = protectedRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route + '/')
      );
      
      if (isProtectedRoute && currentPath !== '/login') {
        console.log('Layout: Unauthenticated user on protected route, redirecting to login');
        sessionStorage.setItem('redirectPath', currentPath);
        navigate('/login', { replace: true });
        return;
      }
    }
  }, [authenticated, authInitialized, loading, currentPath, navigate]);

  // For login route, render without layout
  if (currentPath === '/login') {
    return <Outlet />;
  }

  // Show loading while checking auth (only for protected routes)
  if (!authInitialized || loading) {
    const isProtectedRoute = protectedRoutes.some(route => 
      currentPath === route || currentPath.startsWith(route + '/')
    );
    
    if (isProtectedRoute) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }
  }

  // Let the @index.tsx handle the root path logic
  if (currentPath === '/') {
    return <Outlet />;
  }

  // Render main layout for all users (authenticated and anonymous)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="main-layout-root">
        <Font family='Montserrat'>
          <header className="main-header">
            <h1 className="main-title">EXAM VAULT</h1>
            <div className="main-header-controls">
              <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {getNavRoutes().map(({ path, label }) => (
                  <NavLink
                    key={path}
                    to={path}
                    style={
                      currentPath === path
                        ? {
                          textDecoration: 'none',
                          color: '#0A21C0',
                          fontWeight: 'bold',
                          padding: '0.25rem .5rem',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                        }
                        : {
                          textDecoration: 'none',
                          color: 'white',
                          fontWeight: 'normal',
                          padding: '0.25rem .5rem',
                          borderRadius: '4px',
                          backgroundColor: 'transparent',
                        }
                    }
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
                
                {/* Authentication controls - Profile picture removed */}
                {authenticated ? (
                  <div className="flex items-center ml-4">
                    <Button
                      onClick={() => logout('/')}
                      theme="tertiary small"
                      style={{ color: 'white', minHeight: '32px' }}
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <NavLink
                    to="/login"
                    style={{
                      textDecoration: 'none',
                      color: 'white',
                      fontWeight: 'normal',
                      padding: '0.25rem .5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      marginLeft: '1rem'
                    }}
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
          <main className="main-content">
            <TagsProvider>
            <Outlet />
            </TagsProvider>
          </main>
          <footer className="main-footer">
            <p>© 2025 Exam Vault</p>
            <a target='_blank' href='https://github.com/alex-d-howell/examvault'>
              <i>Developed by Alex Howell</i>
            </a>
          </footer>
        </Font>
      </div>
    </div>
  );
}