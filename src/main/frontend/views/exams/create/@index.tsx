import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import { ExamService } from 'Frontend/generated/endpoints';
import { Icon } from '@vaadin/react-components';
import { useAuth } from 'Frontend/hooks/useAuth.js';
import './create.css';
import { TagInput } from 'Frontend/components/tagComponents/tagsComponents';

interface SubmitMessage {
  type: 'success' | 'error' | 'warning';
  text: string;
}

export default function CreateView() {
  const { authenticated, user, authInitialized, loading } = useAuth();
  const navigate = useNavigate();

  // Initialize exam with proper Exam model structure
  const [exam, setExam] = useState<Exam>({
    title: '',
    description: '',
    questions: [],
    tags: []
  });

  const [questionText, setQuestionText] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '']); // Start with at least 2 options
  const [correctAnswer, setCorrectAnswer] = useState<string[]>([]); // Now always an array
  const [isMultipleAnswers, setIsMultipleAnswers] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>(''); // New explanation field
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  // Editing states
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Validation states
  const [isQuestionValid, setIsQuestionValid] = useState<boolean>(false);
  const [isExamValid, setIsExamValid] = useState<boolean>(false);

  // Check authentication and redirect if necessary
  useEffect(() => {
    if (authInitialized && !loading && !authenticated) {
      console.log('User not authenticated, redirecting to login');
      sessionStorage.setItem('redirectPath', '/exams/create');
      navigate('/login');
    }
  }, [authenticated, authInitialized, loading, navigate]);

  // Update validation when state changes
  useEffect(() => {
    const hasValidOptions = options.length >= 2 && options.every(opt => opt?.trim());
    const hasValidAnswer = correctAnswer.length > 0 &&
      correctAnswer.every(answer => options.includes(answer));

    const questionValid = Boolean(questionText.trim() && hasValidOptions && hasValidAnswer);
    setIsQuestionValid(questionValid);
  }, [questionText, options, correctAnswer, isMultipleAnswers]);

  useEffect(() => {
    const examValid = Boolean(
      exam.title?.trim() &&
      exam.description?.trim() &&
      exam.questions &&
      exam.questions.length > 0
    );
    setIsExamValid(examValid && !isSubmitting && authenticated);
  }, [exam, isSubmitting, authenticated]);

  // Show loading while checking authentication
  if (!authInitialized || loading) {
    return (
      <div className="exam-create-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message
  if (!authenticated) {
    return (
      <div className="exam-create-container">
        <div className="auth-required">
          <Icon icon="vaadin:lock" className="auth-icon" />
          <h2>Authentication Required</h2>
          <p>You need to be signed in to create exams.</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary enabled"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const addOption = (): void => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number): void => {
    if (options.length > 2) { // Keep at least 2 options
      const removedOption = options[index];
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);

      // Remove from correctAnswer if it was selected
      setCorrectAnswer(prev => prev.filter(answer => answer !== removedOption));
    }
  };

  const updateOption = (index: number, value: string): void => {
    const oldValue = options[index];
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);

    // Update correctAnswer if it contained the old value
    setCorrectAnswer(prev =>
      prev.map(answer => answer === oldValue ? value : answer)
    );
  };

  // Handle correct answer selection for single answer questions
  const handleSingleCorrectAnswer = (option: string): void => {
    setCorrectAnswer([option]);
  };

  // Handle correct answer selection for multiple answer questions
  const toggleMultipleCorrectAnswer = (option: string): void => {
    setCorrectAnswer(prev =>
      prev.includes(option)
        ? prev.filter(answer => answer !== option)
        : [...prev, option]
    );
  };

  // Reset question form to initial state
  const resetQuestionForm = (): void => {
    setQuestionText('');
    setOptions(['', '']);
    setCorrectAnswer([]);
    setIsMultipleAnswers(false);
    setExplanation(''); // Reset explanation field
    setIsEditMode(false);
    setEditingQuestionIndex(null);
  };

  // Start editing a question
  const startEditQuestion = (questionIndex: number): void => {
    const question = exam.questions?.[questionIndex];
    if (!question) return;

    setQuestionText(question.questionText || '');
    setOptions(question.options ? question.options.filter((opt): opt is string => opt != null) : ['', '']);
    setCorrectAnswer(question.correctAnswers ? question.correctAnswers.filter((ans): ans is string => ans != null) : []);
    setIsMultipleAnswers(question.isMultipleAnswers || false);
    setExplanation(question.explanation || ''); // Load explanation for editing
    setEditingQuestionIndex(questionIndex);
    setIsEditMode(true);

    // Scroll to question builder
    document.querySelector('.exam-section:nth-child(5)')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Cancel editing and reset form
  const cancelEdit = (): void => {
    resetQuestionForm();
  };

  const addQuestion = (): void => {
    if (!isQuestionValid) return;

    const question = {
      questionText: questionText,
      options: [...options],
      correctAnswers: [...correctAnswer],
      isMultipleAnswers: isMultipleAnswers,
      explanation: explanation.trim() || undefined // Only include explanation if it has content
    };

    if (isEditMode && editingQuestionIndex !== null) {
      // Update existing question
      setExam(prev => {
        const updatedQuestions = [...(prev.questions || [])];
        updatedQuestions[editingQuestionIndex] = question;
        return {
          ...prev,
          questions: updatedQuestions
        };
      });
    } else {
      // Add new question
      setExam(prev => ({
        ...prev,
        questions: [...(prev.questions || []), question]
      }));
    }

    // Reset question form
    resetQuestionForm();
  };

  // Remove question from exam
  const removeQuestion = (questionIndex: number): void => {
    setExam(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, index) => index !== questionIndex) || []
    }));

    // If we're editing the question being removed, cancel edit
    if (editingQuestionIndex === questionIndex) {
      cancelEdit();
    } else if (editingQuestionIndex !== null && editingQuestionIndex > questionIndex) {
      // Adjust editing index if a question before the edited one was removed
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  };

  // Submit exam to backend
  const submitExam = async (): Promise<void> => {
    if (!isExamValid || !authenticated) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      console.log('Submitting exam:', exam);
      console.log('User authenticated:', authenticated);
      console.log('User details:', user);

      // Validate exam data before sending
      if (!exam.title?.trim()) {
        throw new Error('Exam title is required');
      }
      if (!exam.description?.trim()) {
        throw new Error('Exam description is required');
      }
      if (!exam.questions || exam.questions.length === 0) {
        throw new Error('At least one question is required');
      }

      // Ensure all questions have valid data
      for (let i = 0; i < exam.questions.length; i++) {
        const question = exam.questions[i];
        if (!question?.questionText?.trim()) {
          throw new Error(`Question ${i + 1} text is required`);
        }
        if (!question.options || question.options.length < 2) {
          throw new Error(`Question ${i + 1} must have at least 2 options`);
        }
        if (!question.correctAnswers || question.correctAnswers.length === 0) {
          throw new Error(`Question ${i + 1} must have at least one correct answer`);
        }
      }

      await ExamService.saveExam(exam);

      setSubmitMessage({
        type: 'success',
        text: 'Exam created successfully! You can now view it in the exam browser.'
      });

      // Reset form after a short delay
      setTimeout(() => {
        setExam({ title: '', description: '', questions: [], tags: [] });
        resetQuestionForm();
        setSubmitMessage(null);
      }, 3000);

    } catch (error: any) {
      console.error('Error creating exam:', error);

      let errorMessage = 'Failed to create exam. Please try again.';

      if (error.message) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Authentication error. Please sign out and sign back in.';
          setSubmitMessage({ type: 'warning', text: errorMessage });
          // Optionally redirect to login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        } else if (error.message.includes('required') || error.message.includes('must have')) {
          errorMessage = error.message;
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setSubmitMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exam-create-container">
      <div className="create-header">
        <h1>Create New Exam</h1>
        {user && (
          <div className="user-info">
            <Icon icon="vaadin:user" />
            <span>Creating as {user.name}</span>
          </div>
        )}
      </div>

      {/* Exam Details */}
      <div className="exam-section">
        <h2>Exam Details</h2>

        <div className="form-group">
          <label className="form-label">
            Exam Title *
          </label>
          <input
            type="text"
            value={exam.title || ''}
            onChange={(e) => setExam(prev => ({ ...prev, title: e.target.value }))}
            className="form-input"
            placeholder="Enter exam title..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Description *
          </label>
          <textarea
            value={exam.description || ''}
            onChange={(e) => setExam(prev => ({ ...prev, description: e.target.value }))}
            className="form-textarea"
            rows={3}
            placeholder="Enter exam description..."
          />
        </div>

        {/* Tags Section - Using new consolidated component */}
        <TagInput
          selectedTags={(exam.tags || []).filter((tag): tag is string => tag != null && tag !== undefined)}
          onTagsChange={(tags) => setExam(prev => ({ ...prev, tags }))}
          label="Tags (Optional)"
          hint="Add tags to help others find your exam. Press Enter to add a tag."
          maxTags={10}
        />
      </div>

      {/* Question Builder */}
      <div className="exam-section">
        <h2>
          {isEditMode ? 'Edit Question' : 'Add Question'}
          {isEditMode && editingQuestionIndex !== null && (
            <span className="edit-indicator"> (Question {editingQuestionIndex + 1})</span>
          )}
        </h2>

        <div className="form-group">
          <label className="form-label">
            Question Text *
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="form-textarea"
            rows={2}
            placeholder="Enter your question..."
          />
        </div>

        <div className="form-group">
          <div className="option-header">
            <label className="form-label">
              Answer Options *
            </label>
            <button
              onClick={addOption}
              className="add-option-btn"
              type="button"
            >
              + Add Option
            </button>
          </div>

          {options.map((option, index) => (
            <div key={index} className="option-row">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="option-input"
                placeholder={`Option ${index + 1}...`}
              />

              {!isMultipleAnswers && (
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctAnswer.includes(option)}
                  onChange={() => handleSingleCorrectAnswer(option)}
                  className="radio-input"
                />
              )}

              {isMultipleAnswers && (
                <input
                  type="checkbox"
                  checked={correctAnswer.includes(option)}
                  onChange={() => toggleMultipleCorrectAnswer(option)}
                  className="checkbox-input"
                />
              )}

              {options.length > 2 && (
                <button
                  onClick={() => removeOption(index)}
                  className="remove-btn"
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isMultipleAnswers}
              onChange={(e) => {
                setIsMultipleAnswers(e.target.checked);
                setCorrectAnswer([]);
              }}
            />
            <span>Allow multiple correct answers</span>
          </label>
        </div>

        {/* New Explanation Field */}
        <div className="form-group">
          <label className="form-label">
            Explanation (Optional)
            <span className="form-label-hint">Provide additional context or detailed explanation for this question</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="form-textarea explanation-textarea"
            rows={3}
            placeholder="Enter detailed explanation, background information, or context that will help learners understand this question better..."
            maxLength={1000}
          />
          <div className="character-counter">
            {explanation.length}/1000 characters
          </div>
        </div>

        <div className="question-actions">
          <button
            onClick={addQuestion}
            disabled={!isQuestionValid}
            className={`btn-primary ${isQuestionValid ? 'enabled' : 'disabled'}`}
            type="button"
          >
            {isEditMode ? 'Update Question' : 'Add Question to Exam'}
          </button>

          {isEditMode && (
            <button
              onClick={cancelEdit}
              className="btn-secondary"
              type="button"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      {exam.questions && exam.questions.length > 0 && (
        <div className="exam-section">
          <h2>Questions ({exam.questions.length})</h2>

          {exam.questions.map((question, index) => (
            <div
              key={index}
              className={`question-card ${editingQuestionIndex === index ? 'editing' : ''}`}
            >
              <div className="question-header">
                <h3>Question {index + 1}</h3>
                <div className="question-actions">
                  <button
                    onClick={() => startEditQuestion(index)}
                    className="edit-btn"
                    type="button"
                    disabled={isEditMode && editingQuestionIndex !== index}
                  >
                    <Icon icon="vaadin:edit" />
                    Edit
                  </button>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="remove-btn"
                    type="button"
                    disabled={isEditMode && editingQuestionIndex === index}
                  >
                    <Icon icon="vaadin:trash" />
                    Remove
                  </button>
                </div>
              </div>

              <p className="question-text">{question?.questionText}</p>

              <div className="question-options">
                <div className="question-type">
                  Type: {question?.isMultipleAnswers ? 'Multiple Answers' : 'Single Answer'}
                </div>
                <div>Options:</div>
                <ul>
                  {question?.options?.map((opt, optIndex) => {
                    // Check if this option is a correct answer
                    const isCorrect = question.correctAnswers?.includes(opt) || false;
                    return (
                      <li key={index + "-" + optIndex} className={isCorrect ? 'correct' : ''}>
                        {opt}
                        {isCorrect && <Icon icon="vaadin:check" className="correct-icon" />}
                      </li>
                    );
                  })}
                </ul>

                {/* Display explanation if available */}
                {question?.explanation && (
                  <div className="question-explanation-preview">
                    <div className="explanation-label">
                      <Icon icon="vaadin:info-circle" className="explanation-icon" />
                      <span>Explanation:</span>
                    </div>
                    <p className="explanation-text">{question.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Section */}
      <div className="submit-section">
        {submitMessage && (
          <div className={`message ${submitMessage.type}`}>
            <Icon
              icon={submitMessage.type === 'success' ? 'vaadin:check-circle' :
                submitMessage.type === 'warning' ? 'vaadin:warning' : 'vaadin:exclamation-circle'}
            />
            {submitMessage.text}
          </div>
        )}

        <button
          onClick={submitExam}
          disabled={!isExamValid || isEditMode}
          className={`btn-submit ${(isExamValid && !isEditMode) ? 'enabled' : 'disabled'}`}
          type="button"
        >
          {isSubmitting ? (
            <>
              <div className="spinner"></div>
              Creating Exam...
            </>
          ) : (
            <>
              <Icon className='submit-check' icon="vaadin:check-circle-o" />
              Create Exam
            </>
          )}
        </button>

        {isEditMode && (
          <p className="edit-warning">
            <Icon icon="vaadin:info-circle" />
            Complete or cancel the current edit before submitting the exam.
          </p>
        )}

        {!authenticated && (
          <p className="auth-warning">
            <Icon icon="vaadin:lock" />
            You must be signed in to create exams.
          </p>
        )}
      </div>
    </div>
  );
}