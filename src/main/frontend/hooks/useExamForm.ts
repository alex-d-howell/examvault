import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import { ExamService } from 'Frontend/generated/endpoints';
import { APP_CONFIG, ROUTES, FORM_VALIDATION } from '../config/constants';

export interface SubmitMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

export type SubmissionStage = 'idle' | 'saving' | 'success' | 'navigating';
export type FormMode = 'create' | 'edit';

export interface LoadingState {
  isLoading: boolean;
  checkingAuth: boolean;
  checkingPermissions: boolean;
  error: string | null;
}

export interface ValidationErrors {
  title?: string;
  description?: string;
  questionText?: string;
  options?: string;
  correctAnswer?: string;
  general?: string;
}

export interface UseExamFormOptions {
  mode: FormMode;
  examId?: string;
  authenticated: boolean;
  authInitialized?: boolean;
  authLoading?: boolean;
}

export const useExamForm = (formOptions: UseExamFormOptions) => {
  const { mode, examId, authenticated, authInitialized = true, authLoading = false } = formOptions;
  const navigate = useNavigate();

  // Loading state for editing
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: mode === 'edit',
    checkingAuth: mode === 'edit' && !authInitialized,
    checkingPermissions: false,
    error: null,
  });

  // Exam data
  const [exam, setExam] = useState<Exam>({
    title: '',
    description: '',
    questions: [],
    tags: [],
  });

  // Original exam for change detection in edit
  const [originalExam, setOriginalExam] = useState<Exam | null>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);

  // Question builder state
  const [questionText, setQuestionText] = useState<string>('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState<string[]>([]);
  const [isMultipleAnswers, setIsMultipleAnswers] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<string>('');

  // Edit state
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Validation state
  const [isQuestionValid, setIsQuestionValid] = useState<boolean>(false);
  const [isExamValid, setIsExamValid] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionStage, setSubmissionStage] = useState<SubmissionStage>('idle');
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage | null>(null);

  // Unsaved changes dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Computed properties
  const hasUnsavedChanges = useMemo(() => {
    if (mode === 'create') return true;
    if (!originalExam || !exam) return false;
    return JSON.stringify(originalExam) !== JSON.stringify(exam);
  }, [mode, originalExam, exam]);

  const selectedTags = useMemo(() => {
    return (exam.tags || []).filter((tag): tag is string => tag != null && tag !== undefined);
  }, [exam.tags]);

  // Shared validation logic for questions
  useEffect(() => {
    const questionErrors: Partial<ValidationErrors> = {};

    if (!questionText.trim()) {
      questionErrors.questionText = 'Question text is required';
    } else if (questionText.trim().length < APP_CONFIG.FORMS.QUESTION_TEXT_MIN_LENGTH) {
      questionErrors.questionText = `Question must be at least ${APP_CONFIG.FORMS.QUESTION_TEXT_MIN_LENGTH} characters`;
    }

    const validOptions = options.filter((opt) => opt?.trim().length >= APP_CONFIG.FORMS.OPTION_MIN_LENGTH);
    const emptyOptions = options.filter((opt) => !opt?.trim());

    if (options.length < APP_CONFIG.FORMS.MIN_OPTIONS_COUNT) {
      questionErrors.options = `At least ${APP_CONFIG.FORMS.MIN_OPTIONS_COUNT} options are required`;
    } else if (emptyOptions.length > 0) {
      questionErrors.options = `All options must have text (${emptyOptions.length} empty option${
        emptyOptions.length === 1 ? '' : 's'
      })`;
    } else if (validOptions.length < APP_CONFIG.FORMS.MIN_OPTIONS_COUNT) {
      questionErrors.options = `Options must be at least ${APP_CONFIG.FORMS.OPTION_MIN_LENGTH} character${
        APP_CONFIG.FORMS.OPTION_MIN_LENGTH === 1 ? '' : 's'
      }`;
    }

    if (correctAnswer.length === 0) {
      questionErrors.correctAnswer = 'At least one correct answer must be selected';
    } else if (!correctAnswer.every((answer) => options.includes(answer))) {
      questionErrors.correctAnswer = 'Selected answers must match available options';
    }

    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      questionText: questionErrors.questionText,
      options: questionErrors.options,
      correctAnswer: questionErrors.correctAnswer,
    }));

    const hasValidOptions =
      options.length >= APP_CONFIG.FORMS.MIN_OPTIONS_COUNT &&
      options.every((opt) => opt?.trim().length >= APP_CONFIG.FORMS.OPTION_MIN_LENGTH);
    const hasValidAnswer = correctAnswer.length > 0 && correctAnswer.every((answer) => options.includes(answer));
    const hasValidText = questionText.trim().length >= APP_CONFIG.FORMS.QUESTION_TEXT_MIN_LENGTH;

    setIsQuestionValid(hasValidText && hasValidOptions && hasValidAnswer);
  }, [questionText, options, correctAnswer]);

  // Shared validation logic for exam
  useEffect(() => {
    const examErrors: Partial<ValidationErrors> = {};

    if (!exam.title || exam.title.trim().length < APP_CONFIG.FORMS.TITLE_MIN_LENGTH) {
      examErrors.title = `Title must be at least ${APP_CONFIG.FORMS.TITLE_MIN_LENGTH} characters`;
    }

    if (!exam.description || exam.description.trim().length < APP_CONFIG.FORMS.DESCRIPTION_MIN_LENGTH) {
      examErrors.description = `Description must be at least ${APP_CONFIG.FORMS.DESCRIPTION_MIN_LENGTH} characters`;
    }

    if (!exam.questions || exam.questions.length === 0) {
      examErrors.general = 'At least one question is required to create an exam';
    }

    if (!authenticated) {
      examErrors.general = 'You must be signed in to create exams';
    }

    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      title: examErrors.title,
      description: examErrors.description,
      general: examErrors.general,
    }));

    const examValid = Boolean(
      exam.title &&
        exam.title.trim().length >= APP_CONFIG.FORMS.TITLE_MIN_LENGTH &&
        exam.description &&
        exam.description.trim().length >= APP_CONFIG.FORMS.DESCRIPTION_MIN_LENGTH &&
        exam.questions &&
        exam.questions.length > 0
    );
    setIsExamValid(examValid && !isSubmitting && authenticated);
  }, [exam, isSubmitting, authenticated]);

  // Edit mode: Initialize exam loading and permission checking
  useEffect(() => {
    if (mode !== 'edit') return;

    const initializeEdit = async () => {
      if (!authInitialized || authLoading) {
        setLoadingState((prev) => ({ ...prev, checkingAuth: true }));
        return;
      }

      if (!authenticated) {
        sessionStorage.setItem('redirectPath', ROUTES.EXAM_EDIT(examId || ''));
        navigate(ROUTES.LOGIN);
        return;
      }

      if (!examId) {
        setLoadingState({
          isLoading: false,
          checkingAuth: false,
          checkingPermissions: false,
          error: 'No exam ID provided',
        });
        return;
      }

      try {
        setLoadingState((prev) => ({
          ...prev,
          checkingAuth: false,
          checkingPermissions: true,
          error: null,
        }));

        const [canModify, loadedExam] = await Promise.all([
          ExamService.canUserModifyExam(examId),
          ExamService.getExamById(examId),
        ]);

        if (!canModify) {
          setLoadingState({
            isLoading: false,
            checkingAuth: false,
            checkingPermissions: false,
            error: 'You do not have permission to edit this exam. Only the exam creator can make changes.',
          });
          return;
        }

        if (!loadedExam) {
          setLoadingState({
            isLoading: false,
            checkingAuth: false,
            checkingPermissions: false,
            error: 'Exam not found',
          });
          return;
        }

        if (!loadedExam.questions) {
          loadedExam.questions = [];
        }

        if (!loadedExam.tags) {
          loadedExam.tags = [];
        }

        setExam(loadedExam);
        setOriginalExam(JSON.parse(JSON.stringify(loadedExam)));
        setCanEdit(true);
        setLoadingState({
          isLoading: false,
          checkingAuth: false,
          checkingPermissions: false,
          error: null,
        });
      } catch (error) {
        console.error('Error during initialization:', error);
        setLoadingState({
          isLoading: false,
          checkingAuth: false,
          checkingPermissions: false,
          error: 'Failed to load exam or verify permissions. Please try again.',
        });
      }
    };

    initializeEdit();
  }, [mode, authenticated, authInitialized, authLoading, examId, navigate]);

  // Check authentication for creating an exam
  useEffect(() => {
    if (mode !== 'create') return;

    if (authInitialized && !authLoading && !authenticated) {
      sessionStorage.setItem('redirectPath', ROUTES.EXAM_CREATE);
      navigate(ROUTES.LOGIN);
    }
  }, [mode, authenticated, authInitialized, authLoading, navigate]);

  // Shared question management functions
  const addOption = useCallback((): void => {
    setOptions((prev) => {
      if (prev.length >= APP_CONFIG.FORMS.MAX_OPTIONS_COUNT) {
        return prev;
      }
      return [...prev, ''];
    });
  }, []);

  const removeOption = useCallback(
    (index: number): void => {
      setOptions((prev) => {
        if (prev.length <= APP_CONFIG.FORMS.MIN_OPTIONS_COUNT) {
          return prev;
        }
        const removedOption = prev[index];
        const newOptions = prev.filter((_, i) => i !== index);
        
        // Update correct answers to remove the deleted option
        setCorrectAnswer((prevAnswers) => 
          prevAnswers.filter((answer) => answer !== removedOption)
        );
        
        return newOptions;
      });
    },
    []
  );

  const updateOption = useCallback(
    (index: number, value: string): void => {
      setOptions((prev) => {
        const oldValue = prev[index];
        const newOptions = [...prev];
        newOptions[index] = value;
        
        // Update correct answers if the option text changed
        setCorrectAnswer((prevAnswers) =>
          prevAnswers.map((answer) => (answer === oldValue ? value : answer))
        );
        
        return newOptions;
      });
    },
    []
  );

  const handleSingleCorrectAnswer = useCallback((option: string): void => {
    setCorrectAnswer([option]);
    setIsMultipleAnswers(false);
  }, []);

  const toggleMultipleCorrectAnswer = useCallback((option: string): void => {
    setCorrectAnswer((prev) => {
      const newAnswers = prev.includes(option)
        ? prev.filter((answer) => answer !== option)
        : [...prev, option];
      return newAnswers;
    });
    setIsMultipleAnswers(true);
  }, []);

  const resetQuestionForm = useCallback((): void => {
    setQuestionText('');
    setOptions(['', '']);
    setCorrectAnswer([]);
    setIsMultipleAnswers(false);
    setExplanation('');
    setIsEditMode(false);
    setEditingQuestionIndex(null);
  }, []);

  const addQuestion = useCallback((): void => {
    if (!isQuestionValid) {
      return;
    }

    const question = {
      questionText: questionText.trim(),
      options: options.filter((opt) => opt.trim()),
      correctAnswers: [...correctAnswer],
      isMultipleAnswers,
      explanation: explanation.trim() || undefined,
    };

    setExam((prev) => {
      const updatedQuestions = [...(prev.questions || [])];
      if (isEditMode && editingQuestionIndex !== null) {
        updatedQuestions[editingQuestionIndex] = question;
      } else {
        updatedQuestions.push(question);
      }
      return { ...prev, questions: updatedQuestions };
    });

    resetQuestionForm();
  }, [
    isQuestionValid,
    questionText,
    options,
    correctAnswer,
    isMultipleAnswers,
    explanation,
    isEditMode,
    editingQuestionIndex,
    resetQuestionForm,
  ]);

  const startEditQuestion = useCallback(
    (questionIndex: number): void => {
      if (!exam.questions) {
        return;
      }

      const question = exam.questions[questionIndex];
      if (!question) {
        return;
      }

      setQuestionText(question.questionText || '');
      setOptions(question.options ? question.options.filter((opt): opt is string => opt != null) : ['', '']);
      setCorrectAnswer(
        question.correctAnswers ? question.correctAnswers.filter((ans): ans is string => ans != null) : []
      );
      setIsMultipleAnswers(question.isMultipleAnswers || false);
      setExplanation(question.explanation || '');
      setEditingQuestionIndex(questionIndex);
      setIsEditMode(true);

      setTimeout(() => {
        document.querySelector('.exam-section:nth-child(3)')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    },
    [exam.questions]
  );

  const removeQuestion = useCallback(
    (questionIndex: number): void => {
      setExam((prev) => {
        const newQuestions = (prev.questions || []).filter((_, index) => index !== questionIndex);
        return { ...prev, questions: newQuestions };
      });

      if (editingQuestionIndex === questionIndex) {
        resetQuestionForm();
      } else if (editingQuestionIndex !== null && editingQuestionIndex > questionIndex) {
        setEditingQuestionIndex(editingQuestionIndex - 1);
      }
    },
    [editingQuestionIndex, resetQuestionForm]
  );

  const cancelEdit = useCallback((): void => {
    resetQuestionForm();
  }, [resetQuestionForm]);

  // Shared form handlers
  const updateExamField = useCallback((field: keyof Exam, value: any): void => {
    setExam((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateTags = useCallback(
    (tags: string[]): void => {
      updateExamField('tags', tags);
    },
    [updateExamField]
  );

  // Mode-specific submission
  const submitExam = useCallback(async (): Promise<void> => {
    if (!isExamValid || !authenticated) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionStage('saving');
    setSubmitMessage(null);

    try {
      // Validation
      if (!exam.title?.trim()) {
        throw new Error(FORM_VALIDATION.MESSAGES.TITLE_REQUIRED);
      }
      if (!exam.description?.trim()) {
        throw new Error(FORM_VALIDATION.MESSAGES.DESCRIPTION_REQUIRED);
      }
      if (!exam.questions || exam.questions.length === 0) {
        throw new Error('At least one question is required');
      }

      // Validate each question
      for (let i = 0; i < exam.questions.length; i++) {
        const question = exam.questions[i];
        if (!question?.questionText?.trim()) {
          throw new Error(`Question ${i + 1} text is required`);
        }
        if (!question.options || question.options.length < APP_CONFIG.FORMS.MIN_OPTIONS_COUNT) {
          throw new Error(`Question ${i + 1} must have at least ${APP_CONFIG.FORMS.MIN_OPTIONS_COUNT} options`);
        }
        if (!question.correctAnswers || question.correctAnswers.length === 0) {
          throw new Error(`Question ${i + 1} must have at least one correct answer`);
        }
      }

      if (mode === 'create') {
        const createdExam = await ExamService.saveExam(exam);

        if (!createdExam) {
          throw new Error('Failed to create exam - no response from server');
        }

        setSubmissionStage('success');
        setSubmitMessage({
          type: 'success',
          text: 'Exam created successfully! Opening your new exam...',
        });

        // Navigate after success for create mode
        setTimeout(() => {
          setSubmissionStage('navigating');
          setTimeout(() => {
            if (createdExam.id) {
              navigate(ROUTES.EXAM_DETAIL(createdExam.id));
            } else {
              navigate(ROUTES.EXAMS);
            }
          }, APP_CONFIG.UI.NAVIGATION_DELAY);
        }, APP_CONFIG.UI.SUCCESS_DELAY);
      } else {
        const updatedExam = await ExamService.updateExam(exam);

        if (!updatedExam) {
          throw new Error('Failed to update exam - no response from server');
        }

        setOriginalExam(JSON.parse(JSON.stringify(exam))); // Update original for change detection
        setSubmissionStage('success');
        setSubmitMessage({
          type: 'success',
          text: 'Exam updated successfully!',
        });
      }
    } catch (error: any) {
      setSubmissionStage('idle');
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} exam:`, error);

      let errorMessage: string =
        mode === 'create' ? FORM_VALIDATION.MESSAGES.GENERIC_ERROR : 'Failed to update exam. Please try again.';

      if (error.message) {
        if (error.message.includes('Authentication required')) {
          errorMessage = FORM_VALIDATION.MESSAGES.AUTH_REQUIRED;
          setSubmitMessage({ type: 'warning', text: errorMessage });
          setTimeout(() => navigate(ROUTES.LOGIN), 2000);
          return;
        } else if (error.message.includes('required') || error.message.includes('must have')) {
          errorMessage = error.message;
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setSubmitMessage({ type: 'error', text: errorMessage });
    } finally {
      if (submissionStage !== 'navigating') {
        setIsSubmitting(false);
      }
    }
  }, [mode, isExamValid, authenticated, exam, navigate, submissionStage]);

  // Edit-specific: Cancel all changes
  const cancelAllChanges = useCallback((): void => {
    if (mode !== 'edit' || !originalExam) return;

    setExam(JSON.parse(JSON.stringify(originalExam)));
    resetQuestionForm();
    setSubmitMessage({ type: 'info', text: 'All changes have been reverted.' });
  }, [mode, originalExam, resetQuestionForm]);

  // Edit-specific: Navigation with unsaved changes check
  const goBack = useCallback((): void => {
    if (mode !== 'edit') {
      navigate(ROUTES.EXAMS);
      return;
    }

    if (hasUnsavedChanges) {
      setIsDialogOpen(true);
    } else {
      navigate(ROUTES.EXAM_DETAIL(examId || ''));
    }
  }, [mode, hasUnsavedChanges, navigate, examId]);

  const handleConfirmLeave = useCallback((): void => {
    setIsDialogOpen(false);
    navigate(ROUTES.EXAM_DETAIL(examId || ''));
  }, [navigate, examId]);

  const handleCancelLeave = useCallback((): void => {
    setIsDialogOpen(false);
  }, []);

  // Return all state and handlers
  return {
    mode,
    loadingState,
    canEdit,
    exam,
    originalExam,
    hasUnsavedChanges,
    selectedTags,
    updateExamField,
    updateTags,
    questionText,
    setQuestionText,
    options,
    addOption,
    removeOption,
    updateOption,
    correctAnswer,
    handleSingleCorrectAnswer,
    toggleMultipleCorrectAnswer,
    isMultipleAnswers,
    setIsMultipleAnswers,
    explanation,
    setExplanation,
    addQuestion,
    startEditQuestion,
    removeQuestion,
    cancelEdit,
    editingQuestionIndex,
    isEditMode,
    isQuestionValid,
    isExamValid,
    validationErrors,
    isSubmitting,
    submissionStage,
    submitMessage,
    submitExam,
    cancelAllChanges,
    goBack,
    isDialogOpen,
    handleConfirmLeave,
    handleCancelLeave,
    resetQuestionForm,
  };
};