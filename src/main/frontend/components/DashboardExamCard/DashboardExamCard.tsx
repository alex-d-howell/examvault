import React, { useState, useEffect } from 'react';
import { MemoizedExamCard } from 'Frontend/components/MemoizedExamCard';
import { Button, Icon } from '@vaadin/react-components';
import { ExamAttemptService } from 'Frontend/generated/endpoints';
import { useAuth } from 'Frontend/hooks/useAuth';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import './DashboardExamCard.css';

// Simple stats DTO for dashboard cards
interface AttemptSummaryStats {
    totalAttempts: number;
    bestPercentage: number;
    averagePercentage: number;
    lastAttemptDate?: string;
    recentTrend?: 'improving' | 'declining' | 'stable';
}

interface DashboardExamCardProps {
    exam: Exam;
    onTagClick: (tag: string) => void;
    onViewAttempts: (examId: string, examTitle: string) => void;
    className?: string;
}

export const DashboardExamCard: React.FC<DashboardExamCardProps> = ({
    exam,
    onTagClick,
    onViewAttempts,
    className,
}) => {
    const [attemptStats, setAttemptStats] = useState<AttemptSummaryStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load basic attempt stats for the exam card
    useEffect(() => {
        const loadAttemptStats = async () => {
            if (!exam.id) return;

            setLoadingStats(true);
            setError(null);

            try {
                // Load full attempts and calculate stats
                const attempts = await ExamAttemptService.getMyExamAttemptsByExam(exam.id.toString());

                if (attempts && attempts.length > 0) {
                    // Calculate stats from attempts
                    const totalQuestions = exam.questions?.length || 1;

                    const percentages = attempts.map(attempt => {
                        const correct = attempt?.numberCorrect || 0;
                        return Math.round((correct / totalQuestions) * 100);
                    });

                    const bestPercentage = Math.max(...percentages);
                    const averagePercentage = Math.round(
                        percentages.reduce((sum, perc) => sum + perc, 0) / percentages.length
                    );

                    // Calculate recent trend (compare last 3 attempts vs previous 3)
                    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
                    if (percentages.length >= 6) {
                        const recent3 = percentages.slice(0, 3);
                        const previous3 = percentages.slice(3, 6);
                        const recentAvg = recent3.reduce((sum, p) => sum + p, 0) / 3;
                        const previousAvg = previous3.reduce((sum, p) => sum + p, 0) / 3;

                        if (recentAvg > previousAvg + 5) recentTrend = 'improving';
                        else if (recentAvg < previousAvg - 5) recentTrend = 'declining';
                    }

                    // Get last attempt date (attempts should be sorted by startTime DESC)
                    const lastAttemptDate = attempts[0]?.startTime?.toString();

                    setAttemptStats({
                        totalAttempts: attempts.length,
                        bestPercentage,
                        averagePercentage,
                        lastAttemptDate,
                        recentTrend,
                    });
                } else {
                    setAttemptStats(null);
                }
            } catch (error) {
                console.error('Error loading attempt stats:', error);
                setError('Failed to load stats');
            } finally {
                setLoadingStats(false);
            }
        };

        if (exam.id) {
            loadAttemptStats();
        }
    }, [exam.id, exam.questions?.length]);

    const handleViewAttempts = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (exam.id && exam.title) {
            onViewAttempts(exam.id.toString(), exam.title);
        }
    };

    const getScoreColor = (percentage: number): string => {
        if (percentage >= 90) return '#10b981'; // green
        if (percentage >= 80) return '#3b82f6'; // blue  
        if (percentage >= 70) return '#f59e0b'; // orange
        return '#ef4444'; // red
    };

    return (
        <div className="enhanced-exam-card">
            {/* Render the original exam card */}
            <MemoizedExamCard
                exam={exam}
                onTagClick={onTagClick}
                className='dashboard-card'
            />

            {/* Attempt statistics section */}
            {loadingStats && (
                <div className="exam-attempts-stats-loading">
                    <div className="loading-spinner-mini"></div>
                    <span>Loading stats...</span>
                </div>
            )}

            {error && (
                <div className="exam-attempts-stats-error">
                    <Icon icon="vaadin:warning" />
                    <span>Stats unavailable</span>
                </div>
            )}

            {!loadingStats && !error && attemptStats && attemptStats.totalAttempts > 0 && (
                <div className="exam-attempts-stats-summary">
                    <div className="exam-attempts-stats-summary-grid">
                        <div className="exam-attempts-stat-mini">
                            <div className="stat-mini-icon">
                                <Icon icon="vaadin:list" />
                            </div>
                            <div className="stat-mini-content">
                                <div className="exam-attempts-stat-mini-value">{attemptStats.totalAttempts}</div>
                                <div className="exam-attempts-stat-mini-label">Attempts</div>
                            </div>
                        </div>

                        <div className="exam-attempts-stat-mini">
                            <div className="stat-mini-icon">
                                <Icon icon="vaadin:trophy" />
                            </div>
                            <div className="stat-mini-content">
                                <div
                                    className="exam-attempts-stat-mini-value score-value"
                                    style={{ color: getScoreColor(attemptStats.bestPercentage) }}
                                >
                                    {attemptStats.bestPercentage}%
                                </div>
                                <div className="exam-attempts-stat-mini-label">Best</div>
                            </div>
                        </div>

                        <div className="exam-attempts-stat-mini">
                            <div className="stat-mini-icon">
                                <Icon icon="vaadin:chart-line" />
                            </div>
                            <div className="stat-mini-content">
                                <div
                                    className="exam-attempts-stat-mini-value score-value"
                                    style={{ color: getScoreColor(attemptStats.averagePercentage) }}
                                >
                                    {attemptStats.averagePercentage}%
                                </div>
                                <div className="exam-attempts-stat-mini-label">Average</div>
                            </div>
                        </div>
                    </div>

                    <div className="stats-actions">
                        <Button
                            className="exam-attempts-view-button enhanced"
                            onClick={handleViewAttempts}
                            theme="primary small"
                        >
                            <Icon icon="vaadin:eye" slot="prefix" />
                            View All Attempts
                        </Button>
                    </div>
                </div>
            )}

            {!loadingStats && !error && (!attemptStats || attemptStats.totalAttempts === 0) && (
                <div className="exam-attempts-no-stats">
                    <div className="no-stats-content">
                        <Icon icon="vaadin:info-circle" />
                        <span>No attempts yet</span>
                    </div>
                </div>
            )}
        </div>
    );
};