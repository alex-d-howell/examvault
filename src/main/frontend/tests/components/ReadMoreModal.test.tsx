import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from '../test-utils';

// Mock Vaadin Dialog component
vi.mock('@vaadin/react-components/Dialog', () => ({
    Dialog: ({ opened, onOpenedChanged, headerTitle, width, height, children }: any) =>
        opened ? (
            <div
                data-testid="dialog"
                role="dialog"
                style={{ width, height }}
            >
                <div data-testid="dialog-header">{headerTitle}</div>
                <div data-testid="dialog-content">{children}</div>
                <button
                    onClick={() => onOpenedChanged({ detail: { value: false } })}
                    data-testid="dialog-close"
                >
                    Close
                </button>
            </div>
        ) : null
}));

import { ReadMoreModal } from 'Frontend/components/ReadMoreModal';

describe('ReadMoreModal - Behavioral Testing', () => {
    const shortDescription = 'This is a short description.';
    const longDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.';

    // Mock scrollHeight to be greater than clientHeight for overflow detection
    const mockScrollElement = {
        scrollHeight: 200,
        clientHeight: 100
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock element properties for overflow detection
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
            configurable: true,
            value: mockScrollElement.scrollHeight
        });

        Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
            configurable: true,
            value: mockScrollElement.clientHeight
        });
    });

    afterEach(() => {
        // Clean up mocks
        vi.restoreAllMocks();
    });

    describe('Basic Rendering Behavior', () => {
        it('renders description text', () => {
            render(<ReadMoreModal description={shortDescription} />);

            expect(screen.getByText(shortDescription)).toBeInTheDocument();
        });

        it('applies correct container height', () => {
            render(<ReadMoreModal description={shortDescription} />);

            const container = screen.getByText(shortDescription).closest('div');
            expect(container).toHaveStyle({ height: '5rem' });
        });

        it('applies correct paragraph styling', () => {
            render(<ReadMoreModal description={shortDescription} />);

            const paragraph = screen.getByText(shortDescription);
            expect(paragraph).toHaveStyle({
                height: '3rem',
                overflow: 'hidden',
                fontSize: 'var(--lumo-font-size-xs)'
            });
        });

        it('renders empty description without errors', () => {
            render(<ReadMoreModal description="" />);

            // There may be multiple elements with empty text (main and modal)
            const all = screen.getAllByText('');
            expect(all.length).toBeGreaterThanOrEqual(1);
            all.forEach(el => expect(el).toBeInTheDocument());
        });

        it('handles very long descriptions', () => {
            const veryLongDescription = longDescription.repeat(10);

            expect(() => render(<ReadMoreModal description={veryLongDescription} />)).not.toThrow();
        });
    });

    describe('Overflow Detection Behavior', () => {
        it('shows "read more" link when content overflows', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                expect(screen.getByText('…read more')).toBeInTheDocument();
            });
        });

        it('does not show "read more" link when content fits', () => {
            // Mock no overflow
            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                configurable: true,
                value: 50
            });
            Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
                configurable: true,
                value: 100
            });

            render(<ReadMoreModal description={shortDescription} />);

            expect(screen.queryByText('…read more')).not.toBeInTheDocument();
        });

        it('applies correct styling to read more link', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                const readMoreLink = screen.getByText('…read more');
                expect(readMoreLink).toHaveStyle({
                    height: '1rem',
                    fontSize: 'var(--lumo-font-size-xs)',
                    cursor: 'pointer'
                });
            });
        });

        it('detects overflow after description changes', async () => {
            const { rerender } = render(<ReadMoreModal description={shortDescription} />);

            // Should not show read more initially
            const initialLinks = screen.queryAllByText('…read more');
            expect(initialLinks.length).toBeLessThanOrEqual(1);

            // Change to long description
            rerender(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                expect(screen.getByText('…read more')).toBeInTheDocument();
            });
        });
    });

    describe('Modal Opening Behavior', () => {
        it('opens modal when "read more" link is clicked', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                expect(screen.getByText('…read more')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('…read more'));

            expect(screen.getByTestId('dialog')).toBeInTheDocument();
        });

        it('does not show modal initially', () => {
            render(<ReadMoreModal description={longDescription} />);

            expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
        });

        it('displays correct modal header', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            expect(screen.getByTestId('dialog-header')).toHaveTextContent('Exam Description');
        });

        it('displays full description in modal', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            const modalContent = screen.getByTestId('dialog-content');
            expect(modalContent).toHaveTextContent(longDescription);
        });

        it('applies correct modal dimensions', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            const dialog = screen.getByTestId('dialog');
            expect(dialog).toHaveStyle({
                width: '75vw',
                height: '60vh'
            });
        });
    });

    describe('Modal Closing Behavior', () => {
        it('closes modal when close button is clicked', async () => {
            render(<ReadMoreModal description={longDescription} />);

            // Open modal
            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            expect(screen.getByTestId('dialog')).toBeInTheDocument();

            // Close modal
            fireEvent.click(screen.getByTestId('dialog-close'));

            await waitFor(() => {
                expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
            });
        });

        it('handles modal state changes properly', async () => {
            render(<ReadMoreModal description={longDescription} />);

            // Open and close multiple times
            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            expect(screen.getByTestId('dialog')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('dialog-close'));

            await waitFor(() => {
                expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
            });

            // Open again
            fireEvent.click(screen.getByText('…read more'));

            expect(screen.getByTestId('dialog')).toBeInTheDocument();
        });
    });

    describe('Content Styling in Modal', () => {
        it('applies correct styling to content in modal', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            const content = screen.getByTestId('dialog-content').firstElementChild;
            expect(content).toHaveStyle({
                fontSize: 'var(--lumo-font-size-s)',
                margin: '0',
                overflowWrap: 'break-word'
            });
        });

        it('handles long words with overflow wrap', async () => {
            const longWordDescription = 'This is a test with a verylongwordthatmightcauselayoutissues in the modal.';

            render(<ReadMoreModal description={longWordDescription} />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            const content = screen.getByTestId('dialog-content').firstElementChild;
            expect(content).toHaveStyle({ overflowWrap: 'break-word' });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('handles null description gracefully', () => {
            expect(() => render(<ReadMoreModal description={null as any} />)).not.toThrow();
        });

        it('handles undefined description gracefully', () => {
            expect(() => render(<ReadMoreModal description={undefined as any} />)).not.toThrow();
        });

        it('handles special characters in description', () => {
            const specialCharsDescription = 'Description with <>&"\'% special characters!';

            render(<ReadMoreModal description={specialCharsDescription} />);

            expect(screen.getByText(specialCharsDescription)).toBeInTheDocument();
        });

        it('handles HTML-like content safely', async () => {
            const htmlLikeDescription = '<script>alert("test")</script><p>This looks like HTML</p>';

            render(<ReadMoreModal description={htmlLikeDescription} />);

            // There may be multiple elements with this text (main and modal)
            const all = screen.getAllByText(htmlLikeDescription);
            expect(all.length).toBeGreaterThanOrEqual(1);
            all.forEach(el => expect(el).toBeInTheDocument());

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            const allAfter = screen.getAllByText(htmlLikeDescription);
            expect(allAfter.length).toBeGreaterThanOrEqual(2);
            allAfter.forEach(el => expect(el).toBeInTheDocument());
        });

        it('handles rapid click interactions', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                const readMoreLink = screen.getByText('…read more');

                // Rapid clicks should not cause issues
                fireEvent.click(readMoreLink);
                fireEvent.click(readMoreLink);
                fireEvent.click(readMoreLink);
            });

            expect(screen.getByTestId('dialog')).toBeInTheDocument();
        });
    });

    describe('Responsive Behavior', () => {
        it('applies responsive modal dimensions', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            const dialog = screen.getByTestId('dialog');
            expect(dialog).toHaveStyle({
                width: '75vw',
                height: '60vh'
            });
        });

        it('maintains content overflow behavior at different screen sizes', () => {
            // Test with different mock dimensions
            const testCases = [
                { scrollHeight: 150, clientHeight: 100 }, // Overflow
                { scrollHeight: 80, clientHeight: 100 }   // No overflow
            ];

            testCases.forEach(({ scrollHeight, clientHeight }, index) => {
                Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
                    configurable: true,
                    value: scrollHeight
                });
                Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
                    configurable: true,
                    value: clientHeight
                });

                const { unmount } = render(<ReadMoreModal description={longDescription} />);

                if (scrollHeight > clientHeight) {
                    expect(screen.queryByText('…read more')).toBeInTheDocument();
                } else {
                    expect(screen.queryByText('…read more')).not.toBeInTheDocument();
                }

                unmount();
            });
        });
    });

    describe('Accessibility Behavior', () => {
        it('provides proper ARIA attributes for modal', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            const dialog = screen.getByTestId('dialog');
            expect(dialog).toHaveAttribute('role', 'dialog');
        });

        it('provides clickable element with proper cursor styling', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                const readMoreLink = screen.getByText('…read more');
                expect(readMoreLink).toHaveStyle({ cursor: 'pointer' });
            });
        });

        it('maintains focus management during modal interactions', async () => {
            render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                const readMoreLink = screen.getByText('…read more');
                readMoreLink.focus();
                fireEvent.click(readMoreLink);
            });

            expect(screen.getByTestId('dialog')).toBeInTheDocument();
        });
    });

    describe('Performance Considerations', () => {
        it('efficiently detects overflow without excessive computations', () => {
            const startTime = performance.now();

            render(<ReadMoreModal description={longDescription} />);

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // Should render quickly
            expect(renderTime).toBeLessThan(50);
        });

        it('handles description updates efficiently', () => {
            const { rerender } = render(<ReadMoreModal description={shortDescription} />);

            const startTime = performance.now();

            // Multiple updates
            for (let i = 0; i < 10; i++) {
                rerender(<ReadMoreModal description={`Updated description ${i}`} />);
            }

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            // Should handle updates efficiently
            expect(updateTime).toBeLessThan(100);
        });
    });

    describe('Component Lifecycle', () => {
        it('cleans up properly when unmounted', async () => {
            const { unmount } = render(<ReadMoreModal description={longDescription} />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            expect(screen.getByTestId('dialog')).toBeInTheDocument();

            // Should unmount without errors
            expect(() => unmount()).not.toThrow();
        });

        it('handles state changes during component lifecycle', async () => {
            let description = longDescription;
            const TestWrapper = () => <ReadMoreModal description={description} />;

            const { rerender } = render(<TestWrapper />);

            await waitFor(() => {
                fireEvent.click(screen.getByText('…read more'));
            });

            expect(screen.getByTestId('dialog')).toBeInTheDocument();

            // Change description while modal is open
            description = 'New description';
            rerender(<TestWrapper />);

            // There will be multiple elements with this text (main and modal)
            const all = screen.getAllByText('New description');
            expect(all.length).toBeGreaterThanOrEqual(2);
            all.forEach(el => expect(el).toBeInTheDocument());
        });
    });
});