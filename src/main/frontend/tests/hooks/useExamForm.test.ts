import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExamForm } from 'Frontend/hooks/useExamForm';
import { ExamService } from 'Frontend/generated/endpoints';
import { testUtils } from '../test-utils';
import { mockNavigate } from '../setupTests';

// Mock ExamService
vi.mock('Frontend/generated/endpoints', () => ({
  ExamService: {
    saveExam: vi.fn(),
    updateExam: vi.fn(),
    getExamById: vi.fn(),
    canUserModifyExam: vi.fn(),
  },
}));

const mockExamService = ExamService as any;

// Mock sessionStorage
const mockSessionStorage = testUtils.setup.setupWindowMocks().sessionStorage;

describe('useExamForm', () => {
  const { createMockExam, createMockQuestion } = testUtils.data;

  const defaultCreateOptions = {
    mode: 'create' as const,
    authenticated: true,
    authInitialized: true,
    authLoading: false,
  };

  const defaultEditOptions = {
    mode: 'edit' as const,
    examId: 'exam-123',
    authenticated: true,
    authInitialized: true,
    authLoading: false,
  };

  // Helper function to setup a valid question
  const setupValidQuestion = async (result: any) => {
    act(() => {
      result.current.setQuestionText('What is React?');
      result.current.updateOption(0, 'A library');
      result.current.updateOption(1, 'A framework');
      result.current.handleSingleCorrectAnswer('A library');
    });

    await waitFor(() => {
      expect(result.current.isQuestionValid).toBe(true);
    });
  };

  // Helper function to setup a valid exam
  const setupValidExam = async (result: any) => {
    act(() => {
      result.current.updateExamField('title', 'Valid Title');
      result.current.updateExamField('description', 'Valid description');
      result.current.setQuestionText('What is React?');
      result.current.updateOption(0, 'A library');
      result.current.updateOption(1, 'A framework');
      result.current.handleSingleCorrectAnswer('A library');
    });

    await waitFor(() => {
      expect(result.current.isQuestionValid).toBe(true);
    });

    act(() => {
      result.current.addQuestion();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockNavigate.mockReset();
    // Allow console.log for debugging
    // vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock implementations - ensure exam has proper validation
    const defaultMockExam = createMockExam({
      title: 'Test Exam Title That Is Long Enough',
      description: 'Test exam description that is definitely long enough to pass validation',
      questions: [createMockQuestion()],
    });

    mockExamService.saveExam.mockResolvedValue(defaultMockExam);
    mockExamService.updateExam.mockResolvedValue(defaultMockExam);
    mockExamService.getExamById.mockResolvedValue(defaultMockExam);
    mockExamService.canUserModifyExam.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    mockNavigate.mockReset();
  });

  describe('initialization', () => {
    describe('create mode', () => {
      it('should initialize correctly for create mode', () => {
        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        expect(result.current.mode).toBe('create');
        expect(result.current.loadingState.isLoading).toBe(false);
        expect(result.current.loadingState.checkingAuth).toBe(false);
        expect(result.current.exam.title).toBe('');
        expect(result.current.exam.description).toBe('');
        expect(result.current.exam.questions).toEqual([]);
        expect(result.current.exam.tags).toEqual([]);
        expect(result.current.hasUnsavedChanges).toBe(true); // Create mode always has changes
      });

      it('should redirect to login when not authenticated', () => {
        renderHook(() =>
          useExamForm({
            ...defaultCreateOptions,
            authenticated: false,
          })
        );

        expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', '/exams/create');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      it('should not redirect when auth is still loading', () => {
        renderHook(() =>
          useExamForm({
            ...defaultCreateOptions,
            authenticated: false,
            authLoading: true,
          })
        );

        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    describe('edit mode', () => {
      it('should initialize with loading state for edit mode', () => {
        const { result } = renderHook(() => useExamForm(defaultEditOptions));

        expect(result.current.mode).toBe('edit');
        expect(result.current.loadingState.isLoading).toBe(true);
      });

      it('should load exam and check permissions successfully', async () => {
        const mockExam = createMockExam({
          title: 'Test Exam',
          description: 'Test Description',
          tags: ['tag1', 'tag2'],
        });
        mockExamService.getExamById.mockResolvedValue(mockExam);
        mockExamService.canUserModifyExam.mockResolvedValue(true);

        const { result } = renderHook(() => useExamForm(defaultEditOptions));

        await waitFor(() => {
          expect(result.current.loadingState.isLoading).toBe(false);
        });

        expect(result.current.exam).toEqual(mockExam);
        expect(result.current.originalExam).toEqual(mockExam);
        expect(result.current.canEdit).toBe(true);
        expect(result.current.hasUnsavedChanges).toBe(false);
        expect(mockExamService.getExamById).toHaveBeenCalledWith('exam-123');
        expect(mockExamService.canUserModifyExam).toHaveBeenCalledWith('exam-123');
      });

      it('should handle missing examId', async () => {
        const { result } = renderHook(() =>
          useExamForm({
            ...defaultEditOptions,
            examId: undefined,
          })
        );

        await waitFor(() => {
          expect(result.current.loadingState.isLoading).toBe(false);
        });

        expect(result.current.loadingState.error).toBe('No exam ID provided');
      });

      it('should handle permission denied', async () => {
        mockExamService.canUserModifyExam.mockResolvedValue(false);

        const { result } = renderHook(() => useExamForm(defaultEditOptions));

        await waitFor(() => {
          expect(result.current.loadingState.isLoading).toBe(false);
        });

        expect(result.current.loadingState.error).toContain('You do not have permission to edit this exam');
        expect(result.current.canEdit).toBe(false);
      });

      it('should handle exam not found', async () => {
        mockExamService.getExamById.mockResolvedValue(null);

        const { result } = renderHook(() => useExamForm(defaultEditOptions));

        await waitFor(() => {
          expect(result.current.loadingState.isLoading).toBe(false);
        });

        expect(result.current.loadingState.error).toBe('Exam not found');
      });

      it('should redirect to login when not authenticated', () => {
        renderHook(() =>
          useExamForm({
            ...defaultEditOptions,
            authenticated: false,
          })
        );

        expect(mockSessionStorage.setItem).toHaveBeenCalledWith('redirectPath', '/exams/exam-123/edit');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      it('should handle API errors gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        mockExamService.getExamById.mockRejectedValue(new Error('API Error'));

        const { result } = renderHook(() => useExamForm(defaultEditOptions));

        await waitFor(() => {
          expect(result.current.loadingState.isLoading).toBe(false);
        });

        expect(result.current.loadingState.error).toBe('Failed to load exam or verify permissions. Please try again.');
        expect(consoleSpy).toHaveBeenCalledWith('Error during initialization:', expect.any(Error));
      });
    });
  });

  describe('exam field management', () => {
    it('should update exam fields correctly', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.updateExamField('title', 'New Title');
      });

      expect(result.current.exam.title).toBe('New Title');

      act(() => {
        result.current.updateExamField('description', 'New Description');
      });

      expect(result.current.exam.description).toBe('New Description');
    });

    it('should update tags correctly', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.updateTags(['tag1', 'tag2', 'tag3']);
      });

      expect(result.current.exam.tags).toEqual(['tag1', 'tag2', 'tag3']);
      expect(result.current.selectedTags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should filter out null/undefined tags', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.updateTags(['tag1', null, 'tag2', undefined, 'tag3'] as any);
      });

      expect(result.current.selectedTags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('question builder functionality', () => {
    it('should manage question text correctly', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.setQuestionText('What is React?');
      });

      expect(result.current.questionText).toBe('What is React?');
    });

    it('should add options correctly', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.addOption();
      });

      expect(result.current.options).toHaveLength(3);
      expect(result.current.options[2]).toBe('');
    });

    it('should not add options beyond maximum', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      // Check initial length
      const initialLength = result.current.options.length; // Should be 2

      // Add options to reach maximum (try to add 10 more)
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addOption();
        }
      });

      // Should not exceed reasonable maximum (adjust based on actual implementation)
      expect(result.current.options.length).toBeLessThanOrEqual(10);
      // Or if there's a specific max, we can test that it doesn't add indefinitely
      expect(result.current.options.length).toBeGreaterThan(initialLength);
    });

    it('should remove options correctly', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      // Add an option first
      act(() => {
        result.current.addOption();
        result.current.updateOption(0, 'Option 1');
        result.current.updateOption(1, 'Option 2');
        result.current.updateOption(2, 'Option 3');
      });

      act(() => {
        result.current.removeOption(1);
      });

      expect(result.current.options).toHaveLength(2);
      expect(result.current.options).toEqual(['Option 1', 'Option 3']);
    });

    it('should not remove options below minimum', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.removeOption(0);
      });

      expect(result.current.options).toHaveLength(2); // Should still have minimum
    });

    it('should update options correctly', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.updateOption(0, 'Updated Option');
      });

      expect(result.current.options[0]).toBe('Updated Option');
    });

    it('should update correct answers when option text changes', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.updateOption(0, 'Option A');
        result.current.handleSingleCorrectAnswer('Option A');
      });

      expect(result.current.correctAnswer).toEqual(['Option A']);

      act(() => {
        result.current.updateOption(0, 'Updated Option A');
      });

      expect(result.current.correctAnswer).toEqual(['Updated Option A']);
    });

    it('should handle single correct answer selection', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.updateOption(0, 'Option A');
        result.current.updateOption(1, 'Option B');
        result.current.handleSingleCorrectAnswer('Option A');
      });

      expect(result.current.correctAnswer).toEqual(['Option A']);

      act(() => {
        result.current.handleSingleCorrectAnswer('Option B');
      });

      expect(result.current.correctAnswer).toEqual(['Option B']);
    });

    it('should handle multiple correct answers selection', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.updateOption(0, 'Option A');
        result.current.updateOption(1, 'Option B');
        result.current.setIsMultipleAnswers(true);
      });

      act(() => {
        result.current.toggleMultipleCorrectAnswer('Option A');
      });

      expect(result.current.correctAnswer).toEqual(['Option A']);

      act(() => {
        result.current.toggleMultipleCorrectAnswer('Option B');
      });

      expect(result.current.correctAnswer).toEqual(['Option A', 'Option B']);

      act(() => {
        result.current.toggleMultipleCorrectAnswer('Option A');
      });

      expect(result.current.correctAnswer).toEqual(['Option B']);
    });

    it('should manage explanation correctly', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.setExplanation('This is an explanation');
      });

      expect(result.current.explanation).toBe('This is an explanation');
    });
  });

  describe('question management', () => {
    it('should add a valid question', async () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      await setupValidQuestion(result);

      act(() => {
        result.current.addQuestion();
      });

      expect(result.current.exam.questions).toHaveLength(1);
      expect(result.current.exam.questions?.[0]).toEqual({
        questionText: 'What is React?',
        options: ['A library', 'A framework'],
        correctAnswers: ['A library'],
        isMultipleAnswers: false,
        explanation: undefined,
      });

      // Question form should be reset
      expect(result.current.questionText).toBe('');
      expect(result.current.options).toEqual(['', '']);
      expect(result.current.correctAnswer).toEqual([]);
    });

    it('should not add invalid question', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      // Don't set up valid question - leave it invalid
      act(() => {
        result.current.addQuestion();
      });

      expect(result.current.exam.questions).toHaveLength(0);
    });

    it('should start editing a question', async () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      // Add a question first
      await setupValidQuestion(result);
      act(() => {
        result.current.addQuestion();
      });

      act(() => {
        result.current.startEditQuestion(0);
      });

      expect(result.current.isEditMode).toBe(true);
      expect(result.current.editingQuestionIndex).toBe(0);
      expect(result.current.questionText).toBe('What is React?');
      expect(result.current.options).toEqual(['A library', 'A framework']);
      expect(result.current.correctAnswer).toEqual(['A library']);
    });

    it('should update question during edit', async () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      // Add and start editing
      await setupValidQuestion(result);
      act(() => {
        result.current.addQuestion();
      });

      // Wait for question to be added
      await waitFor(() => {
        expect(result.current.exam.questions).toHaveLength(1);
      });

      act(() => {
        result.current.startEditQuestion(0);
      });

      // Wait for edit mode to be set
      await waitFor(() => {
        expect(result.current.isEditMode).toBe(true);
      });

      // Modify the question
      act(() => {
        result.current.setQuestionText('What is Vue?');
        result.current.updateOption(0, 'A framework');
        result.current.handleSingleCorrectAnswer('A framework');
      });

      // Wait for validation
      await waitFor(() => {
        expect(result.current.isQuestionValid).toBe(true);
      });

      act(() => {
        result.current.addQuestion(); // This should update, not add
      });

      expect(result.current.exam.questions).toHaveLength(1);
      expect(result.current.exam.questions?.[0]?.questionText).toBe('What is Vue?');
      expect(result.current.exam.questions?.[0]?.options).toEqual(['A framework', 'A framework']);
      expect(result.current.isEditMode).toBe(false);
    });

    it('should remove a question', async () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      // Directly set two different questions
      act(() => {
        result.current.updateExamField('questions', [
          {
            questionText: 'First Question',
            options: ['A', 'B'],
            correctAnswers: ['A'],
            isMultipleAnswers: false,
          },
          {
            questionText: 'Second Question',
            options: ['C', 'D'],
            correctAnswers: ['C'],
            isMultipleAnswers: false,
          },
        ]);
      });

      expect(result.current.exam.questions).toHaveLength(2);

      // Remove first question
      act(() => {
        result.current.removeQuestion(0);
      });

      expect(result.current.exam.questions).toHaveLength(1);
      expect(result.current.exam.questions?.[0]?.questionText).toBe('Second Question');
    });

    it('should handle removing question that is being edited', async () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      await setupValidQuestion(result);
      act(() => {
        result.current.addQuestion();
      });

      // Wait for question to be added
      await waitFor(() => {
        expect(result.current.exam.questions).toHaveLength(1);
      });

      act(() => {
        result.current.startEditQuestion(0);
      });

      // Wait for edit mode to be set
      await waitFor(() => {
        expect(result.current.isEditMode).toBe(true);
      });

      act(() => {
        result.current.removeQuestion(0);
      });

      expect(result.current.exam.questions).toHaveLength(0);
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.editingQuestionIndex).toBeNull();
    });

    it('should cancel edit correctly', async () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      await setupValidQuestion(result);
      act(() => {
        result.current.addQuestion();
        result.current.startEditQuestion(0);
      });

      act(() => {
        result.current.setQuestionText('Modified text');
        result.current.cancelEdit();
      });

      expect(result.current.isEditMode).toBe(false);
      expect(result.current.questionText).toBe('');
      expect(result.current.editingQuestionIndex).toBeNull();
    });
  });

  describe('validation', () => {
    describe('question validation', () => {
      it('should validate question text length', async () => {
        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        act(() => {
          result.current.setQuestionText('a'); // Too short
        });

        await waitFor(() => {
          expect(result.current.isQuestionValid).toBe(false);
          expect(result.current.validationErrors.questionText).toContain('at least');
        });

        act(() => {
          result.current.setQuestionText('What is a valid question?');
        });

        await waitFor(() => {
          expect(result.current.validationErrors.questionText).toBeUndefined();
        });
      });

      it('should validate options count and content', async () => {
        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        act(() => {
          result.current.setQuestionText('Valid question?');
        });

        await waitFor(() => {
          expect(result.current.isQuestionValid).toBe(false);
          expect(result.current.validationErrors.options).toContain('empty option');
        });

        act(() => {
          result.current.updateOption(0, 'Option A');
          result.current.updateOption(1, 'Option B');
        });

        await waitFor(() => {
          expect(result.current.validationErrors.options).toBeUndefined();
        });
      });

      it('should validate correct answers', async () => {
        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        act(() => {
          result.current.setQuestionText('Valid question?');
          result.current.updateOption(0, 'Option A');
          result.current.updateOption(1, 'Option B');
        });

        await waitFor(() => {
          expect(result.current.isQuestionValid).toBe(false);
          expect(result.current.validationErrors.correctAnswer).toContain('At least one correct answer');
        });

        act(() => {
          result.current.handleSingleCorrectAnswer('Option A');
        });

        await waitFor(() => {
          expect(result.current.isQuestionValid).toBe(true);
          expect(result.current.validationErrors.correctAnswer).toBeUndefined();
        });
      });
    });

    describe('exam validation', () => {
      it('should validate exam title', async () => {
        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        await waitFor(() => {
          expect(result.current.isExamValid).toBe(false);
          expect(result.current.validationErrors.title).toContain('at least');
        });

        act(() => {
          result.current.updateExamField('title', 'Valid Title');
        });

        await waitFor(() => {
          expect(result.current.validationErrors.title).toBeUndefined();
        });
      });

      it('should validate exam description', async () => {
        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        act(() => {
          result.current.updateExamField('title', 'Valid Title');
        });

        await waitFor(() => {
          expect(result.current.validationErrors.description).toContain('at least');
        });

        act(() => {
          result.current.updateExamField('description', 'Valid description');
        });

        await waitFor(() => {
          expect(result.current.validationErrors.description).toBeUndefined();
        });
      });

      it('should validate questions requirement', async () => {
        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        act(() => {
          result.current.updateExamField('title', 'Valid Title');
          result.current.updateExamField('description', 'Valid description');
        });

        await waitFor(() => {
          expect(result.current.validationErrors.general).toContain('At least one question is required');
        });
      });

      it('should validate authentication', async () => {
        const { result } = renderHook(() =>
          useExamForm({
            ...defaultCreateOptions,
            authenticated: false,
          })
        );

        await waitFor(() => {
          expect(result.current.validationErrors.general).toContain('You must be signed in');
        });
      });
    });
  });

  describe('submission', () => {
    describe('create mode submission', () => {
      it('should create exam successfully', async () => {
        const createdExam = createMockExam({ id: 'new-exam-123' });
        mockExamService.saveExam.mockResolvedValue(createdExam);

        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        await setupValidExam(result);

        await waitFor(() => {
          expect(result.current.isExamValid).toBe(true);
        });

        act(() => {
          result.current.submitExam();
        });

        expect(result.current.isSubmitting).toBe(true);
        expect(result.current.submissionStage).toBe('saving');

        await waitFor(() => {
          expect(result.current.submissionStage).toBe('success');
        });

        expect(mockExamService.saveExam).toHaveBeenCalledWith(result.current.exam);
        expect(result.current.submitMessage?.type).toBe('success');
      });

      it('should handle create exam failure', async () => {
        mockExamService.saveExam.mockRejectedValue(new Error('Server error'));

        const { result } = renderHook(() => useExamForm(defaultCreateOptions));

        await setupValidExam(result);

        await waitFor(() => {
          expect(result.current.isExamValid).toBe(true);
        });

        await act(async () => {
          await result.current.submitExam();
        });

        expect(result.current.submissionStage).toBe('idle');
        expect(result.current.submitMessage?.type).toBe('error');
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    describe('edit mode submission', () => {
      it('should update exam successfully', async () => {
        // Create a question with the EXACT structure the validation expects
        const validQuestion = {
          questionText: 'Test question text that is long enough',
          options: ['Option A', 'Option B', 'Option C'],
          correctAnswers: ['Option A'], // Make sure this matches what validation expects
          isMultipleAnswers: false,
          explanation: 'Test explanation',
        };

        const validExam = createMockExam({
          title: 'Original Title That Is Long Enough',
          description: 'Original description that is definitely long enough to pass validation',
          questions: [validQuestion],
        });

        mockExamService.getExamById.mockResolvedValue(validExam);
        mockExamService.updateExam.mockResolvedValue(validExam);

        const { result } = renderHook(() => useExamForm(defaultEditOptions));

        await waitFor(() => {
          expect(result.current.loadingState.isLoading).toBe(false);
        });

        act(() => {
          result.current.updateExamField('title', 'Updated Title That Is Long Enough');
        });

        await waitFor(() => {
          expect(result.current.hasUnsavedChanges).toBe(true);
        });

        mockExamService.updateExam.mockClear();

        await act(async () => {
          await result.current.submitExam();
        });

        expect(mockExamService.updateExam).toHaveBeenCalled();
      });
    });

    it('should not submit invalid exam', async () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      await act(async () => {
        await result.current.submitExam();
      });

      expect(mockExamService.saveExam).not.toHaveBeenCalled();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should not submit when not authenticated', async () => {
      const { result } = renderHook(() =>
        useExamForm({
          ...defaultCreateOptions,
          authenticated: false,
        })
      );

      await act(async () => {
        await result.current.submitExam();
      });

      expect(mockExamService.saveExam).not.toHaveBeenCalled();
    });
  });

  describe('edit mode specific features', () => {
    it('should detect unsaved changes correctly', async () => {
      const { result } = renderHook(() => useExamForm(defaultEditOptions));

      await waitFor(() => {
        expect(result.current.loadingState.isLoading).toBe(false);
      });

      expect(result.current.hasUnsavedChanges).toBe(false);

      act(() => {
        result.current.updateExamField('title', 'Modified Title');
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should cancel all changes', async () => {
      const originalExam = createMockExam({ title: 'Original Title' });
      mockExamService.getExamById.mockResolvedValue(originalExam);

      const { result } = renderHook(() => useExamForm(defaultEditOptions));

      await waitFor(() => {
        expect(result.current.loadingState.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateExamField('title', 'Modified Title');
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      act(() => {
        result.current.cancelAllChanges();
      });

      expect(result.current.exam.title).toBe('Original Title');
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.submitMessage?.type).toBe('info');
    });

    it('should handle go back with unsaved changes', async () => {
      const { result } = renderHook(() => useExamForm(defaultEditOptions));

      await waitFor(() => {
        expect(result.current.loadingState.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateExamField('title', 'Modified Title');
      });

      act(() => {
        result.current.goBack();
      });

      expect(result.current.isDialogOpen).toBe(true);
    });

    it('should handle go back without unsaved changes', async () => {
      const { result } = renderHook(() => useExamForm(defaultEditOptions));

      await waitFor(() => {
        expect(result.current.loadingState.isLoading).toBe(false);
      });

      act(() => {
        result.current.goBack();
      });

      expect(result.current.isDialogOpen).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith('/exams/exam-123');
    });

    it('should handle confirm leave dialog', async () => {
      const { result } = renderHook(() => useExamForm(defaultEditOptions));

      await waitFor(() => {
        expect(result.current.loadingState.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateExamField('title', 'Modified Title');
      });

      // Wait for unsaved changes to be detected
      await waitFor(() => {
        expect(result.current.hasUnsavedChanges).toBe(true);
      });

      act(() => {
        result.current.goBack();
      });

      // Wait for dialog to open
      await waitFor(() => {
        expect(result.current.isDialogOpen).toBe(true);
      });

      act(() => {
        result.current.handleConfirmLeave();
      });

      expect(result.current.isDialogOpen).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith('/exams/exam-123');
    });

    it('should handle cancel leave dialog', async () => {
      const { result } = renderHook(() => useExamForm(defaultEditOptions));

      await waitFor(() => {
        expect(result.current.loadingState.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateExamField('title', 'Modified Title');
      });

      await waitFor(() => {
        expect(result.current.hasUnsavedChanges).toBe(true);
      });

      mockNavigate.mockClear(); // Clear before the action

      act(() => {
        result.current.goBack();
      });

      await waitFor(() => {
        expect(result.current.isDialogOpen).toBe(true);
      });

      act(() => {
        result.current.handleCancelLeave();
      });

      expect(result.current.isDialogOpen).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle exam without tags', async () => {
      const examWithoutTags = createMockExam({ tags: undefined });
      mockExamService.getExamById.mockResolvedValue(examWithoutTags);

      const { result } = renderHook(() => useExamForm(defaultEditOptions));

      await waitFor(() => {
        expect(result.current.loadingState.isLoading).toBe(false);
      });

      expect(result.current.exam.tags).toEqual([]);
    });

    it('should handle malformed question data during edit', async () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      const malformedQuestion = createMockQuestion({
        options: null,
        correctAnswers: undefined,
      });

      // Manually set a malformed question
      act(() => {
        result.current.updateExamField('questions', [malformedQuestion]);
      });

      expect(() => {
        act(() => {
          result.current.startEditQuestion(0);
        });
      }).not.toThrow();

      expect(result.current.options).toEqual(['', '']);
      expect(result.current.correctAnswer).toEqual([]);
    });

    it('should reset form correctly', () => {
      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.setQuestionText('Test question');
        result.current.updateOption(0, 'Option A');
        result.current.setExplanation('Test explanation');
        result.current.setIsMultipleAnswers(true);
      });

      act(() => {
        result.current.resetQuestionForm();
      });

      expect(result.current.questionText).toBe('');
      expect(result.current.options).toEqual(['', '']);
      expect(result.current.correctAnswer).toEqual([]);
      expect(result.current.isMultipleAnswers).toBe(false);
      expect(result.current.explanation).toBe('');
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.editingQuestionIndex).toBeNull();
    });

    it('should handle component unmount gracefully', () => {
      const { result, unmount } = renderHook(() => useExamForm(defaultCreateOptions));

      act(() => {
        result.current.updateExamField('title', 'Test Title');
      });

      expect(() => unmount()).not.toThrow();
    });

    it('should handle authentication errors during submission', async () => {
      mockExamService.saveExam.mockRejectedValue(new Error('Authentication required'));

      const { result } = renderHook(() => useExamForm(defaultCreateOptions));

      await setupValidExam(result);

      await waitFor(() => {
        expect(result.current.isExamValid).toBe(true);
      });

      await act(async () => {
        await result.current.submitExam();
      });

      expect(result.current.submitMessage?.type).toBe('warning');
      // Accept either the exact message or one containing the key phrase
      expect(
        result.current.submitMessage?.text?.includes('Authentication') ||
          result.current.submitMessage?.text?.includes('Authentication required')
      ).toBe(true);
    });
  });
});
