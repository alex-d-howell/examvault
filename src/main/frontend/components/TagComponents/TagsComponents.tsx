import React from 'react';
import { useTagInput, useTags } from '../../hooks/useTags';

// Props for the main tag input component
interface TagInputProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
    className?: string;
    label?: string;
    hint?: string;
}

// Props for displaying tags (read-only)
interface TagDisplayProps {
    tags: string[];
    onTagClick?: (tag: string) => void;
    maxVisible?: number;
    className?: string;
}

// Individual tag chip component
interface TagChipProps {
    tag: string;
    onRemove?: (tag: string) => void;
    onClick?: (tag: string) => void;
    variant?: 'default' | 'clickable' | 'removable';
    size?: 'small' | 'medium';
}

// Tag chip component
export const TagChip: React.FC<TagChipProps> = ({
    tag,
    onRemove,
    onClick,
    variant = 'default',
    size = 'medium'
}) => {
    const sizeClass = size === 'small' ? 'tag-chip-small' : 'tag-chip-medium';
    const variantClass = variant === 'clickable' ? 'tag-chip-clickable' :
        variant === 'removable' ? 'tag-chip-removable' : 'tag-chip-default';

    const handleClick = () => {
        if (onClick && variant === 'clickable') {
            onClick(tag);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) {
            onRemove(tag);
        }
    };

    return (
        <span
            className={`tag-chip ${sizeClass} ${variantClass}`}
            onClick={handleClick}
            style={{ cursor: variant === 'clickable' ? 'pointer' : 'default' }}
        >
            {tag}
            {variant === 'removable' && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="tag-remove"
                    aria-label={`Remove tag ${tag}`}
                >
                    ×
                </button>
            )}
        </span>
    );
};

// Tag display component (read-only)
export const TagDisplay: React.FC<TagDisplayProps> = ({
    tags,
    onTagClick,
    maxVisible,
    className = ''
}) => {
    if (!tags || tags.length === 0) return null;

    const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
    const hiddenCount = maxVisible && tags.length > maxVisible ? tags.length - maxVisible : 0;

    return (
        <div className={`tag-display ${className}`}>
            {visibleTags.map((tag, index) => (
                <TagChip
                    key={index}
                    tag={tag}
                    variant={onTagClick ? 'clickable' : 'default'}
                    onClick={onTagClick}
                />
            ))}
            {hiddenCount > 0 && (
                <span className="tag-more">
                    +{hiddenCount} more
                </span>
            )}
        </div>
    );
};

