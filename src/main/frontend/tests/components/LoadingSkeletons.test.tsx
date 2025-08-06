import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '../test-utils';

// Fix: Move mock inline to avoid hoisting issues
vi.mock('Frontend/config/constants', () => ({
    APP_CONFIG: {
        UI: {
            EXAM_CARD_MIN_WIDTH: 320
        },
        PAGINATION: {
            LOADING_SKELETON_COUNT: 8
        }
    }
}));

import { ExamCardSkeleton, ExamListSkeleton } from 'Frontend/components/LoadingSkeletons';

describe('LoadingSkeletons - Behavioral Testing', () => {
    beforeEach(() => {
        // Reset any mocks if needed
    });

    describe('ExamCardSkeleton', () => {
        it('renders without crashing', () => {
            expect(() => render(<ExamCardSkeleton />)).not.toThrow();
        });

        it('renders the basic structure', () => {
            render(<ExamCardSkeleton />);

            expect(document.querySelector('.exam-card')).toBeInTheDocument();
            expect(document.querySelector('.exam-card-header')).toBeInTheDocument();
            expect(document.querySelector('.exam-meta')).toBeInTheDocument();
            expect(document.querySelector('.exam-actions')).toBeInTheDocument();
        });

        it('renders skeleton elements', () => {
            render(<ExamCardSkeleton />);

            const skeletons = document.querySelectorAll('.skeleton');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('applies custom className when provided', () => {
            render(<ExamCardSkeleton className="custom-class" />);

            const card = document.querySelector('.exam-card');
            expect(card).toHaveClass('custom-class');
        });

        it('handles undefined className gracefully', () => {
            expect(() => render(<ExamCardSkeleton className={undefined} />)).not.toThrow();
        });
    });

    describe('ExamListSkeleton', () => {
        it('renders without crashing', () => {
            expect(() => render(<ExamListSkeleton />)).not.toThrow();
        });

        it('renders the container', () => {
            render(<ExamListSkeleton />);

            expect(document.querySelector('.exam-list-skeleton')).toBeInTheDocument();
        });

        it('renders default number of skeleton cards', () => {
            render(<ExamListSkeleton />);

            const cards = document.querySelectorAll('.exam-card');
            expect(cards.length).toBe(8); // Default count
        });

        it('renders custom number of skeleton cards', () => {
            render(<ExamListSkeleton count={5} />);

            const cards = document.querySelectorAll('.exam-card');
            expect(cards.length).toBe(5);
        });

        it('renders zero cards when count is 0', () => {
            render(<ExamListSkeleton count={0} />);

            const cards = document.querySelectorAll('.exam-card');
            expect(cards.length).toBe(0);
        });

        it('handles negative count gracefully', () => {
            render(<ExamListSkeleton count={-5} />);

            const cards = document.querySelectorAll('.exam-card');
            expect(cards.length).toBe(0);
        });

        it('applies custom className', () => {
            render(<ExamListSkeleton className="custom-list" />);

            const container = document.querySelector('.exam-list-skeleton');
            expect(container).toHaveClass('custom-list');
        });

        it('handles different layout props', () => {
            // Grid layout
            const { rerender } = render(<ExamListSkeleton layout="grid" />);
            expect(document.querySelector('.exam-list-skeleton')).toBeInTheDocument();

            // List layout
            rerender(<ExamListSkeleton layout="list" />);
            expect(document.querySelector('.exam-list-skeleton')).toBeInTheDocument();
        });

        it('handles invalid layout prop gracefully', () => {
            expect(() => render(<ExamListSkeleton layout={'invalid' as any} />)).not.toThrow();
        });

        it('handles undefined props gracefully', () => {
            expect(() => render(<ExamListSkeleton count={undefined} />)).not.toThrow();
            expect(() => render(<ExamListSkeleton className={undefined} />)).not.toThrow();
            expect(() => render(<ExamListSkeleton layout={undefined} />)).not.toThrow();
        });
    });

    describe('Integration', () => {
        it('renders multiple skeletons consistently', () => {
            render(<ExamListSkeleton count={3} />);

            const cards = document.querySelectorAll('.exam-card');
            expect(cards.length).toBe(3);

            // Each card should have the same structure
            cards.forEach(card => {
                expect(card.querySelector('.exam-card-header')).toBeInTheDocument();
                expect(card.querySelector('.exam-meta')).toBeInTheDocument();
                expect(card.querySelector('.exam-actions')).toBeInTheDocument();
            });
        });

        it('re-renders properly when props change', () => {
            const { rerender } = render(<ExamListSkeleton count={2} />);

            expect(document.querySelectorAll('.exam-card').length).toBe(2);

            rerender(<ExamListSkeleton count={4} />);

            expect(document.querySelectorAll('.exam-card').length).toBe(4);
        });
    });
});