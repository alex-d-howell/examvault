import React, { ReactElement } from 'react';
import { render, RenderOptions, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, vi } from 'vitest';

// Mock TagsProvider for testing
const MockTagsProvider = ({ children }: { children: React.ReactNode }) => {
  // Create a proper React context
  const TagsContext = React.createContext({
    availableTags: ['tag1', 'tag2', 'tag3'],
    addTag: vi.fn(),
    removeTag: vi.fn(),
    searchTags: vi.fn(),
    loading: false,
    error: null
  });

  const mockTagsContext = {
    availableTags: ['tag1', 'tag2', 'tag3'],
    addTag: vi.fn(),
    removeTag: vi.fn(),
    searchTags: vi.fn(),
    loading: false,
    error: null
  };

  return React.createElement(
    TagsContext.Provider,
    { value: mockTagsContext },
    children
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  mockAuthState?: {
    authenticated?: boolean;
    authInitialized?: boolean;
    loading?: boolean;
  };
  withTagsProvider?: boolean;
}

const createWrapper = (initialEntries: string[] = ['/'], withTagsProvider: boolean = false) => {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    let content = (
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    );

    if (withTagsProvider) {
      content = React.createElement(MockTagsProvider, { children: content });
    }

    return content;
  };
};

const customRender = (
  ui: ReactElement,
  { initialEntries = ['/'], withTagsProvider = false, ...options }: CustomRenderOptions = {}
) => {
  return render(ui, { 
    wrapper: createWrapper(initialEntries, withTagsProvider), 
    ...options 
  });
};

export * from '@testing-library/react';
export { customRender as render, createWrapper };

export const mockAuthStates = {
  notAuthenticated: {
    authenticated: false,
    authInitialized: true,
    loading: false
  },
  authenticated: {
    authenticated: true,
    authInitialized: true,
    loading: false
  },
  loading: {
    authenticated: false,
    authInitialized: false,
    loading: true
  },
  authLoading: {
    authenticated: false,
    authInitialized: true,
    loading: true
  }
};

// Helper to create mock session storage
export const createMockSessionStorage = () => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0
});

// Helper to setup window.location mock
export const createMockLocation = () => ({
  href: '',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: ''
});

// ==== ENHANCED BEHAVIORAL TESTING UTILITIES ====

// Mock Data Factories for consistent test data
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  profilePictureUrl: 'https://example.com/avatar.jpg',
  ...overrides
});

export const createMockExam = (overrides = {}) => ({
  id: 'exam-123',
  title: 'Test Exam',
  description: 'Test exam description',
  uploadedBy: 'Test Author',
  uploadedAt: '2024-01-01T00:00:00Z',
  tags: ['test', 'sample'],
  questions: [createMockQuestion()],
  ...overrides
});

export const createMockQuestion = (overrides = {}) => ({
  id: 'question-123',
  questionText: 'Test question?',
  options: ['Option A', 'Option B', 'Option C'],
  correctAnswer: ['Option A'],
  isMultipleAnswers: false,
  explanation: 'Test explanation',
  ...overrides
});

export const createMockDashboardStats = (overrides = {}) => ({
  totalExamsCreated: 5,
  uniqueExamsTaken: 10,
  totalAttempts: 25,
  recentActivity: 3,
  studyStreak: 7,
  ...overrides
});

export const createMockExamAttempt = (overrides = {}) => ({
  id: 'attempt-123',
  examId: 'exam-123',
  examTitle: 'Test Exam',
  score: 85,
  totalQuestions: 10,
  correctAnswers: 8,
  timeSpent: 300000,
  completedAt: '2024-01-01T00:00:00Z',
  ...overrides
});

// Navigation and Router Testing Utilities
export const createMockNavigate = () => vi.fn();

export const createMockUseLocation = (overrides = {}) => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
  ...overrides
});

export const createMockSearchParams = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, String(value));
  });
  return searchParams;
};

// Hook Testing Utilities
export const createMockAuthHook = (state = mockAuthStates.authenticated, methods = {}) => ({
  ...state,
  user: state.authenticated ? createMockUser() : null,
  logout: vi.fn(),
  login: vi.fn(),
  ...methods
});

export const createMockDashboardHook = (overrides = {}) => ({
  myExams: [createMockExam()],
  myAttempts: [createMockExamAttempt()],
  dashboardStats: createMockDashboardStats(),
  loadingData: false,
  error: null,
  refresh: vi.fn(),
  ...overrides
});

export const createMockExamSearchHook = (overrides = {}) => ({
  sortedExams: [],
  loading: false,
  hasSearched: false,
  resultsCount: 0,
  searchExams: vi.fn(),
  clearSearch: vi.fn(),
  sortExams: vi.fn(),
  ...overrides
});

export const createMockLandingPageHook = (overrides = {}) => ({
  shouldShowLoading: false,
  shouldShowLanding: true,
  ...overrides
});

// Service Mocking Utilities
export const createMockExamService = () => ({
  searchExams: vi.fn().mockResolvedValue({ exams: [], totalCount: 0 }),
  getExamById: vi.fn().mockResolvedValue(createMockExam()),
  createExam: vi.fn().mockResolvedValue(createMockExam()),
  updateExam: vi.fn().mockResolvedValue(createMockExam()),
  deleteExam: vi.fn().mockResolvedValue(true),
});

