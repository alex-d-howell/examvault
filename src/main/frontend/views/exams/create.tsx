import { useState, ChangeEvent, FormEvent } from 'react';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import type Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import { ExamService } from 'Frontend/generated/endpoints';
import './create.css';

// --- OptionInput Component ---
type OptionInputProps = {
  option: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  disableRemove: boolean;
  isMulti: boolean;
  checked: boolean;
  onCheck: (index: number, checked: boolean) => void;
};

function OptionInput({ option, index, onChange, onRemove, disableRemove, isMulti, checked, onCheck }: OptionInputProps) {
  return (
    <div className="option-input">
      <label htmlFor={`option-${index}`}>Option {index + 1}:</label>
      <input
        id={`option-${index}`}
        type="text"
        value={option}
        onChange={e => onChange(index, e.target.value)}
        required
      />
      {isMulti ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onCheck(index, e.target.checked)}
          aria-label="Mark as correct answer"
        />
      ) : null}
      <button type="button" onClick={() => onRemove(index)} disabled={disableRemove}>Remove</button>
    </div>
  );
}

export default function CreateView() {
  const [exam, setExam] = useState<Exam>({ title: '', description: '', questions: [] });
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [multiCorrect, setMultiCorrect] = useState<string[]>([]);
  const [isMultipleAnswers, setIsMultipleAnswers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const handleQuestionTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuestionText(e.target.value);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    // If option text changes, update multiCorrect/correctAnswer if needed
    if (isMultipleAnswers) {
      setMultiCorrect(prev => prev.filter(ans => ans !== options[index]));
    } else {
      if (correctAnswer === options[index]) setCorrectAnswer('');
    }
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    const removed = options[index];
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (isMultipleAnswers) {
      setMultiCorrect(prev => prev.filter(ans => ans !== removed));
    } else {
      if (correctAnswer === removed) setCorrectAnswer('');
    }
  };

  const handleMultiCorrectChange = (index: number, checked: boolean) => {
    const value = options[index];
    setMultiCorrect(prev => checked ? [...prev, value] : prev.filter(ans => ans !== value));
  };

  const handleCorrectAnswerChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCorrectAnswer(e.target.value);
  };

  const handleIsMultipleAnswersChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsMultipleAnswers(e.target.checked);
    setCorrectAnswer('');
    setMultiCorrect([]);
  };

  const handleAddQuestion = (e: FormEvent) => {
    e.preventDefault();
    if (!questionText || options.length === 0 || options.some(opt => !opt.trim()) || (!isMultipleAnswers && !correctAnswer) || (isMultipleAnswers && multiCorrect.length === 0)) return;
    const newQuestion: Question = {
      questionText,
      options,
      correctAnswer: isMultipleAnswers ? multiCorrect.join(';') : correctAnswer,
      isMultipleAnswers
    };
    setExam({
      ...exam,
      questions: [...(exam.questions ?? []), newQuestion]
    });
    setQuestionText('');
    setOptions(['']);
    setCorrectAnswer('');
    setMultiCorrect([]);
    setIsMultipleAnswers(false);
  };

  const handleExamSubmit = async () => {
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await ExamService.saveExam(exam);
      setSubmitMsg('Exam created successfully!');
      setExam({ title: '', description: '', questions: [] });
    } catch (err) {
      setSubmitMsg('Failed to create exam.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Validation State ---
  const isQuestionValid = questionText.trim() && options.every(opt => opt.trim()) && (isMultipleAnswers ? multiCorrect.length > 0 : correctAnswer.trim());
  const isExamValid = exam.title?.trim() && exam.description?.trim() && (exam.questions?.length ?? 0) > 0;

  return (
    <div>
      <h2 style={{color: 'black'}}>Create Exam</h2>
      <form onSubmit={handleAddQuestion}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            value={exam.title}
            onChange={e => setExam({ ...exam, title: e.target.value })}
            required
            className="main-input"
          />
        </div>
        <div className="form-section">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={exam.description}
            onChange={e => setExam({ ...exam, description: e.target.value })}
            required
            className="main-input"
          />
        </div>
        <div className="form-section">
          <h3>Questions</h3>
          <div>
            <label htmlFor="question-text">Question Text:</label>
            <input
              id="question-text"
              type="text"
              value={questionText}
              onChange={handleQuestionTextChange}
              required
              className="main-input"
            />
          </div>
          <div>
            <label>Options:</label>
            {options.map((option, index) => (
              <OptionInput
                key={index}
                option={option}
                index={index}
                onChange={handleOptionChange}
                onRemove={removeOption}
                disableRemove={options.length === 1}
                isMulti={isMultipleAnswers}
                checked={isMultipleAnswers ? multiCorrect.includes(option) : false}
                onCheck={handleMultiCorrectChange}
              />
            ))}
            <button type="button" className="main-btn" onClick={addOption}>Add Option</button>
          </div>
          <div>
            <label htmlFor="is-multiple-answers">
              <input
                id="is-multiple-answers"
                type="checkbox"
                checked={isMultipleAnswers}
                onChange={handleIsMultipleAnswersChange}
              />
              Multiple Answers
            </label>
          </div>
          {!isMultipleAnswers ? (
            <div>
              <label htmlFor="correct-answer">Correct Answer:</label>
              <select
                id="correct-answer"
                value={correctAnswer}
                onChange={handleCorrectAnswerChange}
                required
                className="main-input"
              >
                <option value="" disabled>Select correct answer</option>
                {options.map((opt, idx) => (
                  <option key={idx} value={opt}>{opt || `Option ${idx + 1}`}</option>
                ))}
              </select>
            </div>
          ) : null}
          <button type="submit" className="main-btn" disabled={!isQuestionValid}>Add Question</button>
        </div>
        <div className="form-section">
          <h3>Exam Summary</h3>
          <p>Title: {exam.title}</p>
          <p>Description: {exam.description}</p>
          <h4>Questions:</h4>
          <ul>
            {exam.questions?.map((q, index) => (
              <li key={index}>
                {q?.questionText} - Options: {q?.options?.join(', ')} - Correct Answer: {q?.correctAnswer} {q?.isMultipleAnswers ? '(Multiple Answers)' : ''}
              </li>
            ))}
          </ul>
          <button type="button" className="main-btn" onClick={handleExamSubmit} disabled={!isExamValid || submitting}>Create Exam</button>
          {submitMsg && <div className={submitMsg.includes('success') ? 'success-msg' : 'error-msg'}>{submitMsg}</div>}
        </div>
      </form>
    </div>
  );
}