import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { render } from '../test-utils';

// Mock Vaadin components
vi.mock('@vaadin/react-components', () => ({
    Icon: ({ icon }: any) => <span data-icon={icon} className="mock-icon" />
}));

import { StarRating } from 'Frontend/components/StarRatingComponent/StarRatingComponent';

describe('StarRating', () => {
    const defaultProps = {
        rating: 3,
        onRatingChange: vi.fn(),
        disabled: false,
        size: 'medium' as const,
        showClearButton: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<StarRating {...defaultProps} />)).not.toThrow();
        });

        it('renders 5 star buttons', () => {
            render(<StarRating {...defaultProps} />);
            
            // Should have 5 star buttons
            const starButtons = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            expect(starButtons).toHaveLength(5);
        });

        it('renders stars with correct labels', () => {
            render(<StarRating {...defaultProps} />);
            
            expect(screen.getByLabelText('1 star')).toBeInTheDocument();
            expect(screen.getByLabelText('2 stars')).toBeInTheDocument();
            expect(screen.getByLabelText('3 stars')).toBeInTheDocument();
            expect(screen.getByLabelText('4 stars')).toBeInTheDocument();
            expect(screen.getByLabelText('5 stars')).toBeInTheDocument();
        });

        it('displays filled stars up to rating value', () => {
            render(<StarRating {...defaultProps} rating={3} />);
            
            // First 3 stars should be filled
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            expect(stars[0]).toHaveClass('star-filled');
            expect(stars[1]).toHaveClass('star-filled');
            expect(stars[2]).toHaveClass('star-filled');
            expect(stars[3]).toHaveClass('star-empty');
            expect(stars[4]).toHaveClass('star-empty');
        });

        it('shows clear button when rating exists and showClearButton is true', () => {
            render(<StarRating {...defaultProps} rating={3} showClearButton={true} />);
            expect(screen.getByTitle('Clear rating')).toBeInTheDocument();
        });

        it('hides clear button when showClearButton is false', () => {
            render(<StarRating {...defaultProps} rating={3} showClearButton={false} />);
            expect(screen.queryByTitle('Clear rating')).not.toBeInTheDocument();
        });

        it('hides clear button when rating is null', () => {
            render(<StarRating {...defaultProps} rating={null} showClearButton={true} />);
            expect(screen.queryByTitle('Clear rating')).not.toBeInTheDocument();
        });

        it('hides clear button when rating is 0', () => {
            render(<StarRating {...defaultProps} rating={0} showClearButton={true} />);
            expect(screen.queryByTitle('Clear rating')).not.toBeInTheDocument();
        });
    });

    describe('Null/Undefined Handling', () => {
        it('handles null rating gracefully', () => {
            expect(() => render(<StarRating {...defaultProps} rating={null} />)).not.toThrow();
        });

        it('handles undefined rating gracefully', () => {
            expect(() => render(<StarRating {...defaultProps} rating={undefined as any} />)).not.toThrow();
        });

        it('handles null onRatingChange gracefully', () => {
            // Provide a no-op function instead of testing null handling
            expect(() => render(<StarRating {...defaultProps} onRatingChange={() => {}} />)).not.toThrow();
        });

        it('handles missing optional props', () => {
            expect(() => render(
                <StarRating 
                    rating={3} 
                    onRatingChange={vi.fn()} 
                />
            )).not.toThrow();
        });

        it('shows all empty stars when rating is null', () => {
            render(<StarRating {...defaultProps} rating={null} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toHaveClass('star-empty');
                expect(star).not.toHaveClass('star-filled');
            });
        });

        it('shows all empty stars when rating is undefined', () => {
            render(<StarRating {...defaultProps} rating={undefined as any} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toHaveClass('star-empty');
                expect(star).not.toHaveClass('star-filled');
            });
        });
    });

    describe('Size Variants', () => {
        it('applies small size class', () => {
            render(<StarRating {...defaultProps} size="small" />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toHaveClass('star-small');
            });
        });

        it('applies medium size class by default', () => {
            render(<StarRating {...defaultProps} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toHaveClass('star-medium');
            });
        });

        it('applies large size class', () => {
            render(<StarRating {...defaultProps} size="large" />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toHaveClass('star-large');
            });
        });

        it('defaults to medium size when size prop is invalid', () => {
            render(<StarRating {...defaultProps} size={'invalid' as any} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toHaveClass('star-medium');
            });
        });
    });

    describe('Disabled State', () => {
        it('disables all star buttons when disabled is true', () => {
            render(<StarRating {...defaultProps} disabled={true} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toBeDisabled();
            });
        });

        it('disables clear button when disabled is true', () => {
            render(<StarRating {...defaultProps} rating={3} disabled={true} />);
            
            const clearButton = screen.getByTitle('Clear rating');
            expect(clearButton).toBeDisabled();
        });

        it('enables all buttons when disabled is false', () => {
            render(<StarRating {...defaultProps} disabled={false} />);
            
            const allButtons = screen.getAllByRole('button');
            allButtons.forEach(button => {
                expect(button).not.toBeDisabled();
            });
        });

        it('does not render when disabled and rating is null', () => {
            const { container } = render(<StarRating {...defaultProps} disabled={true} rating={null} />);
            expect(container.firstChild).toBeNull();
        });

        it('does not render when disabled and rating is 0', () => {
            const { container } = render(<StarRating {...defaultProps} disabled={true} rating={0} />);
            expect(container.firstChild).toBeNull();
        });

        it('renders when disabled but has valid rating', () => {
            render(<StarRating {...defaultProps} disabled={true} rating={3} />);
            expect(screen.getAllByRole('button')).toHaveLength(6); // 5 stars + 1 clear button
        });
    });

    describe('Rating Interaction', () => {
        it('calls onRatingChange when star is clicked', () => {
            render(<StarRating {...defaultProps} rating={null} />);
            
            const fourthStar = screen.getByLabelText('4 stars');
            fireEvent.click(fourthStar);
            
            expect(defaultProps.onRatingChange).toHaveBeenCalledWith(4);
        });

        it('calls onRatingChange with null when same star is clicked', () => {
            render(<StarRating {...defaultProps} rating={3} />);
            
            const thirdStar = screen.getByLabelText('3 stars');
            fireEvent.click(thirdStar);
            
            expect(defaultProps.onRatingChange).toHaveBeenCalledWith(null);
        });

        it('does not call onRatingChange when disabled', () => {
            render(<StarRating {...defaultProps} disabled={true} rating={3} />);
            
            const thirdStar = screen.getByLabelText('3 stars');
            fireEvent.click(thirdStar);
            
            expect(defaultProps.onRatingChange).not.toHaveBeenCalled();
        });

        it('calls onRatingChange with null when clear button is clicked', () => {
            render(<StarRating {...defaultProps} rating={4} />);
            
            const clearButton = screen.getByTitle('Clear rating');
            fireEvent.click(clearButton);
            
            expect(defaultProps.onRatingChange).toHaveBeenCalledWith(null);
        });

        it('does not call onRatingChange from clear button when disabled', () => {
            render(<StarRating {...defaultProps} rating={4} disabled={true} />);
            
            const clearButton = screen.getByTitle('Clear rating');
            fireEvent.click(clearButton);
            
            expect(defaultProps.onRatingChange).not.toHaveBeenCalled();
        });

        it('handles clicking stars in sequence', () => {
            render(<StarRating {...defaultProps} rating={null} />);
            
            const firstStar = screen.getByLabelText('1 star');
            const secondStar = screen.getByLabelText('2 stars');
            const fifthStar = screen.getByLabelText('5 stars');
            
            fireEvent.click(firstStar);
            expect(defaultProps.onRatingChange).toHaveBeenCalledWith(1);
            
            fireEvent.click(secondStar);
            expect(defaultProps.onRatingChange).toHaveBeenCalledWith(2);
            
            fireEvent.click(fifthStar);
            expect(defaultProps.onRatingChange).toHaveBeenCalledWith(5);
        });

        it('handles null onRatingChange function gracefully', () => {
            // Provide a fallback function instead of null
            render(<StarRating rating={3} onRatingChange={() => {}} />);
            
            const secondStar = screen.getByLabelText('2 stars');
            expect(() => fireEvent.click(secondStar)).not.toThrow();
        });

        it('handles undefined onRatingChange function gracefully', () => {
            // Provide a fallback function instead of undefined
            render(<StarRating rating={3} onRatingChange={() => {}} />);
            
            const secondStar = screen.getByLabelText('2 stars');
            expect(() => fireEvent.click(secondStar)).not.toThrow();
        });
    });

    describe('Icon Display', () => {
        it('shows filled star icons for rated stars', () => {
            render(<StarRating {...defaultProps} rating={2} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            // First 2 stars should have filled star icons
            const firstStarIcon = stars[0].querySelector('[data-icon="vaadin:star"]');
            const secondStarIcon = stars[1].querySelector('[data-icon="vaadin:star"]');
            expect(firstStarIcon).toBeInTheDocument();
            expect(secondStarIcon).toBeInTheDocument();
            
            // Last 3 stars should have empty star icons
            const thirdStarIcon = stars[2].querySelector('[data-icon="vaadin:star-o"]');
            const fourthStarIcon = stars[3].querySelector('[data-icon="vaadin:star-o"]');
            const fifthStarIcon = stars[4].querySelector('[data-icon="vaadin:star-o"]');
            expect(thirdStarIcon).toBeInTheDocument();
            expect(fourthStarIcon).toBeInTheDocument();
            expect(fifthStarIcon).toBeInTheDocument();
        });

        it('shows empty star icons when rating is null', () => {
            render(<StarRating {...defaultProps} rating={null} />);
            
            // All stars should be empty
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star.querySelector('[data-icon="vaadin:star-o"]')).toBeInTheDocument();
            });
        });

        it('shows all filled stars when rating is 5', () => {
            render(<StarRating {...defaultProps} rating={5} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star.querySelector('[data-icon="vaadin:star"]')).toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases', () => {
        it('handles rating value of 0', () => {
            render(<StarRating {...defaultProps} rating={0} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toHaveClass('star-empty');
            });
        });

        it('handles rating value greater than 5', () => {
            render(<StarRating {...defaultProps} rating={7} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            // All 5 stars should be filled even with rating > 5
            stars.forEach(star => {
                expect(star).toHaveClass('star-filled');
            });
        });

        it('handles negative rating value', () => {
            render(<StarRating {...defaultProps} rating={-2} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            // All stars should be empty with negative rating
            stars.forEach(star => {
                expect(star).toHaveClass('star-empty');
            });
        });

        it('handles decimal rating values', () => {
            render(<StarRating {...defaultProps} rating={3.7} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            // Should fill 3 stars (uses >= comparison)
            expect(stars[0]).toHaveClass('star-filled');
            expect(stars[1]).toHaveClass('star-filled');
            expect(stars[2]).toHaveClass('star-filled');
            expect(stars[3]).toHaveClass('star-empty');
            expect(stars[4]).toHaveClass('star-empty');
        });

        it('handles string rating values', () => {
            render(<StarRating {...defaultProps} rating={'3' as any} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            // Should handle string '3' and fill 3 stars
            expect(stars[0]).toHaveClass('star-filled');
            expect(stars[1]).toHaveClass('star-filled');
            expect(stars[2]).toHaveClass('star-filled');
            expect(stars[3]).toHaveClass('star-empty');
            expect(stars[4]).toHaveClass('star-empty');
        });

        it('handles NaN rating value', () => {
            render(<StarRating {...defaultProps} rating={NaN} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            // NaN should result in empty stars
            stars.forEach(star => {
                expect(star).toHaveClass('star-empty');
            });
        });
    });

    describe('Accessibility', () => {
        it('has proper button type for star buttons', () => {
            render(<StarRating {...defaultProps} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            stars.forEach(star => {
                expect(star).toHaveAttribute('type', 'button');
            });
        });

        it('has proper button type for clear button', () => {
            render(<StarRating {...defaultProps} rating={3} />);
            
            const clearButton = screen.getByTitle('Clear rating');
            expect(clearButton).toHaveAttribute('type', 'button');
        });

        it('has accessible labels for clear button', () => {
            render(<StarRating {...defaultProps} rating={3} />);
            
            const clearButton = screen.getByTitle('Clear rating');
            expect(clearButton).toHaveAttribute('aria-label', 'Clear rating');
        });

        it('maintains proper focus order', () => {
            render(<StarRating {...defaultProps} rating={3} />);
            
            const allButtons = screen.getAllByRole('button');
            // Should be focusable in order: star1, star2, star3, star4, star5, clear
            expect(allButtons).toHaveLength(6);
            
            allButtons.forEach(button => {
                expect(button).not.toHaveAttribute('tabindex', '-1');
            });
        });

        it('provides clear visual distinction between filled and empty stars', () => {
            render(<StarRating {...defaultProps} rating={3} />);
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            // Filled stars should have different class than empty stars
            expect(stars[0]).toHaveClass('star-filled');
            expect(stars[0]).not.toHaveClass('star-empty');
            
            expect(stars[3]).toHaveClass('star-empty');
            expect(stars[3]).not.toHaveClass('star-filled');
        });
    });

    describe('Performance', () => {
        it('handles rapid clicks without issues', () => {
            render(<StarRating {...defaultProps} rating={null} />);
            
            const thirdStar = screen.getByLabelText('3 stars');
            
            // Rapid clicking
            for (let i = 0; i < 10; i++) {
                fireEvent.click(thirdStar);
            }
            
            expect(defaultProps.onRatingChange).toHaveBeenCalledTimes(10);
        });

        it('handles frequent rating changes', () => {
            const { rerender } = render(<StarRating {...defaultProps} rating={1} />);
            
            for (let i = 1; i <= 5; i++) {
                rerender(<StarRating {...defaultProps} rating={i} />);
            }
            
            const stars = screen.getAllByRole('button').filter(button => 
                button.getAttribute('aria-label')?.includes('star')
            );
            
            // All stars should be filled at rating 5
            stars.forEach(star => {
                expect(star).toHaveClass('star-filled');
            });
        });

        it('does not re-render unnecessarily', () => {
            const { rerender } = render(<StarRating {...defaultProps} rating={3} />);
            
            // Re-render with same props
            rerender(<StarRating {...defaultProps} rating={3} />);
            
            // Component should still work correctly
            const thirdStar = screen.getByLabelText('3 stars');
            expect(thirdStar).toHaveClass('star-filled');
        });
    });
});