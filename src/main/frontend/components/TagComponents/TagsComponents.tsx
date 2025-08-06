import React from 'react';
import { useTagInput, useTags } from '../../hooks/useTags';

// ========== TagChip ==========
interface TagChipProps {
  tag: string;
  onRemove?: (tag: string) => void;
  onClick?: (tag: string) => void;
  variant?: 'default' | 'clickable' | 'removable';
  size?: 'small' | 'medium';
}

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  onRemove,
  onClick,
  variant = 'default',
  size = 'medium'
}) => {
  const sizeClass = size === 'small' ? 'tag-chip-small' : 'tag-chip-medium';
  const variantClass = variant === 'clickable'
    ? 'tag-chip-clickable'
    : variant === 'removable'
      ? 'tag-chip-removable'
      : 'tag-chip-default';

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
          x
        </button>
      )}
    </span>
  );
};

// ========== TagDisplay ==========
interface TagDisplayProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
  maxVisible?: number;
  className?: string;
}

export const TagDisplay: React.FC<TagDisplayProps> = ({
  tags,
  onTagClick,
  maxVisible,
  className = ''
}) => {
  if (!Array.isArray(tags) || tags.length === 0) return null;

  const hasMax = typeof maxVisible === 'number';
  const visibleTags = hasMax ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = hasMax && tags.length > maxVisible! ? tags.length - maxVisible! : 0;

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

// ========== TagInput ==========
interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  label?: string;
  hint?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = "Start typing to add tags...",
  maxTags = 10,
  className = '',
  label,
  hint
}) => {
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];

  let tagsResult;
  try {
    tagsResult = useTags();
  } catch {
    tagsResult = null;
  }
  const {
    tags = [],
    addTag: addToGlobalCache = () => {}
  } = tagsResult ?? {};

  let tagInputResult;
  try {
    tagInputResult = useTagInput(safeSelectedTags);
  } catch {
    tagInputResult = null;
  }
  const {
    tagInput = '',
    setTagInput = () => {},
    showTagSuggestions = false,
    setShowTagSuggestions = () => {},
    filteredTags = [],
    isValidTag = () => false,
    clearTagInput = () => {},
    handleTagInputFocus = () => {},
    handleTagInputBlur = () => {}
  } = tagInputResult ?? {};

  const canAddMoreTags = safeSelectedTags.length < maxTags;

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (isValidTag(trimmed) && !safeSelectedTags.includes(trimmed)) {
      if (!tags.includes(trimmed)) {
        addToGlobalCache(trimmed);
      }
      onTagsChange([...safeSelectedTags, trimmed]);
      clearTagInput();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(safeSelectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput.trim());
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
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

      {safeSelectedTags.length > 0 && (
        <div className="selected-tags">
          {safeSelectedTags.map((tag, index) => (
            <TagChip
              key={index}
              tag={tag}
              variant="removable"
              onRemove={handleRemoveTag}
            />
          ))}
        </div>
      )}

      {canAddMoreTags && (
        <div className="tag-input-container">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleTagInputFocus}
            onBlur={handleTagInputBlur}
            className="form-input tag-input"
            placeholder={placeholder}
            maxLength={50}
          />
          {showTagSuggestions && (
            <div className="tag-suggestions">
              {filteredTags.slice(0, 5).map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="tag-suggestion"
                >
                  {tag}
                </button>
              ))}
              {tagInput.trim() &&
                isValidTag(tagInput.trim()) &&
                !filteredTags.includes(tagInput.trim()) && (
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput.trim())}
                    className="tag-suggestion tag-suggestion-new"
                  >
                    Create "{tagInput.trim()}"
                  </button>
                )}
            </div>
          )}
        </div>
      )}

      <div className="tag-help-text">
        {safeSelectedTags.length}/{maxTags} tags added
      </div>
    </div>
  );
};

// ========== TagSearch ==========
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
  const safeSelectedTags = Array.isArray(selectedTags) ? selectedTags : [];

  let tagsResult;
  try {
    tagsResult = useTags();
  } catch {
    tagsResult = null;
  }
  const {
    tags = [],
    addTag: addToGlobalCache = () => {}
  } = tagsResult ?? {};

  let tagInputResult;
  try {
    tagInputResult = useTagInput(safeSelectedTags);
  } catch {
    tagInputResult = null;
  }
  const {
    tagInput = '',
    setTagInput = () => {},
    showTagSuggestions = false,
    setShowTagSuggestions = () => {},
    filteredTags = [],
    isValidTag = () => false,
    clearTagInput = () => {},
    handleTagInputFocus = () => {},
    handleTagInputBlur = () => {}
  } = tagInputResult ?? {};

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (isValidTag(trimmed) && !safeSelectedTags.includes(trimmed)) {
      if (!tags.includes(trimmed)) {
        addToGlobalCache(trimmed);
      }
      onTagsChange([...safeSelectedTags, trimmed]);
      clearTagInput();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(safeSelectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput.trim());
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  return (
    <div className={`tag-search-section ${className}`}>
      <label className="tag-search-label">Filter by Tags:</label>

      {safeSelectedTags.length > 0 && (
        <div className="selected-tags">
          {safeSelectedTags.map((tag, index) => (
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

      <div className="tag-search-input-container">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleTagInputFocus}
          onBlur={handleTagInputBlur}
          className="tag-search-input"
          placeholder="Add tags to filter..."
        />

        {showTagSuggestions && (
          <div className="tag-search-suggestions">
            {filteredTags.slice(0, 5).map((tag, index) => (
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
