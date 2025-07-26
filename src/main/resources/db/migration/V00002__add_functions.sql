-- Function to validate answer choices against question options
CREATE OR REPLACE FUNCTION validate_answer_choices(p_question_id UUID, p_answer_choices TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    question_options TEXT[];
    choice TEXT;
BEGIN
    -- Get question options
    SELECT options INTO question_options 
    FROM question 
    WHERE id = p_question_id;
    
    IF question_options IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if all answer choices are valid options
    FOREACH choice IN ARRAY p_answer_choices LOOP
        IF NOT (choice = ANY(question_options)) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate if an answer is correct
CREATE OR REPLACE FUNCTION calculate_answer_correctness(
    p_question_id UUID,
    p_answer_choices TEXT[]
) RETURNS BOOLEAN AS $$
DECLARE
    correct_answers TEXT[];
BEGIN
    -- Get correct answers for the question
    SELECT q.correct_answers INTO correct_answers
    FROM question q
    WHERE q.id = p_question_id;
    
    IF correct_answers IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if answer choices match correct answers exactly
    -- Arrays must have same length and contain same elements
    IF array_length(p_answer_choices, 1) != array_length(correct_answers, 1) THEN
        RETURN false;
    END IF;
    
    -- Check if all elements match (regardless of order)
    RETURN (
        NOT EXISTS (
            SELECT 1 FROM unnest(p_answer_choices) AS choice
            WHERE choice != ALL(correct_answers)
        )
        AND
        NOT EXISTS (
            SELECT 1 FROM unnest(correct_answers) AS correct_choice
            WHERE correct_choice != ALL(p_answer_choices)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get all unique tags (used by ExamRepository.findAllUniqueTags)
CREATE OR REPLACE FUNCTION get_all_unique_tags()
RETURNS TABLE(tag TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT unnest(e.tags)::TEXT as tag 
    FROM exam e 
    WHERE e.tags IS NOT NULL 
    ORDER BY tag;
END;
$$ LANGUAGE plpgsql;

-- Function to get popular tags with counts (used by ExamRepository.getPopularTags)
CREATE OR REPLACE FUNCTION get_popular_tags(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(tag TEXT, usage_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tag_name::TEXT,
        COUNT(*)::BIGINT as usage_count
    FROM (
        SELECT unnest(tags) as tag_name 
        FROM exam 
        WHERE tags IS NOT NULL
    ) t 
    GROUP BY tag_name 
    ORDER BY usage_count DESC, tag_name ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to search tags by pattern (used by ExamRepository.findTagsMatchingPattern)
CREATE OR REPLACE FUNCTION find_tags_matching_pattern(p_pattern TEXT, p_limit INTEGER DEFAULT 20)
RETURNS TABLE(tag TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT tag_name::TEXT
    FROM (
        SELECT unnest(tags) as tag_name 
        FROM exam 
        WHERE tags IS NOT NULL
    ) t 
    WHERE tag_name ILIKE CONCAT('%', p_pattern, '%')
    ORDER BY tag_name 
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get basic exam statistics (used by ExamRepository.getBasicExamStatistics)
CREATE OR REPLACE FUNCTION get_basic_exam_statistics()
RETURNS TABLE(total_exams BIGINT, unique_authors BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_exams,
        COUNT(DISTINCT uploaded_by)::BIGINT as unique_authors
    FROM exam;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to ensure answer choices are valid for the question
ALTER TABLE answer ADD CONSTRAINT answer_valid_choices 
    CHECK (validate_answer_choices(question_id, answer_choices));

-- Add search indexes for text search
CREATE INDEX idx_exam_title_search ON exam USING GIN(to_tsvector('english', title)) WHERE title IS NOT NULL;
CREATE INDEX idx_exam_description_search ON exam USING GIN(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- Composite indexes for common query patterns from ExamRepository
CREATE INDEX idx_exam_author_date ON exam(uploaded_by, uploaded_at DESC) WHERE uploaded_by IS NOT NULL;
CREATE INDEX idx_exam_date_non_null ON exam(uploaded_at DESC) WHERE uploaded_at IS NOT NULL;

-- Additional useful indexes
CREATE INDEX idx_question_multiple_answers ON question(exam_id, is_multiple_answers);
CREATE INDEX idx_answer_correctness ON answer(exam_attempt_id, is_correct) WHERE is_correct IS NOT NULL;