import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockNavigate = vi.fn();
const mockLocation = {
  pathname: '/login',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));

// Mock the useAuth hook 
const mockUseAuth = vi.fn();
vi.mock('Frontend/hooks/useAuth.js', () => ({
  useAuth: () => mockUseAuth()
}));

import LoginView from 'Frontend/views/login/@index';

describe('LoginView', () => {
  const mockWindowLocation = { href: '' };
  const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'location', { 
      value: mockWindowLocation, 
      writable: true 
    });
    Object.defineProperty(window, 'sessionStorage', { 
      value: mockSessionStorage, 
      writable: true 
    });
    
    // Reset router mocks
    mockNavigate.mockClear();
    mockLocation.search = '';
    mockLocation.pathname = '/login';
    
    // Default auth state
    mockUseAuth.mockReturnValue({
      authenticated: false,
      authInitialized: true,
      loading: false
    });
    
    mockWindowLocation.href = '';
  });

  describe('Authentication States', () => {
    it('shows loading when auth is initializing', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        authInitialized: false,
        loading: false
      });
      
      render(<LoginView />);
      
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('shows loading when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        authenticated: false,
        authInitialized: true,
        loading: true
      });
      
      render(<LoginView />);
      
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('shows redirecting when authenticated', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        authInitialized: true,
        loading: false
      });
      
      render(<LoginView />);
      
      expect(screen.getByText('Redirecting...')).toBeInTheDocument();
    });

    it('shows login form when not authenticated', () => {
      render(<LoginView />);
      
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when error parameter is present', () => {
      mockLocation.search = '?error=true';
      
      render(<LoginView />);
      
      expect(screen.getByText('Authentication failed. Please try again.')).toBeInTheDocument();
    });

    it('does not show error when no error in URL', () => {
      mockLocation.search = '';
      
      render(<LoginView />);
      
      expect(screen.queryByText('Authentication failed. Please try again.')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('initiates Google OAuth when sign in button is clicked', () => {
      render(<LoginView />);
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleButton);
      
      expect(mockWindowLocation.href).toBe('/oauth2/authorization/google');
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    it('disables Google button while signing in', () => {
      render(<LoginView />);
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.click(googleButton);
      
      expect(googleButton).toBeDisabled();
    });

    it('navigates to exams when continue browsing is clicked', () => {
      render(<LoginView />);
      
      const browseButton = screen.getByRole('button', { name: /continue browsing without signing in/i });
      fireEvent.click(browseButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/exams');
    });
  });

  describe('Content Display', () => {
    it('displays all required content', () => {
      render(<LoginView />);
      
      expect(screen.getByText('EXAM VAULT')).toBeInTheDocument();
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByText('What you get with an account:')).toBeInTheDocument();
      expect(screen.getByText('Track your progress and scores')).toBeInTheDocument();
      expect(screen.getByText(/By signing in, you agree to our terms/)).toBeInTheDocument();
    });
  });

  describe('Redirect Logic', () => {
    it('calls navigate when authenticated with URL redirect', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        authInitialized: true,
        loading: false
      });
      mockLocation.search = '?redirect=/dashboard';
      
      render(<LoginView />);
      
      // The component should call navigate with the redirect path
      // Note: This might need to be tested with waitFor if there's async behavior
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('calls navigate to home when authenticated with no redirect', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        authInitialized: true,
        loading: false
      });
      mockLocation.search = '';
      mockSessionStorage.getItem.mockReturnValue(null);
      
      render(<LoginView />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true });
    });

    it('checks session storage for redirect path', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        authInitialized: true,
        loading: false
      });
      mockSessionStorage.getItem.mockReturnValue('/profile');
      
      render(<LoginView />);
      
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('redirectPath');
      expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    });

    it('removes redirect path from session storage when used', () => {
      mockUseAuth.mockReturnValue({
        authenticated: true,
        authInitialized: true,
        loading: false
      });
      mockSessionStorage.getItem.mockReturnValue('/profile');
      
      render(<LoginView />);
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('redirectPath');
    });
  });

  describe('Component Structure', () => {
    it('renders with correct CSS classes', () => {
      render(<LoginView />);
      
      // Check main container exists
      const container = document.querySelector('.login-container');
      expect(container).toBeInTheDocument();
    });

    it('renders Google icon SVG correctly', () => {
      render(<LoginView />);
      
      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      const svgIcon = googleButton.querySelector('svg.login-google-icon');
      
      expect(svgIcon).toBeInTheDocument();
    });
  });
});