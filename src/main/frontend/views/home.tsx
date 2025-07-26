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
                ExamService.getRecentExams(7),
                ExamService.getMyExams()
            ]);
            
            // Get the 6 most recent exams for browsing
            const recent = allExams?.slice(-6).reverse();
            setRecentExams(recent || []);
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
                            <p className="home-welcome-subtitle">
                                You've created {myExams.length} exam{myExams.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="home-action-buttons">
                        <Button
                            onClick={() => navigate('/exams/create')}
                            theme="primary"
                            className="home-create-btn"
                        >
                            <Icon icon="vaadin:plus" />
                            Create Exam
                        </Button>
                        <Button
                            onClick={() => navigate('/exams')}
                            theme="secondary"
                            className="home-browse-btn"
                        >
                            <Icon icon="vaadin:book" />
                            Browse Exams
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="home-dashboard">
                {/* My Exams Section - Show if user has created exams */}
                {myExams.length > 0 && (
                    <div className="home-section">
                        <div className="home-section-header">
                            <h2 className="home-section-title">
                                <Icon icon="vaadin:user-card" className="section-icon" />
                                My Exams ({myExams.length})
                            </h2>
                            <Button
                                onClick={() => navigate('/exams/create')}
                                theme="tertiary small"
                            >
                                Create Another
                            </Button>
                        </div>
                        
                        <div className="home-exam-grid">
                            {myExams.slice(0, 4).map((exam) => (
                                <div key={exam.id} className="home-exam-card home-my-exam">
                                    <div className="exam-card-header">
                                        <h3 className="home-exam-title">{exam.title}</h3>
                                        <span className="exam-owner-badge">Mine</span>
                                    </div>
                                    <p className="home-exam-description">
                                        {exam.description}
                                    </p>
                                    <div className="home-exam-footer">
                                        <span className="home-exam-questions">
                                            {exam.questions?.length || 0} questions
                                        </span>
                                        <div className="home-exam-buttons">
                                            <Button
                                                onClick={() => navigate(`/exams/${exam.id}`)}
                                                theme="tertiary small"
                                                title="View exam details"
                                            >
                                                <Icon icon="vaadin:eye" />
                                            </Button>
                                            <Button
                                                onClick={() => navigate(`/exams/${exam.id}/edit`)}
                                                theme="tertiary small"
                                                title="Edit exam"
                                            >
                                                <Icon icon="vaadin:edit" />
                                            </Button>
                                            <Button
                                                onClick={() => navigate(`/exams/${exam.id}/attempt`)}
                                                theme="primary small"
                                                title="Take exam"
                                            >
                                                <Icon icon="vaadin:play" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Exams Section */}
                <div className="home-section">
                    <div className="home-section-header">
                        <h2 className="home-section-title">
                            <Icon icon="vaadin:clock" className="section-icon" />
                            Recent Exams
                        </h2>
                        <Button
                            onClick={() => navigate('/exams')}
                            theme="tertiary small"
                        >
                            Browse All
                        </Button>
                    </div>
                    
                    {loadingData ? (
                        <div className="home-loading-state">
                            <div className="home-spinner-small"></div>
                            <p>Loading exams...</p>
                        </div>
                    ) : recentExams.length > 0 ? (
                        <div className="home-exam-grid">
                            {recentExams.slice(0, 4).map((exam) => (
                                <div
                                    key={exam.id}
                                    className="home-exam-card"
                                    onClick={() => navigate(`/exams/${exam.id}`)}
                                >
                                    <div className="exam-card-header">
                                        <h3 className="home-exam-title">{exam.title}</h3>
                                        {exam.uploadedBy === user?.email && (
                                            <span className="exam-owner-badge">Mine</span>
                                        )}
                                    </div>
                                    <p className="home-exam-description">
                                        {exam.description}
                                    </p>
                                    <div className="home-exam-footer">
                                        <div className="home-exam-meta">
                                            <span>{exam.questions?.length || 0} questions</span>
                                            <span>by {exam.uploadedBy?.split('@')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="home-empty-state">
                            <Icon icon="vaadin:book" className="home-empty-icon" />
                            <p>No exams available yet.</p>
                            <Button
                                onClick={() => navigate('/exams/create')}
                                theme="primary"
                            >
                                Create the First Exam
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}