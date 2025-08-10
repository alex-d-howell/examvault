import React, { useState } from 'react';
import {
    Button,
    TextField,
    Select,
    Details,
    Icon,
    IntegerField,
    DatePicker
} from '@vaadin/react-components';
import { TagSearch } from '../TagComponents/TagsComponents';
import './AdvancedSearchComponent.css';

interface SearchFilters {
    title: string;
    uploadedBy: string;
    tags: string[];
    startDate: string;
    endDate: string;
    minQuestions: number | null;
    maxQuestions: number | null;
    sortBy: string;
}

interface AdvancedSearchProps {
    onSearch: (filters: SearchFilters) => void;
    onClear: () => void;
    className?: string;
}

export const AdvancedSearchComponent: React.FC<AdvancedSearchProps> = ({
    onSearch,
    onClear,
    className = ''
}) => {
    // Filter states
    const [filters, setFilters] = useState<SearchFilters>({
        title: '',
        uploadedBy: '',
        tags: [],
        startDate: '',
        endDate: '',
        minQuestions: null,
        maxQuestions: null,
        sortBy: 'date'
    });

    // UI states
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const updateFilter = (key: keyof SearchFilters, value: any) => {
        setFilters(prev => {
            // Special handling for tags to ensure type safety
            if (key === 'tags' && Array.isArray(value)) {
                const validTags = value.filter((tag): tag is string =>
                    typeof tag === 'string' && tag.length > 0
                );
                return {
                    ...prev,
                    [key]: validTags
                };
            }
            return {
                ...prev,
                [key]: value
            };
        });
    };

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            onSearch(filters);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        const clearedFilters: SearchFilters = {
            title: '',
            uploadedBy: '',
            tags: [], // Ensure this is an empty string array, not undefined
            startDate: '',
            endDate: '',
            minQuestions: null,
            maxQuestions: null,
            sortBy: 'date'
        };
        setFilters(clearedFilters);
        onClear();
    };

    const hasFilters = Object.values(filters).some(value =>
        Array.isArray(value) ? value.length > 0 : value !== '' && value !== null
    );

    const sortOptions = [
        { label: 'Newest First', value: 'date' },
        { label: 'Title A-Z', value: 'title' },
        { label: 'Author A-Z', value: 'author' },
        { label: 'Most Questions', value: 'questions' },
        { label: 'Most Comments', value: 'comments' }
    ];

    return (
        <div className={`advanced-search-container ${className}`}>
            {/* Quick Search Bar */}
            <div className="quick-search-section">
                <div className="quick-search-row">
                    <TextField
                        label="Search exams"
                        value={filters.title}
                        onValueChanged={(e) => updateFilter('title', e.detail.value)}
                        placeholder="Search by exam title..."
                        clearButtonVisible
                        className="quick-search-input"
                    >
                        <Icon slot="prefix" icon="vaadin:search" />
                    </TextField>

                    <Select
                        label="Sort by"
                        value={filters.sortBy}
                        onValueChanged={(e) => updateFilter('sortBy', e.detail.value)}
                        className="sort-select"
                        items={sortOptions}
                    />

                    <Button
                        onClick={handleSearch}
                        theme="primary"
                        disabled={isLoading}
                        className="search-button"
                    >
                        <Icon slot="prefix" icon="vaadin:search" />
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </div>
            </div>

            {/* Advanced Filters Toggle */}
            <Details
                summary="Advanced Filters"
                opened={isAdvancedOpen}
                onOpenedChanged={(e) => setIsAdvancedOpen(e.detail.value)}
                className="advanced-filters-section"
            >
                <div className="advanced-filters-content">
                    {/* Author Row */}
                    <div className="filter-row">
                        <TextField
                            label="Filter by Author"
                            value={filters.uploadedBy}
                            onValueChanged={(e) => updateFilter('uploadedBy', e.detail.value)}
                            placeholder="Author email or name..."
                            clearButtonVisible
                            className="filter-field"
                        >
                            <Icon slot="prefix" icon="vaadin:user" />
                        </TextField>
                    </div>

                    {/* Tag Search */}
                    <div className="filter-row">
                        <TagSearch
                            selectedTags={filters.tags}
                            onTagsChange={(tags: (string | undefined)[]) => {
                                // Filter out any undefined values and ensure only valid strings
                                const validTags: string[] = tags.filter((tag): tag is string =>
                                    tag !== undefined && tag !== null && typeof tag === 'string' && tag.trim().length > 0
                                );
                                updateFilter('tags', validTags);
                            }}
                            className="tag-filter"
                        />
                    </div>

                    {/* Date Range Row */}
                    <div className="filter-row">
                        <DatePicker
                            label="Uploaded From"
                            value={filters.startDate}
                            onValueChanged={(e) => updateFilter('startDate', e.detail.value)}
                            className="filter-field"
                            max={filters.endDate || undefined}
                        />

                        <DatePicker
                            label="Uploaded To"
                            value={filters.endDate}
                            onValueChanged={(e) => updateFilter('endDate', e.detail.value)}
                            className="filter-field"
                            min={filters.startDate || undefined}
                        />
                    </div>

                    {/* Question Count Row */}
                    <div className="filter-row">
                        <IntegerField
                            label="Min Questions"
                            value={filters.minQuestions?.toString() || ''}
                            onValueChanged={(e) => updateFilter('minQuestions',
                                e.detail.value ? parseInt(e.detail.value) : null)}
                            placeholder="0"
                            min={0}
                            max={filters.maxQuestions || 1000}
                            className="filter-field"
                        >
                            <Icon slot="prefix" icon="vaadin:arrow-up" />
                        </IntegerField>

                        <IntegerField
                            label="Max Questions"
                            value={filters.maxQuestions?.toString() || ''}
                            onValueChanged={(e) => updateFilter('maxQuestions',
                                e.detail.value ? parseInt(e.detail.value) : null)}
                            placeholder="∞"
                            min={filters.minQuestions || 0}
                            max={1000}
                            className="filter-field"
                        >
                            <Icon slot="prefix" icon="vaadin:arrow-down" />
                        </IntegerField>
                    </div>

                    {/* Action Buttons */}
                    <div className="filter-actions">
                        <Button
                            onClick={handleSearch}
                            theme="primary"
                            disabled={isLoading}
                            className="action-button"
                        >
                            <Icon slot="prefix" icon="vaadin:search" />
                            Apply Filters
                        </Button>

                        {hasFilters && (
                            <Button
                                onClick={handleClear}
                                theme="tertiary"
                                className="action-button"
                            >
                                <Icon slot="prefix" icon="vaadin:refresh" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
            </Details>

            {/* Active Filters Display */}
            {hasFilters && (
                <div className="active-filters">
                    <span className="active-filters-label">Active filters:</span>
                    <div className="active-filter-chips">
                        {filters.title && (
                            <span className="filter-chip">
                                Title: "{filters.title}"
                                <button onClick={() => updateFilter('title', '')}>x</button>
                            </span>
                        )}
                        {filters.uploadedBy && (
                            <span className="filter-chip">
                                Author: "{filters.uploadedBy}"
                                <button onClick={() => updateFilter('uploadedBy', '')}>x</button>
                            </span>
                        )}
                        {filters.tags.map(tag => (
                            <span key={tag} className="filter-chip">
                                Tag: {tag}
                                <button onClick={() => updateFilter('tags',
                                    filters.tags.filter((t): t is string => t !== tag && t !== undefined))}>x</button>
                            </span>
                        ))}
                        {(filters.startDate || filters.endDate) && (
                            <span className="filter-chip">
                                Date: {filters.startDate || '∞'} - {filters.endDate || '∞'}
                                <button onClick={() => {
                                    updateFilter('startDate', '');
                                    updateFilter('endDate', '');
                                }}>x</button>
                            </span>
                        )}
                        {(filters.minQuestions !== null || filters.maxQuestions !== null) && (
                            <span className="filter-chip">
                                Questions: {filters.minQuestions || 0} - {filters.maxQuestions || '∞'}
                                <button onClick={() => {
                                    updateFilter('minQuestions', null);
                                    updateFilter('maxQuestions', null);
                                }}>x</button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};