// Main tag input component with typeahead
export const TagInput: React.FC<TagInputProps> = ({
    selectedTags,
    onTagsChange,
    placeholder = "Start typing to add tags...",
    maxTags = 10,
    className = '',
    label,
    hint
}) => {
    const { tags, addTag: addToGlobalCache } = useTags();
    const tagInput = useTagInput(selectedTags); // Pass selectedTags to hook

    const canAddMoreTags = selectedTags.length < maxTags;

    // Handle adding a tag
    const handleAddTag = (tag: string) => {
        const trimmed = tag.trim();
        if (tagInput.isValidTag(trimmed) && !selectedTags.includes(trimmed)) {
            // Add to global cache if it's a new tag
            if (!tags.includes(trimmed)) {
                addToGlobalCache(trimmed);
            }

            onTagsChange([...selectedTags, trimmed]);
            tagInput.clearTagInput();
        }
    };

    // Handle removing a tag
    const handleRemoveTag = (tagToRemove: string) => {
        onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
    };

    // Modified keyboard handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.tagInput.trim()) {
                handleAddTag(tagInput.tagInput.trim());
            }
        } else if (e.key === 'Escape') {
            tagInput.setShowTagSuggestions(false);
        }
    };

    return (
        <div className={`tag-input-component ${className}`}>
            {label && (
                <label className="form-label">
                    {label}
                    {hint && <span className="form-label-hint">{hint}</span>}
                </label>
            )}

            {/* Display selected tags */}
            {selectedTags.length > 0 && (
                <div className="selected-tags">
                    {selectedTags.map((tag, index) => (
                        <TagChip
                            key={index}
                            tag={tag}
                            variant="removable"
                            onRemove={handleRemoveTag}
                        />
                    ))}
                </div>
            )}

            {/* Tag input with typeahead */}
            {canAddMoreTags && (
                <div className="tag-input-container">
                    <input
                        type="text"
                        value={tagInput.tagInput}
                        onChange={(e) => tagInput.setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={tagInput.handleTagInputFocus}
                        onBlur={tagInput.handleTagInputBlur}
                        className="form-input tag-input"
                        placeholder={placeholder}
                        maxLength={50}
                    />

                    {/* Tag suggestions */}
                    {tagInput.showTagSuggestions && (
                        <div className="tag-suggestions">
                            {tagInput.filteredTags.slice(0, 5).map((tag, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleAddTag(tag)}
                                    className="tag-suggestion"
                                >
                                    {tag}
                                </button>
                            ))}
                            {tagInput.tagInput.trim() &&
                                tagInput.isValidTag(tagInput.tagInput.trim()) &&
                                !tagInput.filteredTags.includes(tagInput.tagInput.trim()) && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddTag(tagInput.tagInput.trim())}
                                        className="tag-suggestion tag-suggestion-new"
                                    >
                                        Create "{tagInput.tagInput.trim()}"
                                    </button>
                                )}
                        </div>
                    )}
                </div>
            )}

            <div className="tag-help-text">
                {selectedTags.length}/{maxTags} tags added
            </div>
        </div>
    );
};

// Search-specific tag input (for the exams search page)
interface TagSearchProps {
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    className?: string;
}

export const TagSearch: React.FC<TagSearchProps> = ({
    selectedTags,
    onTagsChange,
    className = ''
}) => {
    const { tags, addTag: addToGlobalCache } = useTags();
    const tagInput = useTagInput(selectedTags); // Pass selectedTags to hook

    // Handle adding a tag
    const handleAddTag = (tag: string) => {
        const trimmed = tag.trim();
        if (tagInput.isValidTag(trimmed) && !selectedTags.includes(trimmed)) {
            // Add to global cache if it's a new tag
            if (!tags.includes(trimmed)) {
                addToGlobalCache(trimmed);
            }

            onTagsChange([...selectedTags, trimmed]);
            tagInput.clearTagInput();
        }
    };

    // Handle removing a tag
    const handleRemoveTag = (tagToRemove: string) => {
        onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
    };

    // Modified keyboard handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput.tagInput.trim()) {
                handleAddTag(tagInput.tagInput.trim());
            }
        } else if (e.key === 'Escape') {
            tagInput.setShowTagSuggestions(false);
        }
    };

    return (
        <div className={`tag-search-section ${className}`}>
            <label className="tag-search-label">Filter by Tags:</label>

            {/* Display selected tags */}
            {selectedTags.length > 0 && (
                <div className="selected-tags">
                    {selectedTags.map((tag, index) => (
                        <TagChip
                            key={index}
                            tag={tag}
                            variant="removable"
                            onRemove={handleRemoveTag}
                            size="small"
                        />
                    ))}
                </div>
            )}

            {/* Tag input with typeahead */}
            <div className="tag-search-input-container">
                <input
                    type="text"
                    value={tagInput.tagInput}
                    onChange={(e) => tagInput.setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={tagInput.handleTagInputFocus}
                    onBlur={tagInput.handleTagInputBlur}
                    className="tag-search-input"
                    placeholder="Add tags to filter..."
                />

                {/* Tag suggestions */}
                {tagInput.showTagSuggestions && (
                    <div className="tag-search-suggestions">
                        {tagInput.filteredTags.slice(0, 5).map((tag, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleAddTag(tag)}
                                className="tag-search-suggestion"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};