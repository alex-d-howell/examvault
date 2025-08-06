import React, { useState } from 'react';
import { Button, Icon } from '@vaadin/react-components';
import { useNavigate } from 'react-router';
import type ExamAttempt from 'Frontend/generated/com/howell/examvault/base/domain/ExamAttempt';

interface MyAttemptsProps {
    attempts: ExamAttempt[];
    onTagClick?: (tag: string) => void;
    className?: string;
    showAll?: boolean;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterOption = 'all' | 'excellent' | 'good' | 'needs-improvement';

export const MyAttempts: React.FC<MyAttemptsProps> = ({
    attempts,
    onTagClick,
    className = '',
    showAll = false
}) => {
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [showCount, setShowCount] = useState(showAll ? attempts.length : 5);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) return 'Today';
            if (diffDays === 2) return 'Yesterday';
            if (diffDays <= 7) return `${diffDays - 1}d ago`;

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: diffDays > 365 ? 'numeric' : undefined
            });
        } catch {
            return 'Invalid date';
        }
    };

    const formatTimeSpent = (startTime?: string, endTime?: string) => {
        if (!startTime || !endTime) return '0m';

        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const diffMs = end.getTime() - start.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));

            if (diffMinutes === 0) return '<1m';
            if (diffMinutes < 60) return `${diffMinutes}m`;

            const hours = Math.floor(diffMinutes / 60);
            const remainingMinutes = diffMinutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        } catch {
            return '0m';
        }
    };

    const calculatePercentage = (attempt: ExamAttempt): number => {
        const totalQuestions = attempt.exam?.questions?.length || 1;
        return Math.round(((attempt.numberCorrect || 0) / totalQuestions) * 100);
    };

    const getScoreColor = (percentage: number): string => {
        if (percentage >= 90) return '#10b981'; // green
        if (percentage >= 80) return '#3b82f6'; // blue  
        if (percentage >= 70) return '#f59e0b'; // amber
        if (percentage >= 60) return '#f97316'; // orange
        return '#ef4444'; // red
    };

    const getScoreCategory = (percentage: number): FilterOption => {
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        return 'needs-improvement';
    };

    const getFilteredAndSortedAttempts = () => {
        let filtered = attempts;

        // Apply filter
        if (filterBy !== 'all') {
            filtered = attempts.filter(attempt => {
                const percentage = calculatePercentage(attempt);
                return getScoreCategory(percentage) === filterBy;
            });
        }

        // Apply sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.endTime || 0).getTime() - new Date(a.endTime || 0).getTime();
                case 'oldest':
                    return new Date(a.endTime || 0).getTime() - new Date(b.endTime || 0).getTime();
                case 'highest':
                    return calculatePercentage(b) - calculatePercentage(a);
                case 'lowest':
                    return calculatePercentage(a) - calculatePercentage(b);
                default:
                    return 0;
            }
        });

        return filtered;
    };

    const filteredAttempts = getFilteredAndSortedAttempts();
    const displayedAttempts = filteredAttempts.slice(0, showCount);
    const hasMore = filteredAttempts.length > showCount;

    const getAttemptStats = () => {
        if (attempts.length === 0) return null;

        const totalAttempts = attempts.length;
        const uniqueExamIds = new Set(
            attempts
                .map(attempt => attempt.exam?.id)
                .filter(id => id != null)
        );
        const uniqueExams = uniqueExamIds.size;

        return { totalAttempts, uniqueExams };
    };

    const stats = getAttemptStats();

    const handleExamClick = (examId?: string) => {
        if (examId) {
            navigate(`/exams/${examId}`);
        }
    };

    const handleRetakeClick = (event: React.MouseEvent, examId?: string) => {
        event.stopPropagation();
        if (examId) {
            navigate(`/exams/${examId}/attempt`);
        }
    };

    const handleTagClick = (event: React.MouseEvent, tag: string) => {
        event.stopPropagation();
        onTagClick?.(tag);
    };

    if (attempts.length === 0) {
        return (
            <div className={`my-attempts-empty ${className}`}>
                <div className="empty-state-content">
                    <Icon icon="vaadin:chart-timeline" className="empty-icon" />
                    <h4>No Attempts Yet</h4>
                    <p>Start taking exams to track your progress and see your attempt history here.</p>
                    <Button
                        theme="primary small"
                        onClick={() => navigate('/exams')}
                    >
                        <Icon icon="vaadin:search" slot="prefix" />
                        Browse Exams
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`my-attempts-container ${className}`}>
            {/* Stats Summary */}
            {stats && (
                <div className="attempts-stats-summary">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">{stats.totalAttempts}</div>
                            <div className="stat-label">Total Attempts</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.uniqueExams}</div>
                            <div className="stat-label">Exams Attempted</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{filteredAttempts.length}</div>
                            <div className="stat-label">Filtered Results</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="attempts-controls">
                <div className="controls-section">
                    <label className="control-label">Sort by:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="control-select"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Score</option>
                        <option value="lowest">Lowest Score</option>
                    </select>
                </div>

                <div className="controls-section">
                    <label className="control-label">Filter:</label>
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                        className="control-select"
                    >
                        <option value="all">All Attempts</option>
                        <option value="excellent">Excellent (80%+)</option>
                        <option value="good">Good (60-79%)</option>
                        <option value="needs-improvement">Needs Work (&lt;60%)</option>
                    </select>
                </div>

                <div className="results-count">
                    Showing {displayedAttempts.length} of {filteredAttempts.length} attempts
                </div>
            </div>

            {/* Attempts List */}
            <div className="attempts-list">
                {displayedAttempts.map((attempt, index) => {
                    const percentage = calculatePercentage(attempt);
                    const scoreColor = getScoreColor(percentage);
                    const timeSpent = formatTimeSpent(attempt.startTime, attempt.endTime);
                    const dateFormatted = formatDate(attempt.endTime);
                    const examTags = attempt.exam?.tags?.filter((tag): tag is string => !!tag) || [];

                    return (
                        <div
                            key={attempt.id || `attempt-${index}`}
                            className="my-attempt-card"
                            onClick={() => handleExamClick(attempt.exam?.id)}
                        >
                            <div className="attempt-card-header">
                                <div className="attempt-info">
                                    <h4 className="attempt-exam-title">
                                        {attempt.exam?.title || 'Unknown Exam'}
                                    </h4>
                                    <div className="attempt-meta">
                                        <span className="attempt-date">
                                            <Icon icon="vaadin:calendar" />
                                            {dateFormatted}
                                        </span>
                                        <span className="attempt-time">
                                            <Icon icon="vaadin:clock" />
                                            {timeSpent}
                                        </span>
                                    </div>
                                </div>

                                <div className="attempt-score-section">
                                    <div
                                        className="score-badge"
                                        style={{ backgroundColor: scoreColor }}
                                    >
                                        <span className="score-percentage">{percentage}%</span>
                                    </div>
                                    <div className="score-details">
                                        {attempt.numberCorrect || 0}/{attempt.exam?.questions?.length || 0} correct
                                    </div>
                                </div>
                            </div>

                            {examTags.length > 0 && (
                                <div className="attempt-tags">
                                    {examTags.slice(0, 3).map((tag, tagIndex) => (
                                        <span
                                            key={tagIndex}
                                            className="attempt-tag"
                                            onClick={(e) => handleTagClick(e, tag)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {examTags.length > 3 && (
                                        <span className="attempt-tag more">
                                            +{examTags.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="attempt-actions">
                                <Button
                                    theme="tertiary small"
                                    className="action-btn review-btn"
                                    onClick={() => navigate(`/exams/${attempt.exam?.id}`)}
                                >
                                    <Icon icon="vaadin:eye" slot="prefix" />
                                    Review
                                </Button>
                                <Button
                                    theme="secondary small"
                                    className="action-btn retake-btn"
                                    onClick={(e) => handleRetakeClick(e, attempt.exam?.id)}
                                >
                                    <Icon icon="vaadin:refresh" slot="prefix" />
                                    Retake
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="load-more-section">
                    <Button
                        theme="tertiary"
                        onClick={() => setShowCount(prev => prev + 10)}
                        className="load-more-btn"
                    >
                        <Icon icon="vaadin:plus" slot="prefix" />
                        Show {Math.min(10, filteredAttempts.length - showCount)} More
                    </Button>
                </div>
            )}

            {filteredAttempts.length === 0 && attempts.length > 0 && (
                <div className="no-results">
                    <Icon icon="vaadin:filter" className="no-results-icon" />
                    <p>No attempts match your current filter.</p>
                    <Button
                        theme="tertiary small"
                        onClick={() => setFilterBy('all')}
                    >
                        Clear Filter
                    </Button>
                </div>
            )}
        </div>
    );
};

// Loading skeleton for my attempts
export const MyAttemptsLoading: React.FC = () => (
    <div className="my-attempts-loading">
        {/* Stats skeleton */}
        <div className="stats-skeleton">
            <div className="stat-skeleton"></div>
            <div className="stat-skeleton"></div>
            <div className="stat-skeleton"></div>
        </div>

        {/* Controls skeleton */}
        <div className="controls-skeleton">
            <div className="control-skeleton"></div>
            <div className="control-skeleton"></div>
        </div>

        {/* Attempts skeleton */}
        {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="attempt-card-skeleton">
                <div className="skeleton-header">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-score"></div>
                </div>
                <div className="skeleton-meta">
                    <div className="skeleton-date"></div>
                    <div className="skeleton-time"></div>
                </div>
                <div className="skeleton-tags">
                    <div className="skeleton-tag"></div>
                    <div className="skeleton-tag"></div>
                </div>
                <div className="skeleton-actions">
                    <div className="skeleton-button"></div>
                    <div className="skeleton-button"></div>
                </div>
            </div>
        ))}
    </div>
);