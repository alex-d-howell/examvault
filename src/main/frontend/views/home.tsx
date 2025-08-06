// Updated home.tsx with enhanced dashboard features

import { useAuth } from 'Frontend/hooks/useAuth';
import { useNavigate } from 'react-router';
import { Button, Icon } from '@vaadin/react-components';
import { useDashboard } from 'Frontend/hooks/useDashboard'; // Your enhanced hook
import { usePageMeta } from 'Frontend/hooks/usePageMeta';
import { useAuthRedirect } from 'Frontend/hooks/useAuthRedirect';
import { PageErrorBoundary } from 'Frontend/components/ErrorBoundaries';
import { useExamAttemptsModal } from 'Frontend/hooks/useExamAttemptModal';
import { ExamAttemptDetailModal, ExamAttemptsListModal } from 'Frontend/components/ExamAttemptHistoryComponents/ExamAttemptHistoryComponents';
import { DashboardExamCard } from 'Frontend/components/DashboardExamCard/DashboardExamCard';
import { MyAttempts } from 'Frontend/components/MyAttemptsComponent/MyAttemptsComponent';
import './home.css';

export default function HomeView() {
    const { authenticated, authInitialized, loading, user } = useAuth();
    const navigate = useNavigate();

    usePageMeta({ title: 'Dashboard', description: 'Your personal exam dashboard' });
    useAuthRedirect({
        authenticated,
        authInitialized,
        loading,
        currentPath: '/home',
        isProtectedRoute: true
    });

    const {
        myExams,
        myAttempts,
        dashboardStats,
        loadingData } = useDashboard(authenticated, authInitialized, loading);

    const examAttemptsModal = useExamAttemptsModal();

    const handleViewAttempts = (examId: string, examTitle: string) => {
        examAttemptsModal.openAttemptsModal(examId, examTitle);
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
        <PageErrorBoundary>
            <div className="home-container">
                {/* Enhanced Welcome Header */}
                <EnhancedWelcomeCard
                    user={user}
                    stats={dashboardStats}
                    onCreateExam={() => navigate('/exams/create')}
                    onBrowseExams={() => navigate('/exams')}
                />

                {/* Dashboard Statistics Overview */}
                <DashboardStatsOverview stats={dashboardStats} />

                {/* Main Dashboard Content */}
                <div className="home-dashboard">
                    <div className="dashboard-grid">
                        {/* My Exams Section */}
                        {myExams.length > 0 && (
                            <div className="dashboard-section my-exams">
                                <div className="section-header">
                                    <h3>
                                        <Icon icon="vaadin:user-card" />
                                        Your Exams ({myExams.length})
                                    </h3>
                                    <Button
                                        theme="tertiary small"
                                        onClick={() => navigate('/exams/create')}
                                    >
                                        <Icon icon="vaadin:plus" slot="prefix" />
                                        Create New
                                    </Button>
                                </div>
                                <div className="exam-grid">
                                    {myExams.slice(0, 4).map((exam) => (
                                        <DashboardExamCard
                                            key={exam.id}
                                            exam={exam}
                                            onTagClick={(tag: string) => navigate(`/exams?tag=${encodeURIComponent(tag)}`)}
                                            onViewAttempts={handleViewAttempts}
                                            className="my-exam-card"
                                        />
                                    ))}
                                </div>
                                {myExams.length > 4 && (
                                    <div className="section-footer">
                                        <Button
                                            theme="tertiary"
                                            onClick={() => navigate('/exams?filter=mine')}
                                        >
                                            View All {myExams.length} Exams
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* My Attempts Section */}
                        <div className="dashboard-section my-attempts">
                            <div className="section-header">
                                <h3>
                                    <Icon icon="vaadin:clock" />
                                    My Attempts
                                </h3>
                                {myAttempts.length > 5 && (
                                    <Button
                                        theme="tertiary small"
                                        onClick={() => navigate('/attempts')} // You'd need this route
                                    >
                                        View All
                                    </Button>
                                )}
                            </div>
                            {loadingData ? (
                                <div className="loading-skeleton">
                                    {Array.from({ length: 3 }, (_, i) => (
                                        <div key={i} className="attempt-skeleton" />
                                    ))}
                                </div>
                            ) : (
                                <MyAttempts
                                    attempts={myAttempts}
                                    onTagClick={(tag: string) => navigate(`/exams?tag=${encodeURIComponent(tag)}`)}
                                    showAll={false}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Exam Attempts Modals */}
                <ExamAttemptsListModal
                    isOpen={examAttemptsModal.currentView === 'list'}
                    onClose={examAttemptsModal.closeModal}
                    examTitle={examAttemptsModal.currentExamTitle || ''}
                    attempts={examAttemptsModal.attempts}
                    stats={examAttemptsModal.stats}
                    isLoading={examAttemptsModal.isLoading}
                    isError={examAttemptsModal.isError}
                    error={examAttemptsModal.error}
                    onAttemptClick={examAttemptsModal.openDetailModal}
                    getPercentage={examAttemptsModal.getPercentage}
                    getTimeSpent={examAttemptsModal.getTimeSpent}
                />

                <ExamAttemptDetailModal
                    isOpen={examAttemptsModal.currentView === 'detail'}
                    onClose={examAttemptsModal.closeModal}
                    onBack={examAttemptsModal.goBackToList}
                    attempt={examAttemptsModal.selectedAttempt!}
                    examTitle={examAttemptsModal.currentExamTitle || ''}
                    getPercentage={examAttemptsModal.getPercentage}
                    getTimeSpent={examAttemptsModal.getTimeSpent}
                />
            </div>
        </PageErrorBoundary>
    );
}

// Enhanced Welcome Card Component
const EnhancedWelcomeCard = ({ user, stats, onCreateExam, onBrowseExams }: {
    user: any;
    stats: any;
    onCreateExam: () => void;
    onBrowseExams: () => void;
}) => (
    <div className="welcome-card-enhanced">
        <div className="welcome-background">
            <div className="welcome-content">
                <div className="user-section">
                    <img
                        src={user?.profilePictureUrl}
                        alt={user?.name}
                        className="user-avatar"
                        referrerPolicy="no-referrer"
                    />
                    <div className="user-info">
                        <h1 className="welcome-title">
                            Welcome back, {user?.name?.split(' ')[0]}! 🎯
                        </h1>
                        <p className="welcome-subtitle">
                            Track your progress and keep improving!
                        </p>
                    </div>
                </div>
                <div className="quick-stats">
                    <div className="stat-item">
                        <span className="stat-number">{stats.totalExamsCreated}</span>
                        <span className="stat-label">Exams Created</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{stats.uniqueExamsTaken}</span>
                        <span className="stat-label">Exams Attempted</span>
                    </div>
                </div>
            </div>
            <div className="welcome-actions">
                <Button onClick={onCreateExam} theme="primary" className="create-btn">
                    <Icon icon="vaadin:plus" slot="prefix" />
                    Create Exam
                </Button>
                <Button onClick={onBrowseExams} theme="tertiary" className="browse-btn">
                    <Icon icon="vaadin:book" slot="prefix" />
                    Browse Exams
                </Button>
            </div>
        </div>
    </div>
);

// Dashboard Statistics Overview Component
const DashboardStatsOverview = ({ stats }: { stats: any }) => (
    <div className="dashboard-stats-overview">
        <div className="stats-grid">
            <div className="stat-card primary">
                <div className="stat-icon">
                    <Icon icon="vaadin:list" />
                </div>
                <div className="stat-content">
                    <span className="stat-value">{stats.totalAttempts}</span>
                    <span className="stat-title">Total Attempts</span>
                    <span className="stat-trend positive">{stats.recentActivity} this week</span>
                </div>
            </div>

            <div className="stat-card secondary">
                <div className="stat-icon">
                    <Icon icon="vaadin:book" />
                </div>
                <div className="stat-content">
                    <span className="stat-value">{stats.uniqueExamsTaken}</span>
                    <span className="stat-title">Exams Attempted</span>
                    <span className="stat-trend neutral">Different topics</span>
                </div>
            </div>

            <div className="stat-card accent">
                <div className="stat-icon">
                    <Icon icon="vaadin:edit" />
                </div>
                <div className="stat-content">
                    <span className="stat-value">{stats.totalExamsCreated}</span>
                    <span className="stat-title">Exams Created</span>
                    <span className="stat-trend neutral">Your contributions</span>
                </div>
            </div>

            <div className="stat-card info">
                <div className="stat-icon">
                    <Icon icon="vaadin:fire" />
                </div>
                <div className="stat-content">
                    <span className="stat-value">{stats.studyStreak}</span>
                    <span className="stat-title">Study Streak</span>
                    <span className="stat-trend positive">
                        {stats.studyStreak > 0 ? 'Keep it up!' : 'Start today!'}
                    </span>
                </div>
            </div>
        </div>
    </div>
);