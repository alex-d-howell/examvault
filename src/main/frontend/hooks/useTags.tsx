import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { ExamService } from 'Frontend/generated/endpoints';

// Define types
interface TagsContextType {
    tags: string[];
    loading: boolean;
    error: Error | null;
    addTag: (newTag: string) => void;
    refreshTags: () => Promise<void>;
    
    // Enhanced tag management functionality
    useTagInput: () => TagInputHook;
}

interface TagsProviderProps {
    children: ReactNode;
}

// Enhanced tag input hook interface
interface TagInputHook {
    // Tag input state
    tagInput: string;
    setTagInput: (value: string) => void;
    showTagSuggestions: boolean;
    setShowTagSuggestions: (show: boolean) => void;
    filteredTags: string[];
    
    // Tag management for a specific exam/entity
    selectedTags: string[];
    setSelectedTags: (tags: string[]) => void;
    
    // Helper functions
    addTagToSelection: (tag: string) => void;
    removeTagFromSelection: (tag: string) => void;
    handleTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleTagInputFocus: () => void;
    handleTagInputBlur: () => void;
    clearTagInput: () => void;
    
    // Validation
    isValidTag: (tag: string) => boolean;
    getTagValidationError: (tag: string) => string | null;
}

// Create a context for tags with default value
const TagsContext = createContext<TagsContextType | undefined>(undefined);

// Tags provider component
export function TagsProvider({ children }: TagsProviderProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadTags = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedTags = await ExamService.getAllTags();
                // Filter out any undefined values and ensure we have string[]
                const validTags = (fetchedTags || []).filter((tag): tag is string => tag != null && tag !== undefined);
                setTags(validTags);
                console.log('Tags loaded globally:', validTags?.length || 0, 'tags');
            } catch (err) {
                console.error('Error loading tags:', err);
                setError(err instanceof Error ? err : new Error('Unknown error occurred'));
                setTags([]); // Fallback to empty array
            } finally {
                setLoading(false);
            }
        };

        loadTags();
    }, []);

    // Function to add a new tag to the cache (when user creates a new tag)
    const addTag = (newTag: string): void => {
        if (newTag && !tags.includes(newTag)) {
            setTags(prev => [...prev, newTag].sort());
        }
    };

    // Function to refresh tags (in case we need to reload them)
    const refreshTags = async (): Promise<void> => {
        try {
            setLoading(true);
            const fetchedTags = await ExamService.getAllTags();
            // Filter out any undefined values and ensure we have string[]
            const validTags = (fetchedTags || []).filter((tag): tag is string => tag != null && tag !== undefined);
            setTags(validTags);
        } catch (err) {
            console.error('Error refreshing tags:', err);
            setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        } finally {
            setLoading(false);
        }
    };

    // Enhanced tag input hook
    const useTagInput = (): TagInputHook => {
        const [tagInput, setTagInput] = useState<string>('');
        const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);
        const [filteredTags, setFilteredTags] = useState<string[]>([]);
        const [selectedTags, setSelectedTags] = useState<string[]>([]);

        // Filter tags based on input and selection
        useEffect(() => {
            if (tagInput.length > 0) {
                const filtered = tags.filter(tag => 
                    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
                    !selectedTags.includes(tag)
                );
                setFilteredTags(filtered);
                setShowTagSuggestions(filtered.length > 0);
            } else {
                setShowTagSuggestions(false);
                setFilteredTags([]);
            }
        }, [tagInput, selectedTags]);

        // Tag validation
        const isValidTag = (tag: string): boolean => {
            const trimmed = tag.trim();
            return trimmed.length > 0 && 
                   trimmed.length <= 50 && 
                   trimmed.match(/^[a-zA-Z0-9\s\-_]+$/) !== null;
        };

        const getTagValidationError = (tag: string): string | null => {
            const trimmed = tag.trim();
            if (!trimmed) return 'Tag cannot be empty';
            if (trimmed.length > 50) return 'Tag cannot exceed 50 characters';
            if (!trimmed.match(/^[a-zA-Z0-9\s\-_]+$/)) {
                return 'Tag can only contain letters, numbers, spaces, hyphens, and underscores';
            }
            if (selectedTags.includes(trimmed)) return 'Tag already added';
            return null;
        };

        // Add tag to selection
        const addTagToSelection = (tag: string): void => {
            const trimmed = tag.trim();
            if (isValidTag(trimmed) && !selectedTags.includes(trimmed)) {
                setSelectedTags(prev => [...prev, trimmed]);
                
                // Add to global cache if it's a new tag
                if (!tags.includes(trimmed)) {
                    addTag(trimmed);
                }
                
                setTagInput('');
                setShowTagSuggestions(false);
            }
        };

        // Remove tag from selection
        const removeTagFromSelection = (tagToRemove: string): void => {
            setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
        };

        // Handle keyboard events
        const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (tagInput.trim()) {
                    addTagToSelection(tagInput.trim());
                }
            } else if (e.key === 'Escape') {
                setShowTagSuggestions(false);
            }
        };

        // Handle focus
        const handleTagInputFocus = (): void => {
            if (filteredTags.length > 0) {
                setShowTagSuggestions(true);
            }
        };

        // Handle blur with delay to allow clicking suggestions
        const handleTagInputBlur = (): void => {
            setTimeout(() => setShowTagSuggestions(false), 200);
        };

        // Clear input
        const clearTagInput = (): void => {
            setTagInput('');
            setShowTagSuggestions(false);
        };

        return {
            tagInput,
            setTagInput,
            showTagSuggestions,
            setShowTagSuggestions,
            filteredTags,
            selectedTags,
            setSelectedTags,
            addTagToSelection,
            removeTagFromSelection,
            handleTagInputKeyDown,
            handleTagInputFocus,
            handleTagInputBlur,
            clearTagInput,
            isValidTag,
            getTagValidationError
        };
    };

    const value: TagsContextType = {
        tags,
        loading,
        error,
        addTag,
        refreshTags,
        useTagInput
    };

    return (
        <TagsContext.Provider value={value}>
            {children}
        </TagsContext.Provider>
    );
}

// Hook to use tags context
export function useTags(): TagsContextType {
    const context = useContext(TagsContext);
    if (!context) {
        throw new Error('useTags must be used within a TagsProvider');
    }
    return context;
}