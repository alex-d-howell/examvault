import { useAuth } from 'Frontend/hooks/useAuth.js';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@vaadin/react-components';
import { Icon } from '@vaadin/react-components';
import { ExamService } from 'Frontend/generated/endpoints.js';
import './home.css';

export default function HomeView() {
    const { authenticated, authInitialized, loading, user } = useAuth();
    const navigate = useNavigate();
    const [recentExams, setRecentExams] = useState<any[]>([]);
    const [myExams, setMyExams] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (authInitialized && !loading && !authenticated) {
            console.log('User not authenticated, redirecting to root');
            navigate('/');
        }
    }, [authenticated, authInitialized, loading, navigate]);

    // Load user-specific data
    useEffect(() => {
        if (authenticated && authInitialized && !loading) {
            loadUserData();
        }
    }, [authenticated, authInitialized, loading]);

    const loadUserData = async () => {
        setLoadingData(true);
        try {
            // Load recent exams and user's created exams
            const [allExams, userExams] = await Promise.all([
                ExamService.getAllExams(),
                ExamService.getMyExams()
            ]);
            
            // Get the 6 most recent exams for browsing
            const recent = allExams?.slice(-6).reverse();
            setRecentExams(recent!);
            setMyExams(userExams || []);
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoadingData(false);
        }
    };

    // Show loading while checking auth
    if (!authInitialized || loading) {
        return (
            <div className="home-loading">
                <div className="home-loading-content">
                    <div className="home-spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Redirect message for unauthenticated users
    if (!authenticated) {
        return (
            <div className="home-loading">
                <div className="home-loading-content">
                    <div className="home-spinner"></div>
                    <p>Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            {/* Welcome Header */}
            <div className="home-welcome-card">
                <div className="home-welcome-content">
                    <div className="home-user-info">
                        <img
                            src={user?.profilePictureUrl}
                            alt={user?.name}
                            className="home-avatar"
                            referrerPolicy="no-referrer"
                        />
                        <div>
                            <h1 className="home-welcome-title">
                                Welcome back, {user?.name?.split(' ')[0]}!
                            </h1>
                            <p className="home-welcome-subtitle">Ready to create or take some exams?</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate('/exams/create')}
                        theme="primary"
                        className="home-create-btn"
                    >
                        <Icon icon="vaadin:plus" />
                        Create New Exam
                    </Button>
                </div>
            </div>

            <div className="home-grid">
                {/* Quick Stats */}
                <div className="home-sidebar">
                    <div className="home-stats-card">
                        <h2 className="home-section-title">Quick Stats</h2>
                        <div className="home-stats-content">
                            <div className="home-stat-item">
                                <span className="home-stat-label">Exams Created</span>
                                <span className="home-stat-value home-stat-value-blue">
                                    {loadingData ? '...' : myExams.length}
                                </span>
                            </div>
                            <div className="home-stat-item">
                                <span className="home-stat-label">Total Available</span>
                                <span className="home-stat-value home-stat-value-green">
                                    {loadingData ? '...' : recentExams.length}
                                </span>
                            </div>
                        </div>
                        
                        <div className="home-quick-actions">
                            <Button
                                onClick={() => navigate('/exams')}
                                theme="secondary"
                                className="home-action-btn"
                            >
                                Browse All Exams
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="home-main-content">
                    <div className="home-recent-card">
                        <div className="home-card-header">
                            <h2 className="home-section-title">Recent Exams</h2>
                            <Button
                                onClick={() => navigate('/exams')}
                                theme="tertiary small"
                            >
                                View All
                            </Button>
                        </div>
                        
                        {loadingData ? (
                            <div className="home-loading-state">
                                <div className="home-spinner-small"></div>
                            </div>
                        ) : recentExams.length > 0 ? (
                            <div className="home-exam-grid">
                                {recentExams.slice(0, 4).map((exam) => (
                                    <div
                                        key={exam.id}
                                        className="home-exam-card"
                                        onClick={() => navigate(`/exams/${exam.id}/attempt`)}
                                    >
                                        <h3 className="home-exam-title">{exam.title}</h3>
                                        <p className="home-exam-description">
                                            {exam.description}
                                        </p>
                                        <div className="home-exam-meta">
                                            <span>{exam.questions?.length || 0} questions</span>
                                            <span>by {exam.uploadedBy?.split('@')[0]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="home-empty-state">
                                <Icon icon="vaadin:book" className="home-empty-icon" />
                                <p>No exams available yet. Be the first to create one!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* My Exams Section */}
            {myExams.length > 0 && (
                <div className="home-my-exams-section">
                    <div className="home-my-exams-card">
                        <div className="home-card-header">
                            <h2 className="home-section-title">My Exams</h2>
                            <Button
                                onClick={() => navigate('/exams/create')}
                                theme="tertiary small"
                            >
                                Create New
                            </Button>
                        </div>
                        
                        <div className="home-my-exams-grid">
                            {myExams.slice(0, 6).map((exam) => (
                                <div key={exam.id} className="home-my-exam-card">
                                    <h3 className="home-exam-title">{exam.title}</h3>
                                    <p className="home-exam-description">
                                        {exam.description}
                                    </p>
                                    <div className="home-exam-actions">
                                        <span className="home-exam-questions">
                                            {exam.questions?.length || 0} questions
                                        </span>
                                        <div className="home-exam-buttons">
                                            <Button
                                                onClick={() => navigate(`/exams/${exam.id}/attempt`)}
                                                theme="tertiary small"
                                            >
                                                Take
                                            </Button>
                                            <Button
                                                onClick={() => navigate(`/exams/${exam.id}/edit`)}
                                                theme="tertiary small"
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}