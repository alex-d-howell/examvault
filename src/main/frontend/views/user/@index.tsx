import { useAuth } from 'Frontend/hooks/useAuth.js';
import { UserService } from 'Frontend/generated/endpoints.js';
import { useState, useEffect } from 'react';
import UserDetails from 'Frontend/generated/com/howell/examvault/base/security/UserDetails';
import { Button } from '@vaadin/react-components';

export default function ProfileView() {
    const { user: contextUser, refreshUserData } = useAuth();
    const [user, setUser] = useState<UserDetails | null>(contextUser);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refresh user profile data using the protected BrowserCallable method
    const refreshProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // This will call the protected getUserProfile method
            const userData = await UserService.getAuthenticatedUser();
            setUser(userData || null);
            
            // Also refresh the auth context
            await refreshUserData();
        } catch (err) {
            setError('Failed to refresh profile data');
            console.error('Profile refresh failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setUser(contextUser);
    }, [contextUser]);

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Profile
                    </h1>
                    <Button
                        onClick={refreshProfile}
                        theme="secondary"
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Profile'}
                    </Button>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                {user && (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-6">
                            <img
                                src={user.profilePictureUrl}
                                alt={user.name}
                                className="w-24 h-24 rounded-full"
                                referrerPolicy="no-referrer"
                            />
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {user.name}
                                </h2>
                                <p className="text-gray-600">{user.email}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    User ID: {user.subject}
                                </p>
                            </div>
                        </div>
                        
                        <div className="pt-6 border-t">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Account Information
                            </h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        Full name
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {user.name}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        Email address
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {user.email}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">
                                        Google Subject ID
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                                        {user.subject}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}