// src/components/Performance/MemoizedExamCard.tsx
import { memo, useMemo, useCallback } from 'react';
import { Card, Button, Icon } from '@vaadin/react-components';
import { useNavigate } from 'react-router';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import { TagDisplay } from './TagComponents/TagsComponents';
import { ReadMoreModal } from './ReadMoreModal';
import { ConfirmationButton } from './ConfirmationButton';
import { useAuth } from 'Frontend/hooks/useAuth';
import { APP_CONFIG, ROUTES } from '../config/constants';

interface MemoizedExamCardProps {
    exam: Exam;
    onTagClick: (tag: string) => void;
    className?: string;
}

export const MemoizedExamCard = memo<MemoizedExamCardProps>(({
    exam,
    onTagClick,
    className = ''
}) => {
    const navigate = useNavigate();
    const { authenticated, user } = useAuth();

    // Memoize expensive computations
    const examMeta = useMemo(() => {
        const canEdit = authenticated && user && exam.uploadedBy === user.email;
        const isOwnExam = authenticated && user && exam.uploadedBy === user.email;
        const questionCount = exam.questions?.length || 0;
        const filteredTags = (exam.tags || []).filter((tag): tag is string =>
            tag != null && tag !== undefined
        );
        const cardClassName = `exam-card ${isOwnExam ? 'own-exam-card' : ''} ${className}`;

        return {
            canEdit,
            isOwnExam,
            questionCount,
            filteredTags,
            cardClassName
        };
    }, [exam, authenticated, user?.email, className]);

    // Memoized callbacks to prevent child re-renders
    const handleTagClick = useCallback((tag: string) => {
        onTagClick(tag);
    }, [onTagClick]);

    const handleViewClick = useCallback(() => {
        navigate(ROUTES.EXAM_DETAIL(exam.id || ''));
    }, [navigate, exam.id]);

    const handleEditClick = useCallback(() => {
        navigate(ROUTES.EXAM_EDIT(exam.id || ''));
    }, [navigate, exam.id]);

    const handleAttemptClick = useCallback(() => {
        navigate(ROUTES.EXAM_ATTEMPT(exam.id || ''));
    }, [navigate, exam.id]);

    return (
        <Card className={examMeta.cardClassName}>
            {/* Exam Header */}
            <div className="exam-card-header">
                <div className="exam-title-section">
                    <h3 className="exam-title">{exam.title}</h3>
                    {examMeta.isOwnExam && (
                        <span className="own-exam-badge">
                            <Icon icon="vaadin:user" />
                            Your Exam
                        </span>
                    )}
                </div>
            </div>

            {/* Exam Meta */}
            <div className="exam-meta">
                <div className="meta-item">
                    <Icon icon="vaadin:user" />
                    <span>{exam.uploadedBy}</span>
                </div>

                <div className="meta-item">
                    <Icon icon="vaadin:clock" />
                    <span>
                        {exam.uploadedAt
                            ? new Date(exam.uploadedAt).toLocaleDateString()
                            : 'Unknown date'
                        }
                    </span>
                </div>
            </div>

            {/* Exam Stats */}
            <div className="exam-stats">
                <div className="stat-badge">
                    <Icon icon="vaadin:question-circle" />
                    <span>
                        {examMeta.questionCount} question{examMeta.questionCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Tags */}
            <TagDisplay
                tags={examMeta.filteredTags}
                maxVisible={APP_CONFIG.PAGINATION.MAX_VISIBLE_TAGS}
                onTagClick={handleTagClick}
                className="exam-card-tags"
            />

            {/* Description */}
            <div className="exam-description">
                <ReadMoreModal description={exam.description || ''} />
            </div>

            {/* Action Buttons */}
            <div className="exam-actions">
                <div className="primary-actions">
                    <Button
                        onClick={handleViewClick}
                        theme="secondary"
                        className="action-btn view-btn"
                    >
                        <Icon slot="prefix" icon="vaadin:eye" />
                        View Details
                    </Button>

                    <ConfirmationButton
                        action="Begin Exam"
                        modalTitle="Attempt Exam"
                        modalDescription={`Are you sure you want to attempt "${exam.title}"?`}
                        buttonText="Take Exam"
                        buttonClassName="action-btn attempt-btn"
                        buttonTheme="primary"
                        onYes={handleAttemptClick}
                    />
                </div>

                {/* Edit button for exam owners */}
                {examMeta.canEdit && (
                    <Button
                        onClick={handleEditClick}
                        theme="tertiary small"
                        className="edit-exam-btn"
                    >
                        <Icon icon="vaadin:edit" slot="prefix" />
                        Edit Exam
                    </Button>
                )}
            </div>
        </Card>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for optimal re-rendering
    return (
        prevProps.exam.id === nextProps.exam.id &&
        prevProps.className === nextProps.className
    );
});

MemoizedExamCard.displayName = 'MemoizedExamCard';