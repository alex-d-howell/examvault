import { useCallback } from 'react';
import { Button, Icon, Select } from '@vaadin/react-components';
import { useNavigate } from 'react-router';
import { TagsProvider } from 'Frontend/hooks/useTags';
import { useExamSearch, type SearchFilters, type ClientSortOption } from '../../hooks/useExamSearch';
import { MemoizedExamCard } from 'Frontend/components/MemoizedExamCard';
import { AdvancedSearchComponent } from 'Frontend/components/AdvancedSearchComponent/AdvancedSearchComponent';
import { VirtualExamList } from 'Frontend/components/VirtualExamList';
import { ExamListSkeleton } from 'Frontend/components/LoadingSkeletons';
import { ExamErrorBoundary, SearchErrorBoundary } from 'Frontend/components/ErrorBoundaries';
import { APP_CONFIG, ROUTES } from '../../config/constants';
import Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import './exams.css';

export default function ExamsView() {
  const navigate = useNavigate();

  const {
    sortedExams,
    loading,
    hasSearched,
    resultsCount,
    searchExams,
    clearSearch,
    sortExams
  } = useExamSearch();

  // Memoized callbacks prevent unnecessary re-renders
  const handleTagClick = useCallback((tag: string) => {
    const filters: SearchFilters = {
      title: '',
      uploadedBy: '',
      tags: [tag],
      startDate: '',
      endDate: '',
      minQuestions: null,
      maxQuestions: null,
      sortBy: 'relevance'
    };
    searchExams(filters);
  }, [searchExams]);

  // Clean display text function
  const getSearchResultText = (): string => {
    if (!hasSearched) {
      return "Use the search filters above to discover exams";
    }
    if (loading) {
      return "Searching for exams...";
    }
    if (resultsCount === 0) {
      return "No exams match your search criteria. Try adjusting your filters.";
    }
    return `Showing ${resultsCount} exam${resultsCount === 1 ? '' : 's'}`;
  };

  const sortOptions = [
    { label: 'Upload Date (Newest First)', value: 'date' },
    { label: 'Relevance Score', value: 'relevance' },
    { label: 'Title (A-Z)', value: 'title' },
    { label: 'Author (A-Z)', value: 'author' },
    { label: 'Question Count (Most First)', value: 'questions' }
  ];

  return (
    <TagsProvider>
      <SearchErrorBoundary>
        <div className="container">
          <AdvancedSearchComponent
            onSearch={searchExams}
            onClear={clearSearch}
          />
        </div>
      </SearchErrorBoundary>

      {/* Results Section */}
      <div className="results-section container">
        <div className="results-header">
          <div className="results-info">
            <Icon icon="vaadin:list" />
            <span className="results-text">{getSearchResultText()}</span>
          </div>

          <div className="results-actions">
            {hasSearched && resultsCount > 0 && (
              <div className="flex items-center gap-sm">
                <span className="text-sm text-gray-500">Sort by:</span>
                <Select
                  onChange={(e) => sortExams(e.target.value as ClientSortOption)}
                  theme="small"
                  className='sort-select'
                  items={sortOptions}
                />
              </div>
            )}
          </div>
        </div>

        <ExamErrorBoundary>
          {loading ? (
            <ExamListSkeleton count={APP_CONFIG.PAGINATION.LOADING_SKELETON_COUNT} layout="grid" />
          ) : sortedExams.length > 0 ? (
            sortedExams.length > APP_CONFIG.SEARCH.VIRTUAL_SCROLL_THRESHOLD ? (
              <VirtualExamList
                exams={sortedExams}
                itemHeight={APP_CONFIG.UI.EXAM_CARD_HEIGHT}
                containerHeight={800}
                renderItem={({ exam }) => (
                  <MemoizedExamCard
                    exam={exam}
                    onTagClick={handleTagClick}
                  />
                )}
                className="virtual-exam-container"
              />
            ) : (
              <div className="exam-grid">
                {sortedExams.map((exam: Exam) => (
                  <MemoizedExamCard
                    key={exam.id}
                    exam={exam}
                    onTagClick={handleTagClick}
                  />
                ))}
              </div>
            )
          ) : hasSearched ? (
            // No results message
            <div className="no-results">
              <div className="no-results-content">
                <Icon icon="vaadin:search-minus" className="no-results-icon" />
                <h3>No exams found</h3>
                <p>Try adjusting your search filters or browse all available exams.</p>
                <Button
                  onClick={() => navigate(ROUTES.EXAM_CREATE)}
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
                <h3>Discover Exams!</h3>
                <p>Use our search system to find exams by title, author, tags, date range, and more!</p>
                <div className="welcome-features">
                  <div className="feature-item">
                    <Icon icon="vaadin:filter" />
                    <span>Advanced Filtering</span>
                  </div>
                  <div className="feature-item">
                    <Icon icon="vaadin:tag" />
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
        </ExamErrorBoundary>
      </div>
    </TagsProvider>
  );
}