//Variables that are shared across the application
export const APP_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    LOADING_SKELETON_COUNT: 6,
    RECENT_EXAMS_COUNT: 6,
    MAX_VISIBLE_TAGS: 4,
  },

  SEARCH: {
    DEBOUNCE_DELAY: 300,
    MIN_QUESTIONS_DEFAULT: 1,
    MAX_QUESTIONS_DEFAULT: 99999,
    MAX_SEARCH_RESULTS: 100,
    VIRTUAL_SCROLL_THRESHOLD: 50,
  },

  FORMS: {
    MIN_OPTIONS_COUNT: 2,
    MAX_OPTIONS_COUNT: 10,
    MAX_EXPLANATION_LENGTH: 1000,
    MAX_TITLE_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 2000,
    MAX_TAGS_COUNT: 10,
    MAX_COMMENT_LENGTH: 1000,
    QUESTION_TEXT_MIN_LENGTH: 5,
    TITLE_MIN_LENGTH: 3,
    DESCRIPTION_MIN_LENGTH: 10,
    OPTION_MIN_LENGTH: 1,
  },

  UI: {
    EXAM_CARD_MIN_WIDTH: 350,
    EXAM_CARD_HEIGHT: 280,
    ANIMATION_DURATION: 200,
    HOVER_TRANSLATE_Y: -8,
    HOVER_TRANSLATE_CARD: -4,
    MODAL_WIDTH_VW: 75,
    MODAL_HEIGHT_VH: 60,
    READ_MORE_HEIGHT: '5rem',
    READ_MORE_TEXT_HEIGHT: '3rem',
    READ_MORE_LINK_HEIGHT: '1rem',
    SUCCESS_DELAY: 400,
    NAVIGATION_DELAY: 200,
  },

  BREAKPOINTS: {
    SM: 480,
    MD: 768,
    LG: 1024,
    XL: 1280,
    MAX_CONTENT_WIDTH: '1200px',
    SEARCH_CONTAINER_WIDTH: '95vw',
  },

  TIMING: {
    NOTIFICATION_DURATION: 3000,
    ERROR_NOTIFICATION_DURATION: 4000,
    SUCCESS_NOTIFICATION_DURATION: 1500,
    SCROLL_BEHAVIOR_DELAY: 100,
    SHIMMER_ANIMATION_DURATION: 10,
  },

  COLORS: {
    PRIMARY: '#3b82f6',
    PRIMARY_DARK: '#1e40af',
    SUCCESS: '#10b981',
    SUCCESS_DARK: '#047857',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    GRAY_100: '#f3f4f6',
    GRAY_500: '#6b7280',
    GRAY_900: '#111827',
  },
} as const;

export const ROUTES = {
  HOME: '/home',
  EXAMS: '/exams',
  EXAM_CREATE: '/exams/create',
  EXAM_DETAIL: (id: string) => `/exams/${id}`,
  EXAM_EDIT: (id: string) => `/exams/${id}/edit`,
  EXAM_ATTEMPT: (id: string) => `/exams/${id}/attempt`,
  LOGIN: '/login',
} as const;

export const FORM_VALIDATION = {
  MESSAGES: {
    TITLE_REQUIRED: 'Exam title is required',
    DESCRIPTION_REQUIRED: 'Exam description is required',
    QUESTION_TEXT_REQUIRED: 'Question text is required',
    MIN_OPTIONS_REQUIRED: `At least ${APP_CONFIG.FORMS.MIN_OPTIONS_COUNT} options are required`,
    CORRECT_ANSWER_REQUIRED: 'At least one correct answer must be selected',
    AUTH_REQUIRED: 'Authentication error. Please sign out and sign back in.',
    GENERIC_ERROR: 'Failed to create exam. Please try again.',
  },
} as const;

// Type helpers
export type AppConfig = typeof APP_CONFIG;
export type RouteConfig = typeof ROUTES;
