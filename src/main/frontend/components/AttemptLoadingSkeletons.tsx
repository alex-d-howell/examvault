import React from 'react';

const Skeleton: React.FC<{
    width?: string | number;
    height?: string | number;
    borderRadius?: string;
    className?: string;
    style?: React.CSSProperties;
}> = ({
    width = '100%',
    height = '1rem',
    borderRadius = '0.5rem',
    className = '',
    style = {}
}) => (
        <div
            className={`skeleton ${className}`}
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: '#f3f4f6',
                ...style
            }}
        />
    );

// Exam Header Loading Skeleton
export const ExamHeaderSkeleton: React.FC = () => (
    <div
        className="exam-header"
        style={{
            backgroundColor: 'white',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            borderBottom: '1px solid #e5e7eb'
        }}
    >
        <div
            className="exam-header-content"
            style={{
                maxWidth: '80rem',
                margin: '0 auto',
                padding: '1rem'
            }}
        >
            <div
                className="exam-header-info"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <div>
                    <Skeleton height="1.75rem" width="300px" className="mb-sm" />
                    <Skeleton height="1rem" width="400px" className="mb-sm" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Skeleton height="1rem" width="1rem" borderRadius="50%" />
                        <Skeleton height="0.875rem" width="200px" />
                    </div>
                </div>
                <div className="exam-header-controls">
                    <Skeleton height="2.5rem" width="140px" borderRadius="0.5rem" />
                </div>
            </div>
        </div>
    </div>
);

// Sidebar Navigation Skeleton
export const SidebarSkeleton: React.FC = () => (
    <div className="sidebar">
        <div
            className="navigation-panel"
            style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                padding: '1rem',
                position: 'sticky',
                top: '1rem'
            }}
        >
            <Skeleton height="1.5rem" width="180px" className="mb-lg" />
            <Skeleton height="1rem" width="150px" className="mb-lg" />

            {/* Question grid skeleton */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                }}
            >
                {Array.from({ length: 15 }, (_, idx) => (
                    <Skeleton key={idx} height="2.5rem" width="2.5rem" borderRadius="0.5rem" />
                ))}
            </div>

            {/* Legend skeleton */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Array.from({ length: 3 }, (_, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Skeleton height="0.75rem" width="0.75rem" borderRadius="0.125rem" />
                        <Skeleton height="0.75rem" width="80px" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// Question Panel Loading Skeleton  
export const QuestionPanelSkeleton: React.FC = () => (
    <div className="main-content">
        <div
            className="question-panel"
            style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                padding: '1.5rem'
            }}
        >
            {/* Question header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem'
                }}
            >
                <Skeleton height="0.875rem" width="120px" />
                <Skeleton height="1.5rem" width="140px" borderRadius="0.25rem" />
            </div>

            {/* Question text */}
            <Skeleton height="1.25rem" width="90%" className="mb-lg" />

            {/* Options */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginBottom: '2rem'
                }}
            >
                {Array.from({ length: 4 }, (_, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Skeleton height="1rem" width="1rem" borderRadius="50%" />
                        <Skeleton height="1rem" width={`${60 + (idx * 10)}%`} />
                    </div>
                ))}
            </div>

            {/* Navigation buttons */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Skeleton height="2.5rem" width="100px" borderRadius="0.5rem" />
                <Skeleton height="2.5rem" width="100px" borderRadius="0.5rem" />
            </div>
        </div>
    </div>
);

// Complete Exam Loading Skeleton
export const ExamAttemptSkeleton: React.FC = () => (
    <div className="exam-container">
        <ExamHeaderSkeleton />
        <div
            className="exam-content"
            style={{
                maxWidth: '80rem',
                margin: '0 auto',
                padding: '1rem',
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1.5rem'
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 3fr',
                    gap: '1.5rem'
                }}
            >
                <SidebarSkeleton />
                <QuestionPanelSkeleton />
            </div>
        </div>
    </div>
);

// Results Loading Skeleton
export const ResultsSkeleton: React.FC = () => (
    <div className="exam-submitted-container">
        <div
            className="exam-submitted-card"
            style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                padding: '2rem',
                maxWidth: '56rem',
                width: '100%',
                textAlign: 'center',
                maxHeight: '90vh',
                overflow: 'hidden'
            }}
        >
            {/* Success icon */}
            <Skeleton height="4rem" width="4rem" borderRadius="50%" className="mb-lg" style={{ margin: '0 auto 1rem auto' }} />

            {/* Title */}
            <Skeleton height="1.5rem" width="200px" className="mb-sm" style={{ margin: '0 auto 0.5rem auto' }} />

            {/* Exam title */}
            <Skeleton height="1.25rem" width="300px" className="mb-lg" style={{ margin: '0 auto 1rem auto' }} />

            {/* Score display */}
            <div
                style={{
                    margin: '1.5rem 0',
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '1px solid #dee2e6'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem' }}>
                    <Skeleton height="3rem" width="100px" />
                    <Skeleton height="1.5rem" width="80px" />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                    <Skeleton height="2rem" width="120px" borderRadius="6px" />
                    <Skeleton height="2rem" width="120px" borderRadius="6px" />
                </div>
            </div>

            {/* Toggle button */}
            <Skeleton height="2.5rem" width="200px" borderRadius="8px" className="mb-lg" style={{ margin: '1.5rem auto' }} />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <Skeleton height="2.5rem" width="140px" borderRadius="0.5rem" />
                <Skeleton height="2.5rem" width="120px" borderRadius="0.5rem" />
            </div>
        </div>
    </div>
);