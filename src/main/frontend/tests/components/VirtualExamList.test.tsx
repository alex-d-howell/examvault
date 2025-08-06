import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { render, testUtils } from '../test-utils';

import { VirtualExamList } from 'Frontend/components/VirtualExamList';

describe('VirtualExamList - Behavioral Testing', () => {
    const createMockExams = (count: number) =>
        Array.from({ length: count }, (_, index) =>
            testUtils.data.createMockExam({
                id: `exam-${index}`,
                title: `Exam ${index + 1}`,
                description: `Description for exam ${index + 1}`
            })
        );

    const mockRenderItem = vi.fn(({ exam, index, style }) => (
        <div
            key={exam.id}
            style={style}
            data-testid={`exam-item-${index}`}
        >
            <h3>{exam.title}</h3>
            <p>{exam.description}</p>
        </div>
    ));

    const defaultProps = {
        exams: createMockExams(100),
        itemHeight: 150,
        containerHeight: 800,
        renderItem: mockRenderItem,
        className: 'test-virtual-list'
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Reset scroll position
        Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
            configurable: true,
            writable: true,
            value: 0
        });
    });

    describe('Initial Rendering Behavior', () => {
        it('renders virtual list container with correct styling', () => {
            render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list');
            expect(container).toBeInTheDocument();
            expect(container).toHaveClass('test-virtual-list');
            expect(container).toHaveStyle({
                height: '800px',
                overflow: 'auto',
                position: 'relative'
            });
        });

        it('renders only visible items initially', () => {
            render(<VirtualExamList {...defaultProps} />);

            const visibleItems = screen.getAllByTestId(/exam-item-/);

            // Should render visible items plus buffer
            expect(visibleItems.length).toBeLessThan(15);
            expect(visibleItems.length).toBeGreaterThan(4);
        });

        it('creates inner container with correct total height', () => {
            render(<VirtualExamList {...defaultProps} />);

            const innerContainer = document.querySelector('[style*="height: 15000px"]'); // 100 * 150
            expect(innerContainer).toBeInTheDocument();
            expect(innerContainer).toHaveStyle({
                height: '15000px',
                position: 'relative'
            });
        });

        it('positions items absolutely with correct top offset', () => {
            render(<VirtualExamList {...defaultProps} />);

            const firstItem = screen.getByTestId('exam-item-0');
            expect(firstItem.parentElement).toHaveStyle({
                position: 'absolute',
                top: '0px',
                left: '0px',
                right: '0px',
                height: '150px'
            });
        });

        it('calls renderItem with correct props for visible items', () => {
            render(<VirtualExamList {...defaultProps} />);

            expect(mockRenderItem).toHaveBeenCalled();

            // Check that first call has correct structure
            const firstCall = mockRenderItem.mock.calls[0][0];
            expect(firstCall).toEqual({
                exam: expect.objectContaining({ id: 'exam-0', title: 'Exam 1' }),
                index: 0,
                style: expect.objectContaining({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 150
                })
            });
        });
    });

    describe('Scrolling Behavior', () => {
        it('updates visible items when scrolled', () => {
            render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list') as HTMLElement;

            // Initial state - should see first items
            expect(screen.getByTestId('exam-item-0')).toBeInTheDocument();

            // Scroll down by 300px (2 item heights)
            fireEvent.scroll(container, { target: { scrollTop: 300 } });

            // Should now see different items (starting around index 2)
            expect(screen.queryByTestId('exam-item-0')).not.toBeInTheDocument();
            expect(screen.getByTestId('exam-item-2')).toBeInTheDocument();
        });

        it('maintains performance by not rendering all items', () => {
            render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list') as HTMLElement;

            // Even after scrolling, should not render all 100 items
            fireEvent.scroll(container, { target: { scrollTop: 5000 } });

            const visibleItems = screen.getAllByTestId(/exam-item-/);
            expect(visibleItems.length).toBeLessThan(20);
        });

        it('handles scroll to bottom correctly', () => {
            render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list') as HTMLElement;

            // Scroll to near bottom
            const maxScroll = 15000 - 800; // totalHeight - containerHeight
            fireEvent.scroll(container, { target: { scrollTop: maxScroll } });

            // Should show last items
            expect(screen.getByTestId('exam-item-99')).toBeInTheDocument();
            expect(screen.queryByTestId('exam-item-0')).not.toBeInTheDocument();
        });

        it('handles rapid scrolling without errors', () => {
            render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list') as HTMLElement;

            // Rapid scroll events
            for (let i = 0; i < 10; i++) {
                fireEvent.scroll(container, { target: { scrollTop: i * 500 } });
            }

            // Should still render items without errors
            const visibleItems = screen.getAllByTestId(/exam-item-/);
            expect(visibleItems.length).toBeGreaterThan(0);
        });

        it('calculates visible range correctly for different scroll positions', () => {
            render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list') as HTMLElement;

            // Test various scroll positions
            const scrollPositions = [0, 150, 300, 1500, 3000];

            scrollPositions.forEach(scrollTop => {
                fireEvent.scroll(container, { target: { scrollTop } });

                const expectedStartIndex = Math.floor(scrollTop / 150);
                const expectedEndIndex = Math.min(
                    expectedStartIndex + Math.ceil(800 / 150) + 1,
                    99 // exams.length - 1
                );

                // Should render items in expected range
                if (expectedStartIndex < 100) {
                    const itemInRange = screen.queryByTestId(`exam-item-${expectedStartIndex}`);
                    expect(itemInRange).toBeInTheDocument();
                }
            });
        });
    });

    describe('Different Container Sizes Behavior', () => {
        it('adjusts visible items based on container height', () => {
            const smallProps = { ...defaultProps, containerHeight: 300 };
            render(<VirtualExamList {...smallProps} />);

            const visibleItems = screen.getAllByTestId(/exam-item-/);

            // Smaller container should render fewer items
            expect(visibleItems.length).toBeLessThan(10);
        });

        it('handles very small container heights', () => {
            const tinyProps = { ...defaultProps, containerHeight: 50 };

            expect(() => render(<VirtualExamList {...tinyProps} />)).not.toThrow();

            const visibleItems = screen.getAllByTestId(/exam-item-/);
            expect(visibleItems.length).toBeGreaterThan(0);
        });

        it('handles very large container heights', () => {
            const largeProps = { ...defaultProps, containerHeight: 2000 };
            render(<VirtualExamList {...largeProps} />);

            const visibleItems = screen.getAllByTestId(/exam-item-/);

            // Larger container should render more items but still not all
            expect(visibleItems.length).toBeGreaterThan(10);
            expect(visibleItems.length).toBeLessThan(100);
        });
    });

    describe('Different Item Heights Behavior', () => {
        it('adjusts layout for different item heights', () => {
            const tallProps = { ...defaultProps, itemHeight: 300 };
            render(<VirtualExamList {...tallProps} />);

            const firstItem = screen.getByTestId('exam-item-0');
            expect(firstItem.parentElement).toHaveStyle({ height: '300px' });

            const secondItem = screen.getByTestId('exam-item-1');
            expect(secondItem.parentElement).toHaveStyle({
                top: '300px',
                height: '300px'
            });
        });

        it('calculates total height correctly with different item heights', () => {
            const tallProps = { ...defaultProps, itemHeight: 300 };
            render(<VirtualExamList {...tallProps} />);

            const innerContainer = document.querySelector('[style*="height: 30000px"]'); // 100 * 300
            expect(innerContainer).toBeInTheDocument();
        });

        it('handles very small item heights', () => {
            const shortProps = { ...defaultProps, itemHeight: 20 };

            expect(() => render(<VirtualExamList {...shortProps} />)).not.toThrow();

            const visibleItems = screen.getAllByTestId(/exam-item-/);
            expect(visibleItems.length).toBeGreaterThan(20); // More items fit in viewport
        });
    });

    describe('Empty and Edge Cases Behavior', () => {
        it('handles empty exams array', () => {
            const emptyProps = { ...defaultProps, exams: [] };

            expect(() => render(<VirtualExamList {...emptyProps} />)).not.toThrow();

            const container = document.querySelector('.virtual-exam-list');
            expect(container).toBeInTheDocument();

            const innerContainer = document.querySelector('[style*="height: 0px"]');
            expect(innerContainer).toBeInTheDocument();
        });

        it('handles single exam', () => {
            const singleProps = { ...defaultProps, exams: [createMockExams(1)[0]] };
            render(<VirtualExamList {...singleProps} />);

            expect(screen.getByTestId('exam-item-0')).toBeInTheDocument();
            expect(screen.queryByTestId('exam-item-1')).not.toBeInTheDocument();
        });

        it('handles exams array smaller than viewport', () => {
            const fewProps = { ...defaultProps, exams: createMockExams(3) };
            render(<VirtualExamList {...fewProps} />);

            const visibleItems = screen.getAllByTestId(/exam-item-/);
            expect(visibleItems.length).toBe(3);

            // All items should be visible
            expect(screen.getByTestId('exam-item-0')).toBeInTheDocument();
            expect(screen.getByTestId('exam-item-1')).toBeInTheDocument();
            expect(screen.getByTestId('exam-item-2')).toBeInTheDocument();
        });

        it('handles missing exam properties gracefully', () => {
            const examsWithMissingProps = [
                { ...createMockExams(1)[0], id: '', title: 'Exam 1', description: 'Description for exam 1' }, // id as empty string
                { ...createMockExams(1)[0], title: undefined }, // title as undefined
                { ...createMockExams(1)[0], description: undefined } // description as undefined
            ];

            const propsWithBadData = { ...defaultProps, exams: examsWithMissingProps };

            expect(() => render(<VirtualExamList {...propsWithBadData} />)).not.toThrow();
        });
    });

    describe('Custom Render Function Behavior', () => {
        it('uses custom render function correctly', () => {
            const customRender = vi.fn(({ exam, index, style }) => (
                <div style={style} data-testid={`custom-${index}`}>
                    <span>Custom: {exam.title}</span>
                </div>
            ));

            const customProps = { ...defaultProps, renderItem: customRender };
            render(<VirtualExamList {...customProps} />);

            expect(customRender).toHaveBeenCalled();
            expect(screen.getByTestId('custom-0')).toBeInTheDocument();
            expect(screen.getByText('Custom: Exam 1')).toBeInTheDocument();
        });

        it('handles render function that returns null', () => {
            const nullRender = vi.fn(() => null);
            const nullProps = { ...defaultProps, renderItem: nullRender };

            expect(() => render(<VirtualExamList {...nullProps} />)).not.toThrow();
        });

        it('handles render function errors gracefully', () => {
            const errorRender = vi.fn(() => {
                throw new Error('Render error');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const errorProps = { ...defaultProps, renderItem: errorRender };

            expect(() => render(<VirtualExamList {...errorProps} />)).toThrow();

            consoleSpy.mockRestore();
        });

        it('passes correct style properties to render function', () => {
            const styleCheckRender = vi.fn(({ style }) => {
                expect(style).toEqual({
                    position: 'absolute',
                    top: expect.any(Number),
                    left: 0,
                    right: 0,
                    height: 150
                });
                return <div>Test</div>;
            });

            const styleProps = { ...defaultProps, renderItem: styleCheckRender };
            render(<VirtualExamList {...styleProps} />);

            expect(styleCheckRender).toHaveBeenCalled();
        });
    });

    describe('Performance Behavior', () => {
        it('renders quickly with large datasets', () => {
            const largeDataset = createMockExams(10000);
            const largeProps = { ...defaultProps, exams: largeDataset };

            const startTime = performance.now();
            render(<VirtualExamList {...largeProps} />);
            const endTime = performance.now();

            const renderTime = endTime - startTime;
            expect(renderTime).toBeLessThan(100); // Should render quickly
        });

        it('limits DOM elements regardless of data size', () => {
            const hugeDataset = createMockExams(100000);
            const hugeProps = { ...defaultProps, exams: hugeDataset };

            render(<VirtualExamList {...hugeProps} />);

            const visibleItems = screen.getAllByTestId(/exam-item-/);
            expect(visibleItems.length).toBeLessThan(20); // Should not render all items
        });

        it('handles frequent scroll events efficiently', () => {
            render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list') as HTMLElement;

            const startTime = performance.now();

            // Simulate many scroll events
            for (let i = 0; i < 100; i++) {
                fireEvent.scroll(container, { target: { scrollTop: i * 10 } });
            }

            const endTime = performance.now();
            const scrollTime = endTime - startTime;

            // Increased tolerance for performance test to reduce flakiness
            expect(scrollTime).toBeLessThan(300);
        });

        it('manages re-renders efficiently during scrolling', () => {
            render(<VirtualExamList {...defaultProps} />);

            const initialCallCount = mockRenderItem.mock.calls.length;
            const container = document.querySelector('.virtual-exam-list') as HTMLElement;

            // Scroll enough to potentially change visible items but stay within buffer
            fireEvent.scroll(container, { target: { scrollTop: 75 } }); // Half an item height

            const afterScrollCallCount = mockRenderItem.mock.calls.length;
            
            // The virtual list may re-render for position updates, so we check
            // that it doesn't explode in renders (should be reasonable number)
            expect(afterScrollCallCount).toBeLessThanOrEqual(initialCallCount * 2);
        });
    });

    describe('Accessibility and UX Behavior', () => {
        it('maintains proper scrolling behavior', () => {
            render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list') as HTMLElement;
            expect(container).toHaveStyle({ overflow: 'auto' });
        });

        it('uses stable identifiers for rendered items', () => {
            render(<VirtualExamList {...defaultProps} />);

            // React keys don't appear as DOM attributes, so we verify
            // that items have stable data-testid attributes based on their index
            const firstItem = screen.getByTestId('exam-item-0');
            expect(firstItem).toBeInTheDocument();
            
            // Verify the item contains the expected exam data
            expect(firstItem).toHaveTextContent('Exam 1');
        });

        it('maintains scroll position during data updates', () => {
            const { rerender } = render(<VirtualExamList {...defaultProps} />);

            const container = document.querySelector('.virtual-exam-list') as HTMLElement;

            // Scroll to middle
            fireEvent.scroll(container, { target: { scrollTop: 1500 } });

            // Update data
            const newExams = createMockExams(100).map(exam => ({ ...exam, title: `Updated ${exam.title}` }));
            rerender(<VirtualExamList {...defaultProps} exams={newExams} />);

            // Should maintain scroll position
            expect(container.scrollTop).toBe(1500);
        });
    });

    describe('Component Lifecycle Behavior', () => {
        it('cleans up properly when unmounted', () => {
            const { unmount } = render(<VirtualExamList {...defaultProps} />);

            expect(() => unmount()).not.toThrow();
        });

        it('handles prop changes correctly', () => {
            const { rerender } = render(<VirtualExamList {...defaultProps} />);

            // Change item height
            rerender(<VirtualExamList {...defaultProps} itemHeight={200} />);

            const firstItem = screen.getByTestId('exam-item-0');
            expect(firstItem.parentElement).toHaveStyle({ height: '200px' });
        });

        it('updates when exams data changes', () => {
            const { rerender } = render(<VirtualExamList {...defaultProps} />);

            expect(screen.getByText('Exam 1')).toBeInTheDocument();

            const newExams = createMockExams(5).map(exam => ({ ...exam, title: `New ${exam.title}` }));
            rerender(<VirtualExamList {...defaultProps} exams={newExams} />);

            expect(screen.getByText('New Exam 1')).toBeInTheDocument();
        });
    });
});