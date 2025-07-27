import React, { useState, useEffect } from 'react';
import { MemoizedExamCard } from 'Frontend/components/MemoizedExamCard';
import { Button } from '@vaadin/react-components';
import { ExamAttemptService } from 'Frontend/generated/endpoints';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';

// Simple stats DTO for dashboard cards
interface AttemptSummaryStats {
    totalAttempts: number;
    bestPercentage: number;
    averagePercentage: number;
    lastAttemptDate?: string;
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

    // Load basic attempt stats for the exam card
    useEffect(() => {
        const loadAttemptStats = async () => {
            if (!exam.id) return;

            setLoadingStats(true);
            try {
                // Load full attempts and calculate stats
                const attempts = await ExamAttemptService.getMyExamAttemptsByExam(exam.id.toString());

                if (attempts && attempts.length > 0) {
                    // Calculate stats from attempts
                    const totalQuestions = exam.questions?.length || 1; // Avoid division by zero

                    const percentages = attempts.map(attempt => {
                        const correct = attempt?.numberCorrect || 0;
                        return Math.round((correct / totalQuestions) * 100);
                    });

                    const bestPercentage = Math.max(...percentages);
                    const averagePercentage = Math.round(
                        percentages.reduce((sum, perc) => sum + perc, 0) / percentages.length
                    );

                    // Get last attempt date (attempts should be sorted by startTime DESC)
                    const lastAttemptDate = attempts[0]?.startTime?.toString();

                    setAttemptStats({
                        totalAttempts: attempts.length,
                        bestPercentage,
                        averagePercentage,
                        lastAttemptDate,
                    });
                }
            } catch (error) {
                console.error('Error loading attempt stats:', error);
                // Silently fail - stats are optional for dashboard
            } finally {
                setLoadingStats(false);
            }
        };

        loadAttemptStats();
    }, [exam.id, exam.questions?.length]);

    const handleViewAttempts = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (exam.id && exam.title) {
            onViewAttempts(exam.id.toString(), exam.title);
        }
    };

    return (
        <div className={`enhanced-exam-card ${className || ''}`}>
            {/* Render the original exam card */}
            <MemoizedExamCard
                exam={exam}
                onTagClick={onTagClick}
                className="base-exam-card"
            />

            {/* Enhanced: Attempt statistics section */}
            {!loadingStats && attemptStats && attemptStats.totalAttempts > 0 && (
                <div className="exam-attempts-stats-summary">
                    <div className="exam-attempts-stats-summary-grid">
                        <div className="exam-attempts-stat-mini">
                            <div className="exam-attempts-stat-mini-value">{attemptStats.totalAttempts}</div>
                            <div className="exam-attempts-stat-mini-label">Attempts</div>
                        </div>
                        <div className="exam-attempts-stat-mini">
                            <div className="exam-attempts-stat-mini-value">{attemptStats.bestPercentage}%</div>
                            <div className="exam-attempts-stat-mini-label">Best</div>
                        </div>
                        <div className="exam-attempts-stat-mini">
                            <div className="exam-attempts-stat-mini-value">{attemptStats.averagePercentage}%</div>
                            <div className="exam-attempts-stat-mini-label">Average</div>
                        </div>
                    </div>
                    <Button
                        className="exam-attempts-view-button"
                        onClick={handleViewAttempts}
                        theme="primary small"
                    >
                        View Attempts
                    </Button>
                </div>
            )}

            {loadingStats && (
                <div className="exam-attempts-stats-loading">
                    <div className="home-spinner-small"></div>
                    <span>Loading stats...</span>
                </div>
            )}
        </div>
    );
};