export const createMockAuthService = () => ({
  getCurrentUser: vi.fn().mockResolvedValue(createMockUser()),
  logout: vi.fn().mockResolvedValue(undefined),
  refreshToken: vi.fn().mockResolvedValue(createMockUser()),
});

// Interaction Testing Utilities
export const createInteractionHelpers = () => ({
  clickButton: (name: string | RegExp) => {
    const button = screen.getByRole('button', { name });
    button.click();
    return button;
  },
  
  clickLink: (name: string | RegExp) => {
    const link = screen.getByRole('link', { name });
    link.click();
    return link;
  },
  
  fillInput: (label: string | RegExp, value: string) => {
    const input = screen.getByLabelText(label) as HTMLInputElement;
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return input;
  },
  
  submitForm: (form?: HTMLFormElement) => {
    const formElement = form || screen.getByRole('form');
    formElement.dispatchEvent(new Event('submit', { bubbles: true }));
    return formElement;
  }
});

// Assertion Helpers for Behavioral Testing
export const createBehaviorAssertions = () => ({
  expectNavigation: (mockNavigate: any, path: string, options?: any) => {
    if (options) {
      expect(mockNavigate).toHaveBeenCalledWith(path, options);
    } else {
      expect(mockNavigate).toHaveBeenCalledWith(path);
    }
  },
  
  expectAuthMethodCalled: (mockAuth: any, method: string, ...args: any[]) => {
    expect(mockAuth[method]).toHaveBeenCalledWith(...args);
  },
  
  expectServiceCalled: (mockService: any, method: string, ...args: any[]) => {
    expect(mockService[method]).toHaveBeenCalledWith(...args);
  },
  
  expectStateChange: (hookResult: any, property: string, expectedValue: any) => {
    expect(hookResult.current[property]).toBe(expectedValue);
  },
  
  expectLoadingState: (component: Element | null) => {
    expect(component).toBeInTheDocument();
    expect(component).toHaveTextContent(/loading|Loading/i);
  },
  
  expectErrorState: (message?: string) => {
    const errorElement = screen.getByRole('alert') || screen.getByText(/error|Error/i);
    expect(errorElement).toBeInTheDocument();
    if (message) {
      expect(errorElement).toHaveTextContent(message);
    }
  }
});

// Window Environment Setup
export const setupWindowMocks = () => {
  const location = createMockLocation();
  const sessionStorage = createMockSessionStorage();
  
  Object.defineProperty(window, 'location', {
    value: location,
    writable: true
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorage,
    writable: true
  });
  
  return { location, sessionStorage };
};

// Async Testing Utilities
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();
  
  while (!condition() && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};

export const waitForHookUpdate = async (hookResult: any, property: string, expectedValue: any) => {
  await waitForCondition(() => hookResult.current[property] === expectedValue);
};

// Test Data Collections for Complex Scenarios
export const createTestDataCollections = () => ({
  multipleExams: Array.from({ length: 5 }, (_, i) => 
    createMockExam({ 
      id: `exam-${i}`, 
      title: `Exam ${i + 1}`,
      uploadedAt: new Date(2024, 0, i + 1).toISOString()
    })
  ),
  
  multipleAttempts: Array.from({ length: 3 }, (_, i) => 
    createMockExamAttempt({ 
      id: `attempt-${i}`, 
      examTitle: `Exam ${i + 1}`,
      score: 70 + (i * 10)
    })
  ),
  
  differentAuthStates: [
    mockAuthStates.loading,
    mockAuthStates.notAuthenticated, 
    mockAuthStates.authenticated,
    mockAuthStates.authLoading
  ]
});

// Integration Testing Helpers
export const createIntegrationHelpers = () => ({
  simulateUserJourney: async (steps: Array<() => Promise<void> | void>) => {
    for (const step of steps) {
      await step();
    }
  },
  
  simulateAuthFlow: async (mockAuth: any, targetState: keyof typeof mockAuthStates) => {
    mockAuth.mockReturnValue(mockAuthStates[targetState]);
    // Trigger re-render or state change
    await waitForCondition(() => true, 100); // Brief wait for state change
  },
  
  simulateNavigation: (mockNavigate: any, path: string) => {
    mockNavigate.mockClear();
    return {
      expectNavigatedTo: (expectedPath: string) => {
        expect(mockNavigate).toHaveBeenCalledWith(expectedPath);
      }
    };
  }
});

// Tags-specific testing utilities
export const createMockTagsHook = (overrides = {}) => ({
  availableTags: ['tag1', 'tag2', 'tag3'],
  addTag: vi.fn(),
  removeTag: vi.fn(),
  searchTags: vi.fn(),
  loading: false,
  error: null,
  ...overrides
});

// Export organized utilities
export const testUtils = {
  data: {
    createMockUser,
    createMockExam, 
    createMockQuestion,
    createMockDashboardStats,
    createMockExamAttempt,
    createTestDataCollections
  },
  
  hooks: {
    createMockAuthHook,
    createMockDashboardHook,
    createMockExamSearchHook,
    createMockLandingPageHook,
    createMockTagsHook
  },
  
  services: {
    createMockExamService,
    createMockAuthService
  },
  
  interactions: createInteractionHelpers(),
  assertions: createBehaviorAssertions(),
  integration: createIntegrationHelpers(),
  
  setup: {
    setupWindowMocks,
    createMockNavigate,
    createMockUseLocation,
    createMockSearchParams
  },
  
  async: {
    waitForCondition,
    waitForHookUpdate
  }
};