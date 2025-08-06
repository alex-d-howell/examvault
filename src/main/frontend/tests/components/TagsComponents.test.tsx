import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { render } from '../test-utils';

// Mock the custom hooks
const mockUseTags = {
    tags: ['react', 'javascript', 'typescript', 'node'] as string[],
    addTag: vi.fn()
};

const mockUseTagInput = {
    tagInput: '',
    setTagInput: vi.fn(),
    showTagSuggestions: false,
    setShowTagSuggestions: vi.fn(),
    filteredTags: [] as string[],
    isValidTag: vi.fn((tag: string) => tag && tag.length > 0 && tag.length <= 50),
    clearTagInput: vi.fn(),
    handleTagInputFocus: vi.fn(),
    handleTagInputBlur: vi.fn()
};

vi.mock('../../hooks/useTags', () => ({
    useTags: vi.fn(() => mockUseTags),
    useTagInput: vi.fn(() => mockUseTagInput)
}));

import { useTags, useTagInput } from '../../hooks/useTags';
import { TagChip, TagDisplay, TagInput, TagSearch } from 'Frontend/components/TagComponents/TagsComponents';

describe('TagChip', () => {
    const defaultProps = {
        tag: 'javascript',
        variant: 'default' as const,
        size: 'medium' as const
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<TagChip {...defaultProps} />)).not.toThrow();
        });

        it('displays tag text', () => {
            render(<TagChip {...defaultProps} />);
            expect(screen.getByText('javascript')).toBeInTheDocument();
        });

        it('applies default variant class', () => {
            const { container } = render(<TagChip {...defaultProps} />);
            expect(container.firstChild).toHaveClass('tag-chip-default');
        });

        it('applies medium size class by default', () => {
            const { container } = render(<TagChip {...defaultProps} />);
            expect(container.firstChild).toHaveClass('tag-chip-medium');
        });

        it('handles missing optional props', () => {
            expect(() => render(<TagChip tag="test" />)).not.toThrow();
        });

        it('handles null tag gracefully', () => {
            expect(() => render(<TagChip tag={null as any} />)).not.toThrow();
        });

        it('handles undefined tag gracefully', () => {
            expect(() => render(<TagChip tag={undefined as any} />)).not.toThrow();
        });
    });

    describe('Variants', () => {
        it('applies clickable variant class and cursor', () => {
            const { container } = render(<TagChip {...defaultProps} variant="clickable" />);
            const chip = container.firstChild as HTMLElement;
            expect(chip).toHaveClass('tag-chip-clickable');
            expect(chip).toHaveStyle('cursor: pointer');
        });

        it('applies removable variant class', () => {
            const { container } = render(<TagChip {...defaultProps} variant="removable" />);
            expect(container.firstChild).toHaveClass('tag-chip-removable');
        });

        it('shows remove button for removable variant', () => {
            render(<TagChip {...defaultProps} variant="removable" />);
            expect(screen.getByText('x')).toBeInTheDocument();
            expect(screen.getByLabelText('Remove tag javascript')).toBeInTheDocument();
        });

        it('does not show remove button for non-removable variants', () => {
            render(<TagChip {...defaultProps} variant="default" />);
            expect(screen.queryByText('x')).not.toBeInTheDocument();
        });
    });

    describe('Sizes', () => {
        it('applies small size class', () => {
            const { container } = render(<TagChip {...defaultProps} size="small" />);
            expect(container.firstChild).toHaveClass('tag-chip-small');
        });

        it('applies medium size class', () => {
            const { container } = render(<TagChip {...defaultProps} size="medium" />);
            expect(container.firstChild).toHaveClass('tag-chip-medium');
        });
    });

    describe('Click Interaction', () => {
        it('calls onClick when clickable variant is clicked', () => {
            const mockOnClick = vi.fn();
            render(<TagChip {...defaultProps} variant="clickable" onClick={mockOnClick} />);

            fireEvent.click(screen.getByText('javascript'));
            expect(mockOnClick).toHaveBeenCalledWith('javascript');
        });

        it('does not call onClick for non-clickable variants', () => {
            const mockOnClick = vi.fn();
            render(<TagChip {...defaultProps} variant="default" onClick={mockOnClick} />);

            fireEvent.click(screen.getByText('javascript'));
            expect(mockOnClick).not.toHaveBeenCalled();
        });

        it('handles null onClick gracefully', () => {
            render(<TagChip {...defaultProps} variant="clickable" onClick={null as any} />);
            expect(() => fireEvent.click(screen.getByText('javascript'))).not.toThrow();
        });
    });

    describe('Remove Interaction', () => {
        it('calls onRemove when remove button is clicked', () => {
            const mockOnRemove = vi.fn();
            render(<TagChip {...defaultProps} variant="removable" onRemove={mockOnRemove} />);

            fireEvent.click(screen.getByText('x'));
            expect(mockOnRemove).toHaveBeenCalledWith('javascript');
        });

        it('stops propagation when remove button is clicked', () => {
            const mockOnRemove = vi.fn();
            const mockOnClick = vi.fn();

            render(
                <div onClick={mockOnClick}>
                    <TagChip {...defaultProps} variant="removable" onRemove={mockOnRemove} />
                </div>
            );

            fireEvent.click(screen.getByText('x'));
            expect(mockOnRemove).toHaveBeenCalled();
            expect(mockOnClick).not.toHaveBeenCalled();
        });

        it('handles null onRemove gracefully', () => {
            render(<TagChip {...defaultProps} variant="removable" onRemove={null as any} />);
            expect(() => fireEvent.click(screen.getByText('x'))).not.toThrow();
        });
    });
});

