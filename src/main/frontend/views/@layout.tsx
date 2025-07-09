import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { Button } from '@vaadin/react-components';
import { useEffect } from 'react';
import Font from 'react-font';
import './layout.css';
import { AuthProvider, useAuth } from 'Frontend/hooks/useAuth.js';

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
  const { user, logout, authenticated, authInitialized, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navRoutes = [
    { path: '/home', label: 'HOME' },
    { path: '/exams', label: 'BROWSE EXAMS' },
    { path: '/exams/create', label: 'CREATE EXAM' }
  ];

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    // Only process redirects for truly protected routes (not root transitions)
    // Give the root index component time to handle its redirect first
    if (authInitialized && !loading && !authenticated) {
      
      // Only redirect if we're on a protected route that's not root or login
      if (currentPath !== '/login' && currentPath !== '/' && 
          (currentPath.startsWith('/home') || currentPath.startsWith('/exams'))) {
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

  // Show loading while checking auth
  if (!authInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message for unauthenticated users (while redirect is happening)
  if (!authenticated && currentPath !== '/') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-yellow-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Let the @index.tsx handle the root path logic
  if (currentPath === '/') {
    return <Outlet />;
  }

  // Render main layout for authenticated users on non-root paths
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Welcome!
        </h1>

        {user && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <img
                src={user.profilePictureUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {user.name}
                </h2>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => logout()}
                theme="primary error"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="main-layout-root">
        <Font family='Montserrat'>
          <header className="main-header">
            <h1 className="main-title">EXAM VAULT</h1>
            <div className="main-header-controls">
              <nav style={{ display: 'flex', gap: '1rem' }}>
                {navRoutes.map(({ path, label }) => (
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
              </nav>
            </div>
          </header>
          <main className="main-content">
            <Outlet />
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