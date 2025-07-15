import { Button, Card, Icon, Notification } from '@vaadin/react-components';
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
    examStatus: string;
    startDate: string;
    endDate: string;
    minQuestions: number | null;
    maxQuestions: number | null;
    sortBy: string;
}

export default function ExamsView() {
    const navigate = useNavigate();
    const { authenticated, user } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResultsCount, setSearchResultsCount] = useState(0);

    // Check if current user can edit a specific exam
    const canUserEditExam = (exam: Exam): boolean => {
        if (!authenticated || !user) return false;
        return exam.uploadedBy === user.email;
    };

    // Handle tag click to search for exams with that tag
    const handleTagClick = (tag: string) => {
        const filters: SearchFilters = {
            title: '',
            uploadedBy: '',
            tags: [tag],
            examStatus: '',
            startDate: '',
            endDate: '',
            minQuestions: null,
            maxQuestions: null,
            sortBy: 'date'
        };
        handleAdvancedSearch(filters);
    };

    // Advanced search function
    const handleAdvancedSearch = async (filters: SearchFilters) => {
        setIsLoading(true);
        setHasSearched(true);
        
        try {
            console.log('Advanced search with filters:', filters);

            const results = await ExamService.advancedSearchExams(
                filters.title || '',
                filters.uploadedBy || '',
                filters.tags,
                filters.examStatus || '',
                filters.startDate || '',
                filters.endDate || '',
                filters.minQuestions || 0,
                filters.maxQuestions || 99999,
                filters.sortBy
            );

            const validResults = (results ?? []).filter((exam) => exam !== undefined);
            setExams(validResults);
            setSearchResultsCount(validResults.length);

            // Show notification for search results
            if (validResults.length === 0) {
                Notification.show('No exams found matching your search criteria', {
                    position: 'top-center',
                    duration: 3000,
                    theme: 'contrast'
                });
            } else {
                Notification.show(`Found ${validResults.length} exam${validResults.length === 1 ? '' : 's'}`, {
                    position: 'top-center',
                    duration: 2000,
                    theme: 'success'
                });
            }

        } catch (error) {
            console.error('Error in advanced search:', error);
            Notification.show('Search failed. Please try again.', {
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
        setHasSearched(false);
        setSearchResultsCount(0);
        Notification.show('Search cleared', {
            position: 'top-center',
            duration: 1500,
            theme: 'contrast'
        });
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
        
        return `Showing ${searchResultsCount} exam${searchResultsCount === 1 ? '' : 's'}`;
    };

    return (
        <TagsProvider>
            <div className='flex flex-col items-center justify-center' style={{ minHeight: '100vh', padding: '1rem 0' }}>
                {/* Header */}
                <div className="exam-browser-header">
                    <h1 className="page-title">
                        <Icon icon="vaadin:search" />
                        Discover Exams
                    </h1>
                    <p className="page-subtitle">
                        Find and explore exams using powerful search filters
                    </p>
                </div>

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
                        
                        {hasSearched && searchResultsCount > 0 && (
                            <div className="results-actions">
                                <Button
                                    theme="tertiary small"
                                    onClick={() => navigate('/exams/create')}
                                >
                                    <Icon slot="prefix" icon="vaadin:plus" />
                                    Create Exam
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Exam Cards Grid */}
                    <div className="exam-grid">
                        {isLoading ? (
                            // Loading skeleton
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
                        ) : exams.length > 0 ? (
                            // Exam cards
                            exams.map((exam, idx) => {
                                const canEdit = canUserEditExam(exam);
                                const isOwnExam = authenticated && user && exam.uploadedBy === user.email;
                                const questionCount = exam.questions?.length || 0;
                                const commentCount = exam.comments?.length || 0;

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
                                            
                                            {exam.examStatus && (
                                                <span className={`exam-status status-${exam.examStatus.toLowerCase()}`}>
                                                    {exam.examStatus}
                                                </span>
                                            )}
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
                                            
                                            <div className="stat-badge">
                                                <Icon icon="vaadin:chat" />
                                                <span>{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
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
                            // No results message
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
                            // Welcome message
                            <div className="welcome-message">
                                <div className="welcome-content">
                                    <Icon icon="vaadin:search" className="welcome-icon" />
                                    <h3>Discover Amazing Exams</h3>
                                    <p>Use the powerful search filters above to find exams by title, author, tags, date range, and more!</p>
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
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TagsProvider>
    );
}