describe('TagDisplay', () => {
    const defaultProps = {
        tags: ['react', 'javascript', 'typescript'] as string[],
        className: 'test-class'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<TagDisplay {...defaultProps} />)).not.toThrow();
        });

        it('displays all tags when no maxVisible limit', () => {
            render(<TagDisplay {...defaultProps} />);
            expect(screen.getByText('react')).toBeInTheDocument();
            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.getByText('typescript')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(<TagDisplay {...defaultProps} />);
            expect(container.firstChild).toHaveClass('test-class');
        });

        it('handles missing optional props', () => {
            expect(() => render(<TagDisplay tags={['test'] as string[]} />)).not.toThrow();
        });

        it('returns null when tags array is empty', () => {
            const { container } = render(<TagDisplay tags={[] as string[]} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when tags is null', () => {
            const { container } = render(<TagDisplay tags={null as any} />);
            expect(container.firstChild).toBeNull();
        });

        it('returns null when tags is undefined', () => {
            const { container } = render(<TagDisplay tags={undefined as any} />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('MaxVisible Functionality', () => {
        it('limits displayed tags when maxVisible is set', () => {
            render(<TagDisplay {...defaultProps} maxVisible={2} />);

            expect(screen.getByText('react')).toBeInTheDocument();
            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.queryByText('typescript')).not.toBeInTheDocument();
        });

        it('shows "more" indicator when tags exceed maxVisible', () => {
            render(<TagDisplay {...defaultProps} maxVisible={2} />);
            expect(screen.getByText('+1 more')).toBeInTheDocument();
        });

        it('does not show "more" indicator when tags do not exceed maxVisible', () => {
            render(<TagDisplay {...defaultProps} maxVisible={5} />);
            expect(screen.queryByText('+2 more')).not.toBeInTheDocument();
        });

        it('handles maxVisible larger than tags array', () => {
            render(<TagDisplay {...defaultProps} maxVisible={10} />);

            expect(screen.getByText('react')).toBeInTheDocument();
            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.getByText('typescript')).toBeInTheDocument();
            expect(screen.queryByText('more')).not.toBeInTheDocument();
        });

        it('handles maxVisible of 0', () => {
            render(<TagDisplay {...defaultProps} maxVisible={0} />);
            expect(screen.getByText('+3 more')).toBeInTheDocument();
            expect(screen.queryByText('react')).not.toBeInTheDocument();
        });
    });

    describe('Click Interaction', () => {
        it('makes tags clickable when onTagClick is provided', () => {
            const mockOnTagClick = vi.fn();
            render(<TagDisplay {...defaultProps} onTagClick={mockOnTagClick} />);

            fireEvent.click(screen.getByText('react'));
            expect(mockOnTagClick).toHaveBeenCalledWith('react');
        });

        it('does not make tags clickable when onTagClick is not provided', () => {
            const { container } = render(<TagDisplay {...defaultProps} />);
            const chip = container.querySelector('.tag-chip');
            expect(chip).not.toHaveStyle('cursor: pointer');
        });

        it('handles null onTagClick gracefully', () => {
            render(<TagDisplay {...defaultProps} onTagClick={null as any} />);
            expect(() => fireEvent.click(screen.getByText('react'))).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('handles empty string tags', () => {
            render(<TagDisplay tags={['', 'valid', ''] as string[]} />);
            expect(screen.getByText('valid')).toBeInTheDocument();
        });

        it('handles mixed valid and invalid tags', () => {
            const mixedTags: string[] = ['valid', 'another-valid'];
            render(<TagDisplay tags={mixedTags} />);

            expect(screen.getByText('valid')).toBeInTheDocument();
            expect(screen.getByText('another-valid')).toBeInTheDocument();
        });
    });
});

describe('TagInput', () => {
    const defaultProps = {
        selectedTags: ['react'] as string[],
        onTagsChange: vi.fn(),
        placeholder: 'Add tags...',
        maxTags: 5,
        className: 'test-class',
        label: 'Tags',
        hint: 'Press Enter to add'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mocks to default state
        (useTags as any).mockReturnValue(mockUseTags);
        (useTagInput as any).mockReturnValue(mockUseTagInput);
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<TagInput {...defaultProps} />)).not.toThrow();
        });

        it('displays label and hint', () => {
            render(<TagInput {...defaultProps} />);
            expect(screen.getByText('Tags')).toBeInTheDocument();
            expect(screen.getByText('Press Enter to add')).toBeInTheDocument();
        });

        it('displays selected tags', () => {
            render(<TagInput {...defaultProps} />);
            expect(screen.getByText('react')).toBeInTheDocument();
        });

        it('shows tag input field when under max tags', () => {
            render(<TagInput {...defaultProps} selectedTags={['react'] as string[]} maxTags={5} />);
            expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
        });

        it('hides tag input field when at max tags', () => {
            render(<TagInput {...defaultProps} selectedTags={['a', 'b', 'c', 'd', 'e'] as string[]} maxTags={5} />);
            expect(screen.queryByPlaceholderText('Add tags...')).not.toBeInTheDocument();
        });

        it('displays tag count', () => {
            render(<TagInput {...defaultProps} selectedTags={['react', 'vue'] as string[]} maxTags={5} />);
            expect(screen.getByText('2/5 tags added')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(<TagInput {...defaultProps} />);
            expect(container.firstChild).toHaveClass('test-class');
        });

        it('handles missing optional props', () => {
            expect(() => render(
                <TagInput
                    selectedTags={[] as string[]}
                    onTagsChange={vi.fn()}
                />
            )).not.toThrow();
        });
    });

    describe('Tag Addition', () => {
        it('calls onTagsChange when Enter is pressed with valid tag', () => {
            const mockOnTagsChange = vi.fn();
            mockUseTagInput.tagInput = 'new-tag';
            mockUseTagInput.isValidTag = vi.fn(() => true);

            render(<TagInput {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={[] as string[]} />);

            const input = screen.getByPlaceholderText('Add tags...');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(mockOnTagsChange).toHaveBeenCalledWith(['new-tag']);
        });

        it('does not add duplicate tags', () => {
            const mockOnTagsChange = vi.fn();
            mockUseTagInput.tagInput = 'react';
            mockUseTagInput.isValidTag = vi.fn(() => true);

            render(<TagInput {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={['react'] as string[]} />);

            const input = screen.getByPlaceholderText('Add tags...');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(mockOnTagsChange).not.toHaveBeenCalled();
        });

        it('does not add invalid tags', () => {
            const mockOnTagsChange = vi.fn();
            mockUseTagInput.tagInput = '';
            mockUseTagInput.isValidTag = vi.fn(() => false);

            render(<TagInput {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={[] as string[]} />);

            const input = screen.getByPlaceholderText('Add tags...');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(mockOnTagsChange).not.toHaveBeenCalled();
        });

        it('trims whitespace from tags before adding', () => {
            const mockOnTagsChange = vi.fn();
            mockUseTagInput.tagInput = '  spaced-tag  ';
            mockUseTagInput.isValidTag = vi.fn(() => true);

            render(<TagInput {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={[] as string[]} />);

            const input = screen.getByPlaceholderText('Add tags...');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(mockOnTagsChange).toHaveBeenCalledWith(['spaced-tag']);
        });

        it('adds tag to global cache when it is new', () => {
            mockUseTagInput.tagInput = 'new-global-tag';
            mockUseTagInput.isValidTag = vi.fn(() => true);
            mockUseTags.tags = ['existing'] as string[];

            render(<TagInput {...defaultProps} selectedTags={[] as string[]} />);

            const input = screen.getByPlaceholderText('Add tags...');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(mockUseTags.addTag).toHaveBeenCalledWith('new-global-tag');
        });

        it('does not add to global cache if tag already exists', () => {
            mockUseTagInput.tagInput = 'existing';
            mockUseTagInput.isValidTag = vi.fn(() => true);
            mockUseTags.tags = ['existing'] as string[];

            render(<TagInput {...defaultProps} selectedTags={[] as string[]} />);

            const input = screen.getByPlaceholderText('Add tags...');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(mockUseTags.addTag).not.toHaveBeenCalled();
        });
    });

    describe('Tag Removal', () => {
        it('removes tag when remove button is clicked', () => {
            const mockOnTagsChange = vi.fn();
            render(<TagInput {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={['react', 'vue'] as string[]} />);

            // Find the remove button for 'react' tag
            const reactTag = screen.getByText('react').closest('.tag-chip');
            const removeButton = reactTag?.querySelector('button');

            if (removeButton) {
                fireEvent.click(removeButton);
                expect(mockOnTagsChange).toHaveBeenCalledWith(['vue']);
            }
        });

        it('handles removing the only tag', () => {
            const mockOnTagsChange = vi.fn();
            render(<TagInput {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={['react'] as string[]} />);

            const reactTag = screen.getByText('react').closest('.tag-chip');
            const removeButton = reactTag?.querySelector('button');

            if (removeButton) {
                fireEvent.click(removeButton);
                expect(mockOnTagsChange).toHaveBeenCalledWith([]);
            }
        });
    });

    describe('Keyboard Interaction', () => {
        it('clears suggestions when Escape is pressed', () => {
            render(<TagInput {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add tags...');
            fireEvent.keyDown(input, { key: 'Escape' });

            expect(mockUseTagInput.setShowTagSuggestions).toHaveBeenCalledWith(false);
        });

        it('prevents default when Enter is pressed', () => {
            render(<TagInput {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add tags...');
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            input.dispatchEvent(event);
            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('handles focus and blur events', () => {
            render(<TagInput {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add tags...');

            fireEvent.focus(input);
            expect(mockUseTagInput.handleTagInputFocus).toHaveBeenCalled();

            fireEvent.blur(input);
            expect(mockUseTagInput.handleTagInputBlur).toHaveBeenCalled();
        });
    });

    describe('Suggestions', () => {
        it('shows suggestions when showTagSuggestions is true', () => {
            mockUseTagInput.showTagSuggestions = true;
            mockUseTagInput.filteredTags = ['javascript', 'typescript'] as string[];

            render(<TagInput {...defaultProps} />);

            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.getByText('typescript')).toBeInTheDocument();
        });

        it('hides suggestions when showTagSuggestions is false', () => {
            mockUseTagInput.showTagSuggestions = false;
            mockUseTagInput.filteredTags = ['javascript', 'typescript'] as string[];

            render(<TagInput {...defaultProps} />);

            expect(screen.queryByText('javascript')).not.toBeInTheDocument();
            expect(screen.queryByText('typescript')).not.toBeInTheDocument();
        });

        it('shows create new tag suggestion when input is valid and not in filtered tags', () => {
            mockUseTagInput.showTagSuggestions = true;
            mockUseTagInput.tagInput = 'new-tag';
            mockUseTagInput.filteredTags = ['existing-tag'] as string[];
            mockUseTagInput.isValidTag = vi.fn(() => true);

            render(<TagInput {...defaultProps} />);

            expect(screen.getByText('Create "new-tag"')).toBeInTheDocument();
        });

        it('clicks suggestion to add tag', () => {
            const mockOnTagsChange = vi.fn();
            mockUseTagInput.showTagSuggestions = true;
            mockUseTagInput.filteredTags = ['javascript'] as string[];

            render(<TagInput {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={[] as string[]} />);

            fireEvent.click(screen.getByText('javascript'));
            expect(mockOnTagsChange).toHaveBeenCalledWith(['javascript']);
        });
    });

    describe('Null/Undefined Handling', () => {
        it('handles null selectedTags', () => {
            expect(() => render(
                <TagInput {...defaultProps} selectedTags={null as any} />
            )).not.toThrow();
        });

        it('handles undefined onTagsChange', () => {
            expect(() => render(
                <TagInput {...defaultProps} onTagsChange={undefined as any} />
            )).not.toThrow();
        });

        it('handles null useTags hook result', () => {
            (useTags as any).mockReturnValue(null);
            expect(() => render(<TagInput {...defaultProps} />)).not.toThrow();
        });

        it('handles null useTagInput hook result', () => {
            (useTagInput as any).mockReturnValue(null);
            expect(() => render(<TagInput {...defaultProps} />)).not.toThrow();
        });
    });
});

describe('TagSearch', () => {
    const defaultProps = {
        selectedTags: ['react'] as string[],
        onTagsChange: vi.fn(),
        className: 'test-class'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useTags as any).mockReturnValue(mockUseTags);
        (useTagInput as any).mockReturnValue(mockUseTagInput);
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<TagSearch {...defaultProps} />)).not.toThrow();
        });

        it('displays search label', () => {
            render(<TagSearch {...defaultProps} />);
            expect(screen.getByText('Filter by Tags:')).toBeInTheDocument();
        });

        it('displays selected tags', () => {
            render(<TagSearch {...defaultProps} />);
            expect(screen.getByText('react')).toBeInTheDocument();
        });

        it('shows search input', () => {
            render(<TagSearch {...defaultProps} />);
            expect(screen.getByPlaceholderText('Add tags to filter...')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(<TagSearch {...defaultProps} />);
            expect(container.firstChild).toHaveClass('test-class');
        });

        it('handles missing optional props', () => {
            expect(() => render(
                <TagSearch
                    selectedTags={[] as string[]}
                    onTagsChange={vi.fn()}
                />
            )).not.toThrow();
        });
    });

    describe('Tag Management', () => {
        it('adds tags via suggestions', () => {
            const mockOnTagsChange = vi.fn();
            mockUseTagInput.showTagSuggestions = true;
            mockUseTagInput.filteredTags = ['javascript'] as string[];

            render(<TagSearch {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={[] as string[]} />);

            fireEvent.click(screen.getByText('javascript'));
            expect(mockOnTagsChange).toHaveBeenCalledWith(['javascript']);
        });

        it('removes tags via chip buttons', () => {
            const mockOnTagsChange = vi.fn();
            render(<TagSearch {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={['react', 'vue'] as string[]} />);

            const reactTag = screen.getByText('react').closest('.tag-chip');
            const removeButton = reactTag?.querySelector('button');

            if (removeButton) {
                fireEvent.click(removeButton);
                expect(mockOnTagsChange).toHaveBeenCalledWith(['vue']);
            }
        });

        it('uses small size for tag chips', () => {
            const { container } = render(<TagSearch {...defaultProps} />);
            expect(container.querySelector('.tag-chip-small')).toBeInTheDocument();
        });
    });

    describe('Suggestions Behavior', () => {
        it('shows suggestions when focused', () => {
            mockUseTagInput.showTagSuggestions = true;
            mockUseTagInput.filteredTags = ['javascript', 'typescript'] as string[];

            render(<TagSearch {...defaultProps} />);

            expect(screen.getByText('javascript')).toBeInTheDocument();
            expect(screen.getByText('typescript')).toBeInTheDocument();
        });

        it('limits suggestions to 5 items', () => {
            mockUseTagInput.showTagSuggestions = true;
            mockUseTagInput.filteredTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'] as string[];

            render(<TagSearch {...defaultProps} />);

            expect(screen.getByText('tag1')).toBeInTheDocument();
            expect(screen.getByText('tag5')).toBeInTheDocument();
            expect(screen.queryByText('tag6')).not.toBeInTheDocument();
        });
    });

    describe('Keyboard Interaction', () => {
        it('adds tag on Enter key', () => {
            const mockOnTagsChange = vi.fn();
            mockUseTagInput.tagInput = 'new-tag';
            mockUseTagInput.isValidTag = vi.fn(() => true);

            render(<TagSearch {...defaultProps} onTagsChange={mockOnTagsChange} selectedTags={[] as string[]} />);

            const input = screen.getByPlaceholderText('Add tags to filter...');
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(mockOnTagsChange).toHaveBeenCalledWith(['new-tag']);
        });

        it('closes suggestions on Escape key', () => {
            render(<TagSearch {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add tags to filter...');
            fireEvent.keyDown(input, { key: 'Escape' });

            expect(mockUseTagInput.setShowTagSuggestions).toHaveBeenCalledWith(false);
        });
    });

    describe('Edge Cases', () => {
        it('handles null selectedTags', () => {
            expect(() => render(
                <TagSearch {...defaultProps} selectedTags={null as any} />
            )).not.toThrow();
        });

        it('handles null onTagsChange', () => {
            expect(() => render(
                <TagSearch {...defaultProps} onTagsChange={null as any} />
            )).not.toThrow();
        });

        it('handles empty selectedTags array', () => {
            render(<TagSearch {...defaultProps} selectedTags={[] as string[]} />);
            expect(screen.getByText('Filter by Tags:')).toBeInTheDocument();
        });

        it('handles hook failures gracefully', () => {
            (useTags as any).mockImplementation(() => {
                throw new Error('Hook failed');
            });

            expect(() => render(<TagSearch {...defaultProps} />)).not.toThrow();
        });
    });

    describe('Integration with Hooks', () => {
        it('calls useTagInput with selectedTags', () => {
            render(<TagSearch {...defaultProps} selectedTags={['react', 'vue'] as string[]} />);
            expect(useTagInput).toHaveBeenCalledWith(['react', 'vue']);
        });

        it('calls useTags hook', () => {
            render(<TagSearch {...defaultProps} />);
            expect(useTags).toHaveBeenCalled();
        });

        it('uses hook functions for input management', () => {
            render(<TagSearch {...defaultProps} />);

            const input = screen.getByPlaceholderText('Add tags to filter...');

            fireEvent.focus(input);
            expect(mockUseTagInput.handleTagInputFocus).toHaveBeenCalled();

            fireEvent.blur(input);
            expect(mockUseTagInput.handleTagInputBlur).toHaveBeenCalled();

            fireEvent.change(input, { target: { value: 'test' } });
            expect(mockUseTagInput.setTagInput).toHaveBeenCalledWith('test');
        });
    });
});