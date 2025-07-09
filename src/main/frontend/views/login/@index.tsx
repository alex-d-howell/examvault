import { useAuth } from 'Frontend/hooks/useAuth.js';
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';

export default function LoginView() {
    const { authenticated, authInitialized, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Only handle redirect once auth is initialized and we have a definitive authenticated state
        if (authInitialized && !loading && authenticated && !hasRedirected.current) {
            hasRedirected.current = true;
            
            console.log('User authenticated in login, handling redirect...');
            
            // Check for redirect path in multiple places
            const urlParams = new URLSearchParams(location.search);
            const urlRedirectPath = urlParams.get('redirect');
            const sessionRedirectPath = sessionStorage.getItem('redirectPath');
            
            const redirectPath = urlRedirectPath || sessionRedirectPath;
            
            if (redirectPath && redirectPath !== '/login' && redirectPath !== '/') {
                console.log('Using redirect path:', redirectPath);
                sessionStorage.removeItem('redirectPath');
                navigate(redirectPath, { replace: true });
            } else {
                console.log('No redirect path found, going to home');
                navigate('/home', { replace: true }); // Fixed: was '/' now '/home'
            }
        }
    }, [authenticated, authInitialized, loading, navigate, location.search]);

    // Show loading while determining auth state
    if (!authInitialized || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // If authenticated, show redirect message
    if (authenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Redirecting...</p>
                </div>
            </div>
        );
    }

    // Parse URL parameters to check for errors
    const urlParams = new URLSearchParams(location.search);
    const hasError = urlParams.get('error') === 'true';

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Use your Google account to get started
                    </p>
                </div>
                
                {hasError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="text-sm text-red-700">
                            Authentication failed. Please try again.
                        </div>
                    </div>
                )}
                
                <div className="mt-8 space-y-6">
                    {/* Use button with window.location.href for reliable OAuth2 flow */}
                    <button
                        onClick={() => {
                            console.log('Initiating OAuth2 flow...');
                            window.location.href = '/oauth2/authorization/google';
                        }}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                    </button>
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        By signing in, you agree to our terms of service and privacy policy.
                    </p>
                </div>
            </div>
        </div>
    );
}