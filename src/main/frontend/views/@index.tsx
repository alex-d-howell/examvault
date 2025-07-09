// Frontend/views/@index.tsx
// This handles the root route "/"

import { useAuth } from 'Frontend/hooks/useAuth.js';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

export default function RootIndex() {
    const { authenticated, authInitialized, loading } = useAuth();
    const navigate = useNavigate();
    const hasRedirected = useRef(false);
    
    console.log('=== ROOT INDEX: Auth state ===', { authenticated, authInitialized, loading });

    useEffect(() => {
        // Only redirect when auth is fully determined and haven't redirected yet
        if (authInitialized && !loading && !hasRedirected.current) {
            hasRedirected.current = true;
            console.log('Root index: Redirecting based on auth state...');
            
            if (authenticated) {
                // Check for stored redirect path first
                const redirectPath = sessionStorage.getItem('redirectPath');
                if (redirectPath && redirectPath !== '/login' && redirectPath !== '/') {
                    console.log('Using stored redirect path:', redirectPath);
                    sessionStorage.removeItem('redirectPath');
                    navigate(redirectPath, { replace: true });
                } else {
                    console.log('Authenticated user at root, redirecting to /home');
                    navigate('/home', { replace: true });
                }
            } else {
                console.log('Unauthenticated user at root, redirecting to /login');
                // Set default redirect for after login
                sessionStorage.setItem('redirectPath', '/home');
                navigate('/login', { replace: true });
            }
        }
    }, [authenticated, authInitialized, loading, navigate]);

    // Show loading while determining what to do
    return (
        <div className="flex items-center justify-center min-h-screen bg-blue-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-700">Determining destination...</p>
                <p className="text-xs text-gray-500 mt-1">
                    Auth: {authInitialized ? 'ready' : 'loading'} | 
                    User: {authenticated ? 'authenticated' : 'not authenticated'}
                </p>
            </div>
        </div>
    );
}