import { Button, Card, Icon, Notification, Select } from '@vaadin/react-components';
import Exam from "Frontend/generated/com/howell/examvault/base/domain/Exam";
import { useState, useEffect } from "react";
import { ExamService } from "Frontend/generated/endpoints";
import { ReadMoreModal } from 'Frontend/components/readMoreModal';
import { useNavigate } from 'react-router';
import { ConfirmationButton } from 'Frontend/components/confirmationButton';
import { useAuth } from 'Frontend/hooks/useAuth.js';
import { TagDisplay } from 'Frontend/components/tagComponents/tagsComponents';
import { AdvancedSearchComponent } from 'Frontend/components/advancedSearchComponent/advancedSearchComponent';
import { TagsProvider } from 'Frontend/hooks/useTags';
import './exams.css';

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

type ClientSortOption = 'date' | 'title' | 'author' | 'questions' | 'comments' | 'relevance';

export default function ExamsView() {
    const navigate = useNavigate();
    const { authenticated, user } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResultsCount, setSearchResultsCount] = useState(0);
    const [clientSortBy, setClientSortBy] = useState<ClientSortOption>('date');
    const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters | null>(null);

    // Check if current user can edit a specific exam
    const canUserEditExam = (exam: Exam): boolean => {
        if (!authenticated || !user) return false;
        return exam.uploadedBy === user.email;
    };

    // Client-side sorting function
    const sortExamsClientSide = (examList: Exam[], sortBy: ClientSortOption): Exam[] => {
        const sorted = [...examList];

        switch (sortBy) {
            case 'title':
                return sorted.sort((a, b) => {
                    const titleA = a.title || '';
                    const titleB = b.title || '';
                    return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
                });

            case 'author':
                return sorted.sort((a, b) => {
                    const authorA = a.uploadedBy || '';
                    const authorB = b.uploadedBy || '';
                    return authorA.localeCompare(authorB, undefined, { sensitivity: 'base' });
                });

            case 'questions':
                return sorted.sort((a, b) => {
                    const countA = a.questions?.length || 0;
                    const countB = b.questions?.length || 0;
                    return countB - countA; // Descending
                });

            case 'relevance':
                // Enhanced relevance scoring
                return sorted.sort((a, b) => {
                    let scoreA = 0;
                    let scoreB = 0;

                    // Question count factor
                    scoreA += (a.questions?.length || 0) * 0.1;
                    scoreB += (b.questions?.length || 0) * 0.1;

                    // Recency factor
                    if (a.uploadedAt && b.uploadedAt) {
                        const daysSinceA = (Date.now() - new Date(a.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
                        const daysSinceB = (Date.now() - new Date(b.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
                        scoreA += Math.max(0, 30 - daysSinceA) * 0.1;
                        scoreB += Math.max(0, 30 - daysSinceB) * 0.1;
                    }

                    // Tag match factor (if we have search tags)
                    if (lastSearchFilters?.tags && lastSearchFilters.tags.length > 0) {
                        const searchTags = lastSearchFilters.tags.map(tag => tag.toLowerCase());
                        const examTagsA = (a.tags || []).map(tag => tag?.toLowerCase());
                        const examTagsB = (b.tags || []).map(tag => tag?.toLowerCase());

                        const matchesA = searchTags.filter(tag => examTagsA.includes(tag)).length;
                        const matchesB = searchTags.filter(tag => examTagsB.includes(tag)).length;

                        scoreA += matchesA * 0.3;
                        scoreB += matchesB * 0.3;
                    }

                    return scoreB - scoreA; // Descending
                });

            case 'date':
            default:
                return sorted.sort((a, b) => {
                    if (!a.uploadedAt && !b.uploadedAt) return 0;
                    if (!a.uploadedAt) return 1;
                    if (!b.uploadedAt) return -1;
                    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
                });
        }
    };

    // Apply client-side sorting whenever sort option changes or exams change
    useEffect(() => {
        const sorted = sortExamsClientSide(exams, clientSortBy);
        setFilteredExams(sorted);
    }, [exams, clientSortBy, lastSearchFilters]);

    // Handle tag click to search for exams with that tag
    const handleTagClick = (tag: string) => {
        const filters: SearchFilters = {
            title: '',
            uploadedBy: '',
            tags: [tag],
            startDate: '',
            endDate: '',
            minQuestions: null,
            maxQuestions: null,
            sortBy: 'relevance' // Use relevance for tag searches
        };
        handleAdvancedSearch(filters);
    };

    // Enhanced advanced search function with performance monitoring
    const handleAdvancedSearch = async (filters: SearchFilters) => {
        setIsLoading(true);
        setHasSearched(true);
        setLastSearchFilters(filters);

        try {

            const results = await ExamService.searchExams(
                filters.title || '',
                filters.uploadedBy || '',
                filters.tags,
                filters.startDate || '',
                filters.endDate || '',
                filters.minQuestions || 1,
                filters.maxQuestions || 99999,
                filters.sortBy
            );

            const validResults = (results ?? []).filter((exam: Exam | undefined) => exam !== undefined);
            setExams(validResults);
            setSearchResultsCount(validResults.length);

            // Show enhanced notification with performance info
            if (validResults.length === 0) {
                let message = 'No exams found matching your search criteria';
                if (filters.tags && filters.tags.length > 0) {
                    message += ` (searched for tags: ${filters.tags.join(', ')})`;
                }

                Notification.show(message, {
                    position: 'top-center',
                    duration: 4000,
                    theme: 'contrast'
                });
            } else {
                let message = `Found ${validResults.length} exam${validResults.length === 1 ? '' : 's'}`;
                if (filters.tags && filters.tags.length > 0) {
                    message += ` with tags: ${filters.tags.join(', ')}`;
                }

                Notification.show(message, {
                    position: 'top-center',
                    duration: 3000,
                    theme: 'success'
                });
            }

        } catch (error) {
            console.error('Error in advanced search:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Notification.show(`Search failed: ${errorMessage}`, {
                position: 'top-center',
                duration: 4000,
                theme: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Clear search function
    const handleClearSearch = () => {
        setExams([]);
        setFilteredExams([]);
        setHasSearched(false);
        setSearchResultsCount(0);
        setLastSearchFilters(null);
        setClientSortBy('date');

        Notification.show('Search cleared', {
            position: 'top-center',
            duration: 1500,
            theme: 'contrast'
        });
    };

    // Handle sort change with performance feedback
    const handleSortChange = (newSortBy: ClientSortOption) => {
        setClientSortBy(newSortBy);

        // Show performance feedback for client-side sorting
        setTimeout(() => {

            const sortLabels: Record<ClientSortOption, string> = {
                date: 'Upload Date (Newest First)',
                title: 'Title (A-Z)',
                author: 'Author (A-Z)',
                questions: 'Question Count (Most First)',
                comments: 'Comment Count (Most First)',
                relevance: 'Relevance Score'
            };

            let message = `Sorted by: ${sortLabels[newSortBy]}`;

            Notification.show(message, {
                position: 'top-center',
                duration: 1500,
                theme: 'contrast'
            });
        }, 10);
    };

    // Get display text for search results
    const getSearchResultText = () => {
        if (!hasSearched) {
            return "Use the search filters above to discover exams";
        }

        if (isLoading) {
            return "Searching for exams...";
        }

        if (searchResultsCount === 0) {
            return "No exams match your search criteria. Try adjusting your filters.";
        }

        let text = `Showing ${searchResultsCount} exam${searchResultsCount === 1 ? '' : 's'}`;

        return text;
    };

    // Sort options for the dropdown
    const sortOptions = [
        { label: 'Upload Date (Newest First)', value: 'date' },
        { label: 'Relevance Score', value: 'relevance' },
        { label: 'Title (A-Z)', value: 'title' },
        { label: 'Author (A-Z)', value: 'author' },
        { label: 'Question Count (Most First)', value: 'questions' },
        { label: 'Comment Count (Most First)', value: 'comments' }
    ];

    return (
        <TagsProvider>
            {/* Advanced Search Component */}
            <div style={{ width: '95vw', maxWidth: '1200px' }}>
                <AdvancedSearchComponent
                    onSearch={handleAdvancedSearch}
                    onClear={handleClearSearch}
                />
            </div>

            {/* Results Section */}
            <div className="results-section" style={{ width: '95vw', maxWidth: '1200px' }}>
                {/* Results Header */}
                <div className="results-header">
                    <div className="results-info">
                        <Icon icon="vaadin:list" />
                        <span className="results-text">{getSearchResultText()}</span>
                    </div>

                    <div className="results-actions">
                        {/* Client-side sort dropdown */}
                        {hasSearched && searchResultsCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Sort by:</span>
                                <Select
                                    value={clientSortBy}
                                    onChange={(e) => handleSortChange(e.target.value as ClientSortOption)}
                                    style={{ minWidth: '200px' }}
                                    theme="small"
                                >
                                    {sortOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        {hasSearched && searchResultsCount > 0 && (
                            <Button
                                theme="tertiary small"
                                onClick={() => navigate('/exams/create')}
                            >
                                <Icon slot="prefix" icon="vaadin:plus" />
                                Create Exam
                            </Button>
                        )}
                    </div>
                </div>

                {/* Exam Cards Grid */}
                <div className="exam-grid">
                    {isLoading ? (
                        // Enhanced loading skeleton
                        Array.from({ length: 6 }, (_, idx) => (
                            <Card key={idx} className="exam-card loading-card">
                                <div className="loading-content">
                                    <div className="loading-title"></div>
                                    <div className="loading-author"></div>
                                    <div className="loading-tags">
                                        <div className="loading-tag"></div>
                                        <div className="loading-tag"></div>
                                    </div>
                                    <div className="loading-description"></div>
                                    <div className="loading-buttons">
                                        <div className="loading-button"></div>
                                        <div className="loading-button"></div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : filteredExams.length > 0 ? (
                        // Exam cards (using filteredExams for client-side sorting)
                        filteredExams.map((exam, idx) => {
                            const canEdit = canUserEditExam(exam);
                            const isOwnExam = authenticated && user && exam.uploadedBy === user.email;
                            const questionCount = exam.questions?.length || 0;

                            return (
                                <Card
                                    key={exam.id || idx}
                                    className={`exam-card ${isOwnExam ? 'own-exam-card' : ''}`}
                                >
                                    {/* Exam Header */}
                                    <div className="exam-card-header">
                                        <div className="exam-title-section">
                                            <h3 className="exam-title">{exam.title}</h3>
                                            {isOwnExam && (
                                                <span className="own-exam-badge">
                                                    <Icon icon="vaadin:user" />
                                                    Your Exam
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Exam Meta */}
                                    <div className="exam-meta">
                                        <div className="meta-item">
                                            <Icon icon="vaadin:user" />
                                            <span>{exam.uploadedBy}</span>
                                        </div>

                                        <div className="meta-item">
                                            <Icon icon="vaadin:clock" />
                                            <span>
                                                {exam.uploadedAt ?
                                                    new Date(exam.uploadedAt).toLocaleDateString() :
                                                    'Unknown date'
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    {/* Exam Stats */}
                                    <div className="exam-stats">
                                        <div className="stat-badge">
                                            <Icon icon="vaadin:question-circle" />
                                            <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <TagDisplay
                                        tags={(exam.tags || []).filter((tag): tag is string =>
                                            tag != null && tag !== undefined)}
                                        maxVisible={4}
                                        onTagClick={handleTagClick}
                                        className="exam-card-tags"
                                    />

                                    {/* Description */}
                                    <div className="exam-description">
                                        <ReadMoreModal description={exam.description || ''} />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="exam-actions">
                                        <div className="primary-actions">
                                            <Button
                                                onClick={() => navigate(`/exams/${exam.id}`)}
                                                theme="secondary"
                                                className="action-btn view-btn"
                                            >
                                                <Icon slot="prefix" icon="vaadin:eye" />
                                                View Details
                                            </Button>

                                            <ConfirmationButton
                                                action="Begin Exam"
                                                modalTitle="Attempt Exam"
                                                modalDescription={`Are you sure you want to attempt "${exam.title}"?`}
                                                buttonText="Take Exam"
                                                buttonClassName="action-btn attempt-btn"
                                                buttonTheme="primary"
                                                onYes={() => navigate(`/exams/${exam.id}/attempt`)}
                                            />
                                        </div>

                                        {/* Edit button for exam owners */}
                                        {canEdit && (
                                            <Button
                                                onClick={() => navigate(`/exams/${exam.id}/edit`)}
                                                theme="tertiary small"
                                                className="edit-exam-btn"
                                            >
                                                <Icon icon="vaadin:edit" slot="prefix" />
                                                Edit Exam
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                    ) : hasSearched ? (
                        // No results message with enhanced feedback
                        <div className="no-results">
                            <div className="no-results-content">
                                <Icon icon="vaadin:search-minus" className="no-results-icon" />
                                <h3>No exams found</h3>
                                <p>Try adjusting your search filters or browse all available exams.</p>

                                <Button
                                    onClick={() => navigate('/create-exam')}
                                    theme="primary"
                                >
                                    <Icon slot="prefix" icon="vaadin:plus" />
                                    Create the First Exam
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Enhanced welcome message
                        <div className="welcome-message">
                            <div className="welcome-content">
                                <Icon icon="vaadin:search" className="welcome-icon" />
                                <h3>Discover Amazing Exams</h3>
                                <p>Use our powerful search system to find exams by title, author, tags, date range, and more!</p>

                                <div className="welcome-features">
                                    <div className="feature-item">
                                        <Icon icon="vaadin:filter" />
                                        <span>Advanced Filtering</span>
                                    </div>
                                    <div className="feature-item">
                                        <Icon icon="vaadin-icons:tag" />
                                        <span>Tag-based Search</span>
                                    </div>
                                    <div className="feature-item">
                                        <Icon icon="vaadin:sort" />
                                        <span>Smart Sorting</span>
                                    </div>
                                    <div className="feature-item">
                                        <Icon icon="vaadin:dashboard" />
                                        <span>Scalable Architecture</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </TagsProvider>
    );
}