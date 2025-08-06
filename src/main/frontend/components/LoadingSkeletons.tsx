import React from 'react';
import { APP_CONFIG } from 'Frontend/config/constants';

const Skeleton: React.FC<{
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
}> = ({
    width = '100%',
    height = '1rem',
    borderRadius = 'var(--radius-md)',
    className = ''
}) => (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: 'var(--color-gray-200)',
            }}
        />
    );

export const ExamCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div
        className={`exam-card ${className}`}
        style={{
            padding: '1.5rem',
            margin: '0',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e2e8f0',
            minWidth: `${APP_CONFIG.UI.EXAM_CARD_MIN_WIDTH}px`,
        }}
    >
        {/* Exam Header */}
        <div className="exam-card-header" style={{ marginBottom: '1rem' }}>
            <div className="exam-title-section">
                <Skeleton height="1.5rem" width="75%" className="mb-xs" />
                <Skeleton height="1.25rem" width="60px" borderRadius="1.5rem" />
            </div>
        </div>

        {/* Meta info */}
        <div
            className="exam-meta"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: 'rgba(249, 250, 251, 0.8)',
                borderRadius: '0.5rem',
                border: '1px solid #f3f4f6'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Skeleton height="1rem" width="1rem" borderRadius="50%" />
                <Skeleton height="0.875rem" width="120px" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Skeleton height="1rem" width="1rem" borderRadius="50%" />
                <Skeleton height="0.875rem" width="100px" />
            </div>
        </div>

        {/* Stats */}
        <div className="exam-stats" style={{ marginBottom: '1rem' }}>
            <Skeleton height="1.5rem" width="80px" borderRadius="1.5rem" />
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <Skeleton height="1.5rem" width="60px" borderRadius="0.375rem" />
            <Skeleton height="1.5rem" width="80px" borderRadius="0.375rem" />
            <Skeleton height="1.5rem" width="45px" borderRadius="0.375rem" />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.5rem' }}>
            <Skeleton height="1rem" width="100%" className="mb-xs" />
            <Skeleton height="1rem" width="85%" className="mb-xs" />
            <Skeleton height="1rem" width="60%" />
        </div>

        {/* Action buttons */}
        <div className="exam-actions" style={{ paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
            <div
                className="primary-actions"
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                }}
            >
                <Skeleton height="2.5rem" borderRadius="0.5rem" />
                <Skeleton height="2.5rem" borderRadius="0.5rem" />
            </div>
            <Skeleton height="2rem" width="120px" borderRadius="0.5rem" />
        </div>
    </div>
);

export const ExamListSkeleton: React.FC<{
    count?: number;
    layout?: 'grid' | 'list';
    className?: string;
}> = ({
    count = APP_CONFIG.PAGINATION.LOADING_SKELETON_COUNT,
    layout = 'grid',
    className = ''
}) => (
        <div
            className={`exam-list-skeleton ${className}`}
            style={{
                display: layout === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: layout === 'grid'
                    ? `repeat(auto-fill, minmax(${APP_CONFIG.UI.EXAM_CARD_MIN_WIDTH}px, 1fr))`
                    : undefined,
                flexDirection: layout === 'list' ? 'column' : undefined,
                gap: '1.5rem',
                padding: '0 1rem',
            }}
        >
            {Array.from({ length: count }, (_, idx) => (
                <ExamCardSkeleton key={idx} />
            ))}
        </div>
    );

