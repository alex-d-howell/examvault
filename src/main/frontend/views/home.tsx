import { useAuth } from 'Frontend/hooks/useAuth';
import { useNavigate } from 'react-router';
import { Button, Icon } from '@vaadin/react-components';
import { useDashboard } from 'Frontend/hooks/useDashboard';
import { usePageMeta } from 'Frontend/hooks/usePageMeta';
import { useAuthRedirect } from 'Frontend/hooks/useAuthRedirect';
import { MemoizedExamCard } from 'Frontend/components/MemoizedExamCard';
import { ExamListSkeleton } from 'Frontend/components/LoadingSkeletons';
import { PageErrorBoundary } from 'Frontend/components/ErrorBoundaries';
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

    const { recentExams, myExams, loadingData, error } = useDashboard(authenticated, authInitialized, loading);

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
        <PageErrorBoundary>
            <div className="home-container">
                {/* Welcome Header */}
                <WelcomeCard
                    user={user}
                    myExamsCount={myExams.length}
                    onCreateExam={() => navigate('/exams/create')}
                    onBrowseExams={() => navigate('/exams')}
                />

                {/* Main Dashboard Content */}
                <div className="home-dashboard">
                    {/* My Exams Section */}
                    {myExams.length > 0 && (
                        <MyExamsSection
                            exams={myExams}
                            onCreateAnother={() => navigate('/exams/create')}
                            onTagClick={(tag: string) => navigate(`/exams?tag=${encodeURIComponent(tag)}`)}
                        />
                    )}

                    {/* Recent Exams Section */}
                    <RecentExamsSection
                        recentExams={recentExams}
                        loadingData={loadingData}
                        error={error}
                        userEmail={user?.email}
                        onBrowseAll={() => navigate('/exams')}
                        onCreateFirst={() => navigate('/exams/create')}
                        onTagClick={(tag: string) => navigate(`/exams?tag=${encodeURIComponent(tag)}`)}
                    />
                </div>
            </div>
        </PageErrorBoundary>
    );
}

const WelcomeCard = ({ user, myExamsCount, onCreateExam, onBrowseExams }: {
    user: any;
    myExamsCount: number;
    onCreateExam: () => void;
    onBrowseExams: () => void;
}) => (
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
                        You've created {myExamsCount} exam{myExamsCount !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
            <div className="home-action-buttons">
                <Button onClick={onCreateExam} theme="primary" className="home-create-btn">
                    <Icon icon="vaadin:plus" />
                    Create Exam
                </Button>
                <Button onClick={onBrowseExams} theme="secondary" className="home-browse-btn">
                    <Icon icon="vaadin:book" />
                    Browse Exams
                </Button>
            </div>
        </div>
    </div>
);

const MyExamsSection = ({ exams, onCreateAnother, onTagClick }: {
    exams: any[];
    onCreateAnother: () => void;
    onTagClick: (tag: string) => void;
}) => (
    <div className="home-section">
        <div className="home-section-header">
            <h2 className="home-section-title">
                <Icon icon="vaadin:user-card" className="section-icon" />
                My Exams ({exams.length})
            </h2>
            <Button onClick={onCreateAnother} theme="tertiary small">
                Create Another
            </Button>
        </div>

        <div className="home-exam-grid">
            {exams.slice(0, 4).map((exam) => (
                <MemoizedExamCard
                    key={exam.id}
                    exam={exam}
                    onTagClick={onTagClick}
                    className="home-my-exam"
                />
            ))}
        </div>
    </div>
);

const RecentExamsSection = ({
    recentExams,
    loadingData,
    error,
    userEmail,
    onBrowseAll,
    onCreateFirst,
    onTagClick
}: {
    recentExams: any[];
    loadingData: boolean;
    error: string | null;
    userEmail?: string;
    onBrowseAll: () => void;
    onCreateFirst: () => void;
    onTagClick: (tag: string) => void;
}) => (
    <div className="home-section">
        <div className="home-section-header">
            <h2 className="home-section-title">
                <Icon icon="vaadin:clock" className="section-icon" />
                Recent Exams
            </h2>
            <Button onClick={onBrowseAll} theme="tertiary small">
                Browse All
            </Button>
        </div>

        {loadingData ? (
            <ExamListSkeleton count={4} layout="grid" />
        ) : error ? (
            <div className="home-empty-state">
                <Icon icon="vaadin:exclamation-triangle" className="home-empty-icon" />
                <p>Failed to load exams: {error}</p>
                <Button onClick={onBrowseAll} theme="primary">
                    Try Browse Page
                </Button>
            </div>
        ) : recentExams.length > 0 ? (
            <div className="home-exam-grid">
                {recentExams.slice(0, 4).map((exam) => (
                    <MemoizedExamCard
                        key={exam.id}
                        exam={exam}
                        onTagClick={onTagClick}
                        className="home-recent-exam"
                    />
                ))}
            </div>
        ) : (
            <div className="home-empty-state">
                <Icon icon="vaadin:book" className="home-empty-icon" />
                <p>No exams available yet.</p>
                <Button onClick={onCreateFirst} theme="primary">
                    Create the First Exam
                </Button>
            </div>
        )}
    </div>
);