
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create exam table
CREATE TABLE exam (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[],
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT exam_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT exam_description_length CHECK (description IS NULL OR LENGTH(description) <= 5000),
    CONSTRAINT exam_tags_reasonable_count CHECK (tags IS NULL OR array_length(tags, 1) <= 10)
);

-- Create question table
CREATE TABLE question (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answers TEXT[] NOT NULL,
    is_multiple_answers BOOLEAN NOT NULL DEFAULT false,
    explanation TEXT,
    
    CONSTRAINT question_text_not_empty CHECK (LENGTH(TRIM(question_text)) > 0),
    CONSTRAINT question_has_options CHECK (array_length(options, 1) >= 2),
    CONSTRAINT question_has_correct_answers CHECK (array_length(correct_answers, 1) >= 1),
    CONSTRAINT question_options_reasonable CHECK (array_length(options, 1) <= 10),
    CONSTRAINT question_correct_answers_valid CHECK (array_length(correct_answers, 1) <= array_length(options, 1))
);

-- Create exam_attempt table
CREATE TABLE exam_attempt (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL,
    exam_id UUID NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    number_correct INTEGER DEFAULT 0,
    
    CONSTRAINT exam_attempt_valid_times CHECK (end_time IS NULL OR end_time >= start_time),
    CONSTRAINT exam_attempt_valid_score CHECK (number_correct >= 0)
);

-- Create answer table (FIXED to match Java entity relationship)
CREATE TABLE answer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_attempt_id UUID NOT NULL REFERENCES exam_attempt(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    answer_choices TEXT[] NOT NULL,
    is_correct BOOLEAN
    
    CONSTRAINT answer_has_choices CHECK (array_length(answer_choices, 1) >= 1),
    -- Ensure one answer per question per attempt
    UNIQUE(exam_attempt_id, question_id)
);

-- Create comment table
CREATE TABLE comment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comment_string TEXT NOT NULL,
    exam_rating INTEGER DEFAULT 0,
    
    CONSTRAINT comment_text_not_empty CHECK (LENGTH(TRIM(comment_string)) > 0),
    CONSTRAINT comment_valid_rating CHECK (exam_rating >= 0 AND exam_rating <= 5)
);

-- Create essential indexes for performance
CREATE INDEX idx_exam_uploaded_by ON exam(uploaded_by);
CREATE INDEX idx_exam_uploaded_at ON exam(uploaded_at DESC);
CREATE INDEX idx_exam_tags ON exam USING GIN(tags) WHERE tags IS NOT NULL;

CREATE INDEX idx_question_exam_id ON question(exam_id);

CREATE INDEX idx_exam_attempt_user_email ON exam_attempt(user_email);
CREATE INDEX idx_exam_attempt_exam_id ON exam_attempt(exam_id);
CREATE INDEX idx_exam_attempt_start_time ON exam_attempt(start_time DESC);

CREATE INDEX idx_answer_exam_attempt_id ON answer(exam_attempt_id);
CREATE INDEX idx_answer_question_id ON answer(question_id);

CREATE INDEX idx_comment_exam_id ON comment(exam_id);
CREATE INDEX idx_comment_user_email ON comment(user_email);
CREATE INDEX idx_comment_date_created ON comment(date_created DESC);