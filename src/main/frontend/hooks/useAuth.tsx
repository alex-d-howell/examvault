import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router';
import { UserService } from 'Frontend/generated/endpoints.js';
import UserDetails from 'Frontend/generated/com/howell/examvault/base/security/UserDetails';

export function authHook() {
    const [authenticated, setAuthenticated] = useState(false);
    const [user, setUser] = useState<UserDetails | null>(null);
    const [authInitialized, setAuthInitialized] = useState(false);
    const [loading, setLoading] = useState(true);

    // Use ref to track if auth check is in progress
    const isCheckingAuth = useRef(false);
    const navigate = useNavigate();

    const checkAuth = useCallback(async () => {

        // Prevent multiple simultaneous auth checks
        if (isCheckingAuth.current) {
            return;
        }

        try {
            isCheckingAuth.current = true;
            setLoading(true);

            // Check if user is authenticated using BrowserCallable
            const isAuthenticated = await UserService.isAuthenticated();

            if (isAuthenticated) {
                const userData = await UserService.getAuthenticatedUser();

                if (userData) {
                    setAuthenticated(true);
                    setUser(userData);
                } else {
                    setAuthenticated(false);
                    setUser(null);
                }
            } else {
                setAuthenticated(false);
                setUser(null);
            }

        } catch (error) {
            // Always default to unauthenticated on any error
            setAuthenticated(false);
            setUser(null);

        } finally {
            setLoading(false);
            setAuthInitialized(true);
            isCheckingAuth.current = false;
        }
    }, []);

    const logout = useCallback(async (redirect: string = '/login') => {
        try {
            setLoading(true);

            // Call Spring Security logout endpoint
            const response = await fetch('/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (response.ok || response.status === 404) {
                // 404 is okay - logout endpoint might not be configured
                setAuthenticated(false);
                setUser(null);
                setAuthInitialized(false);

                // Clear any stored redirect path
                sessionStorage.removeItem('redirectPath');

                // Use navigate instead of window.location.href
                navigate(redirect, { replace: true });
            } else {
                console.error('Logout failed:', response.status);
                // Still clear local state even if logout request failed
                setAuthenticated(false);
                setUser(null);
                navigate(redirect, { replace: true });
            }
        } catch (error) {
            console.error('Logout failed:', error);
            // Still clear local state even if logout request failed
            setAuthenticated(false);
            setUser(null);
            navigate(redirect, { replace: true });
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const refreshUserData = useCallback(async () => {
        if (authenticated && !isCheckingAuth.current) {
            try {
                const userData = await UserService.getAuthenticatedUser();
                setUser(userData || null);
            } catch (error) {
                console.error('Failed to refresh user data:', error);
                // If refresh fails, re-check authentication
                checkAuth();
            }
        }
    }, [authenticated, checkAuth]);

    // Initialize auth check only once
    useEffect(() => {
        if (!authInitialized && !isCheckingAuth.current) {
            checkAuth();
        }
    }, [checkAuth, authInitialized]);

    return {
        authenticated,
        authInitialized,
        user,
        loading,
        checkAuth,
        logout,
        refreshUserData,
    };
}

// Context
type AuthContextType = ReturnType<typeof authHook>;

const initialValue: AuthContextType = {
    authenticated: false,
    user: null,
    authInitialized: false,
    loading: true,
    checkAuth: async () => { },
    logout: async () => { },
    refreshUserData: async () => { },
};

const AuthContext = createContext<AuthContextType>(initialValue);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const auth = authHook();
    return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}