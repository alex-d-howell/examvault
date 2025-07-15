import { useAuth } from 'Frontend/hooks/useAuth.js';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@vaadin/react-components';
import { Icon } from '@vaadin/react-components';

export default function RootView() {
    const { authenticated, authInitialized, loading } = useAuth();
    const navigate = useNavigate();
    const hasRedirected = useRef(false);

    // Redirect authenticated users to their dashboard
    useEffect(() => {
        if (authInitialized && !loading && authenticated && !hasRedirected.current) {
            hasRedirected.current = true;
            console.log('Authenticated user at root, redirecting to /home');
            
            // Check for stored redirect path first
            const redirectPath = sessionStorage.getItem('redirectPath');
            if (redirectPath && redirectPath !== '/login' && redirectPath !== '/') {
                console.log('Using stored redirect path:', redirectPath);
                sessionStorage.removeItem('redirectPath');
                navigate(redirectPath, { replace: true });
            } else {
                navigate('/home', { replace: true });
            }
        }
    }, [authenticated, authInitialized, loading, navigate]);

    // Show loading while determining auth state
    if (!authInitialized || loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f9fafb'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '2rem',
                        height: '2rem',
                        border: '2px solid #e5e7eb',
                        borderTop: '2px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 0.5rem'
                    }}></div>
                    <p style={{ color: '#6b7280' }}>Loading Exam Vault...</p>
                </div>
            </div>
        );
    }

    // Landing page for anonymous users only
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
        }}>
            {/* Hero Section */}
            <div style={{ overflow: 'hidden' }}>
                <div style={{
                    maxWidth: '80rem',
                    margin: '0 auto',
                    padding: '6rem 1rem',
                    textAlign: 'center'
                }}>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1
                    }}>
                        Welcome to <span style={{ color: '#3b82f6' }}>Exam Vault</span>
                    </h1>
                    
                    <p style={{
                        fontSize: '1.25rem',
                        color: '#6b7280',
                        marginBottom: '2rem',
                        maxWidth: '48rem',
                        margin: '0 auto 2rem'
                    }}>
                        Access thousands of practice exams, test your knowledge, and track your progress. 
                        No account required to get started!
                    </p>
                    
                    <div style={{
                        display: 'flex',
                        flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                        gap: '1rem',
                        justifyContent: 'center',
                        marginBottom: '4rem'
                    }}>
                        <Button
                            onClick={() => navigate('/exams')}
                            theme="primary large"
                            style={{
                                padding: '1rem 2rem',
                                fontSize: '1.125rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Icon icon="vaadin:book" />
                            Browse Exams
                        </Button>
                        
                        <Button
                            onClick={() => navigate('/login')}
                            theme="secondary large"
                            style={{
                                padding: '1rem 2rem',
                                fontSize: '1.125rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Icon icon="vaadin:sign-in" />
                            Sign In with Google
                        </Button>
                    </div>

                    {/* Feature Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
                        gap: '2rem',
                        maxWidth: '64rem',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '1rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e5e7eb',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        }}>
                            <div style={{
                                width: '4rem',
                                height: '4rem',
                                backgroundColor: '#dbeafe',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <Icon icon="vaadin:book" style={{ width: '2rem', height: '2rem', color: '#3b82f6' }} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                                Browse Freely
                            </h3>
                            <p style={{ color: '#6b7280' }}>
                                Explore our exam library without creating an account. Find the perfect practice test for your needs.
                            </p>
                        </div>
                        
                        <div style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '1rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e5e7eb',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        }}>
                            <div style={{
                                width: '4rem',
                                height: '4rem',
                                backgroundColor: '#dcfce7',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <Icon icon="vaadin:play-circle" style={{ width: '2rem', height: '2rem', color: '#16a34a' }} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                                Take Practice Tests
                            </h3>
                            <p style={{ color: '#6b7280' }}>
                                Jump right into practice exams. No registration barriers between you and your learning goals.
                            </p>
                        </div>
                        
                        <div style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '1rem',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e5e7eb',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                        }}>
                            <div style={{
                                width: '4rem',
                                height: '4rem',
                                backgroundColor: '#e9d5ff',
                                borderRadius: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <Icon icon="vaadin:chart-line" style={{ width: '2rem', height: '2rem', color: '#9333ea' }} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                                Track Progress
                            </h3>
                            <p style={{ color: '#6b7280' }}>
                                Sign in to save your progress, create custom exams, and access personalized features.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sign In Benefits */}
            <div style={{ backgroundColor: 'white', padding: '4rem 0' }}>
                <div style={{
                    maxWidth: '64rem',
                    margin: '0 auto',
                    padding: '0 1rem',
                    textAlign: 'center'
                }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '2rem'
                    }}>
                        Why create an account?
                    </h2>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
                        gap: '2rem',
                        marginBottom: '3rem'
                    }}>
                        {[
                            { icon: 'vaadin:check-circle', title: 'Save Your Results', desc: 'Track your exam scores and see your improvement over time.' },
                            { icon: 'vaadin:plus-circle', title: 'Create Custom Exams', desc: 'Build and share your own practice tests with the community.' },
                            { icon: 'vaadin:chart', title: 'Personal Dashboard', desc: 'Access your exam history, created tests, and performance analytics.' },
                            { icon: 'vaadin:star', title: 'Personalized Experience', desc: 'Get recommendations based on your interests and performance.' }
                        ].map((feature, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem',
                                textAlign: 'left'
                            }}>
                                <Icon 
                                    icon={feature.icon} 
                                    style={{ 
                                        width: '1.5rem', 
                                        height: '1.5rem', 
                                        color: '#16a34a', 
                                        marginTop: '0.25rem',
                                        flexShrink: 0
                                    }} 
                                />
                                <div>
                                    <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                                        {feature.title}
                                    </h4>
                                    <p style={{ color: '#6b7280' }}>{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <Button
                        onClick={() => navigate('/login')}
                        theme="primary large"
                        style={{
                            padding: '1rem 2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            margin: '0 auto'
                        }}
                    >
                        <Icon icon="vaadin:sign-in" />
                        Get Started - It's Free!
                    </Button>
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
}