import { useState, useEffect } from 'react';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import { ExamService } from 'Frontend/generated/endpoints';
import { Icon } from '@vaadin/react-components';
import './create.css';

interface SubmitMessage {
  type: 'success' | 'error';
  text: string;
}

export default function CreateView() {
  // Initialize exam with proper Exam model structure
  const [exam, setExam] = useState<Exam>({
    title: '',
    description: '',
    questions: []
  });

  const [questionText, setQuestionText] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '']); // Start with at least 2 options
  const [correctAnswer, setCorrectAnswer] = useState<string[]>([]); // Now always an array
  const [isMultipleAnswers, setIsMultipleAnswers] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  // Validation states
  const [isQuestionValid, setIsQuestionValid] = useState<boolean>(false);
  const [isExamValid, setIsExamValid] = useState<boolean>(false);

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
    setIsExamValid(examValid && !isSubmitting);
  }, [exam, isSubmitting]);

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

  const addQuestion = (): void => {
    if (!isQuestionValid) return;

    const question = {
      questionText: questionText,
      options: [...options],
      correctAnswers: [...correctAnswer],
      isMultipleAnswers: isMultipleAnswers
    };

    setExam(prev => ({
      ...prev,
      questions: [...(prev.questions || []), question]
    }));

    // Reset question form
    setQuestionText('');
    setOptions(['', '']);
    setCorrectAnswer([]);
    setIsMultipleAnswers(false);
  };

  // Remove question from exam
  const removeQuestion = (questionId: string): void => {
    setExam(prev => ({
      ...prev,
      questions: prev.questions?.filter(question => question?.id !== questionId) || []
    }));
  };

  // Submit exam to backend
  const submitExam = async (): Promise<void> => {
    if (!isExamValid) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      console.log(exam)
      await ExamService.saveExam(exam);

      setSubmitMessage({ type: 'success', text: 'Exam created successfully!' });

      // Reset form
      setExam({ title: '', description: '', questions: [] });
    } catch (error) {
      console.error('Error creating exam:', error);
      setSubmitMessage({
        type: 'error',
        text: 'Failed to create exam. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exam-create-container">
      <h1>Create New Exam</h1>

      {/* Exam Details */}
      <div className="exam-section">
        <h2>Exam Details</h2>

        <div className="form-group">
          <label className="form-label">
            Exam Title
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
            Description
          </label>
          <textarea
            value={exam.description || ''}
            onChange={(e) => setExam(prev => ({ ...prev, description: e.target.value }))}
            className="form-textarea"
            rows={3}
            placeholder="Enter exam description..."
          />
        </div>
      </div>

      {/* Question Builder */}
      <div className="exam-section">
        <h2>Add Question</h2>

        <div className="form-group">
          <label className="form-label">
            Question Text
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
              Answer Options
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

        <button
          onClick={addQuestion}
          disabled={!isQuestionValid}
          className={`btn-primary ${isQuestionValid ? 'enabled' : 'disabled'}`}
          type="button"
        >
          Add Question to Exam
        </button>
      </div>

      {/* Questions List */}
      {exam.questions && exam.questions.length > 0 && (
        <div className="exam-section">
          <h2>Questions ({exam.questions.length})</h2>

          {exam.questions.map((question, index) => (
            <div key={question?.id} className="question-card">
              <div className="question-header">
                <h3>Question {index + 1}</h3>
                <button
                  onClick={() => question?.id && removeQuestion(question.id)}
                  className="remove-btn"
                  type="button"
                >
                  Remove
                </button>
              </div>

              <p className="question-text">{question?.questionText}</p>

              <div className="question-options">
                <div>Options:</div>
                <ul>
                  {question?.options?.map((opt, optIndex) => {
                    // Check if this option is a correct answer
                    const isCorrect = question.correctAnswers?.includes(opt) || false;
                    return (
                      <li key={index + "-" + optIndex} className={isCorrect ? 'correct' : ''}>
                        {opt}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Section */}
      <div className="submit-section">
        {submitMessage && (
          <div className={`message ${submitMessage.type}`}>
            {submitMessage.text}
          </div>
        )}

        <button
          onClick={submitExam}
          disabled={!isExamValid}
          className={`btn-submit ${isExamValid ? 'enabled' : 'disabled'}`}
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
      </div>
    </div>
  );
}