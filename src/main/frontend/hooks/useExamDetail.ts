import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type Exam from 'Frontend/generated/com/howell/examvault/base/domain/Exam';
import type Question from 'Frontend/generated/com/howell/examvault/base/domain/Question';
import { ExamService } from 'Frontend/generated/endpoints';
import { ROUTES } from '../config/constants';

export interface ExamDetailState {
  exam: Exam | null;
  loading: boolean;
  error: string | null;
  canEdit: boolean;
  checkingPermissions: boolean;
  expandedQuestions: Set<string>;
}

export const useExamDetail = (examId: string | undefined, authenticated: boolean) => {
  const navigate = useNavigate();

  // Core exam state
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Permission state
  const [canEdit, setCanEdit] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // UI state
  const [expandedQuestions, setExpandedQuestions] = useState(new Set<string>());

  // Load exam and check permissions
  useEffect(() => {
    const fetchExamAndPermissions = async () => {
      if (!examId) {
        setError('No exam ID provided');
        setLoading(false);
        setCheckingPermissions(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch the exam
        const fetchedExam = await ExamService.getExamById(examId);

        if (fetchedExam) {
          setExam(fetchedExam);

          // Check edit permissions only if authenticated
          if (authenticated && examId) {
            try {
              const canModify = await ExamService.canUserModifyExam(examId);
              setCanEdit(canModify);
            } catch (permError) {
              console.error('Error checking edit permissions:', permError);
              setCanEdit(false);
            }
          } else {
            setCanEdit(false);
          }
        } else {
          setError('Exam not found');
        }
      } catch (err) {
        console.error('Error fetching exam:', err);
        setError('Failed to load exam. Please try again.');
      } finally {
        setLoading(false);
        setCheckingPermissions(false);
      }
    };

    fetchExamAndPermissions();
  }, [examId, authenticated]);

  // Question management
  const toggleQuestion = useCallback(
    (questionId: string) => {
      const newExpanded = new Set(expandedQuestions);
      if (newExpanded.has(questionId)) {
        newExpanded.delete(questionId);
      } else {
        newExpanded.add(questionId);
      }
      setExpandedQuestions(newExpanded);
    },
    [expandedQuestions]
  );

  const isCorrectAnswer = useCallback((option: string, question: Question) => {
    return question.correctAnswers?.includes(option) || false;
  }, []);

  // Navigation helpers
  const handleTagClick = useCallback(
    (tag: string) => {
      navigate('/exams', { state: { searchTags: [tag] } });
    },
    [navigate]
  );

  const navigateToAttempt = useCallback(() => {
    if (exam?.id) {
      navigate(ROUTES.EXAM_ATTEMPT(exam.id));
    }
  }, [exam?.id, navigate]);

  const navigateToEdit = useCallback(() => {
    if (exam?.id) {
      navigate(ROUTES.EXAM_EDIT(exam.id));
    }
  }, [exam?.id, navigate]);

  // Computed properties
  const examStats = useMemo(() => {
    if (!exam?.questions) {
      return {
        totalQuestions: 0,
        multipleChoiceCount: 0,
        multipleAnswerCount: 0,
      };
    }

    return {
      totalQuestions: exam.questions.length,
      multipleChoiceCount: exam.questions.filter((q) => !q?.isMultipleAnswers).length,
      multipleAnswerCount: exam.questions.filter((q) => q?.isMultipleAnswers).length,
    };
  }, [exam?.questions]);

  const selectedTags = useMemo(() => {
    return (exam?.tags || []).filter((tag): tag is string => tag != null && tag !== undefined);
  }, [exam?.tags]);

  return {
    // Core state
    exam,
    loading,
    error,

    // Permissions
    canEdit,
    checkingPermissions,

    // UI state
    expandedQuestions,
    toggleQuestion,

    // Helpers
    isCorrectAnswer,
    handleTagClick,
    navigateToAttempt,
    navigateToEdit,

    // Computed
    examStats,
    selectedTags,
  };
};
