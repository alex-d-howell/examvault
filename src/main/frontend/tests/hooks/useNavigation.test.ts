import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNavigation } from 'Frontend/hooks/useNavigation';
import { createWrapper } from '../test-utils';

describe('useNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('currentPath detection', () => {
    it('should detect root path', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(false), { wrapper });

      expect(result.current.currentPath).toBe('/');
    });

    it('should detect exams path', () => {
      const wrapper = createWrapper(['/exams']);
      const { result } = renderHook(() => useNavigation(false), { wrapper });

      expect(result.current.currentPath).toBe('/exams');
    });

    it('should detect home path', () => {
      const wrapper = createWrapper(['/home']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current.currentPath).toBe('/home');
    });

    it('should detect nested paths', () => {
      const wrapper = createWrapper(['/exams/123/attempt']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current.currentPath).toBe('/exams/123/attempt');
    });

    it('should detect login path', () => {
      const wrapper = createWrapper(['/login']);
      const { result } = renderHook(() => useNavigation(false), { wrapper });

      expect(result.current.currentPath).toBe('/login');
    });

    it('should detect profile path', () => {
      const wrapper = createWrapper(['/profile']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current.currentPath).toBe('/profile');
    });

    it('should handle paths with query parameters', () => {
      const wrapper = createWrapper(['/exams?search=test']);
      const { result } = renderHook(() => useNavigation(false), { wrapper });

      expect(result.current.currentPath).toBe('/exams');
    });

    it('should handle paths with hash fragments', () => {
      const wrapper = createWrapper(['/profile#settings']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current.currentPath).toBe('/profile');
    });
  });

  describe('navigation routes for unauthenticated users', () => {
    it('should return only browse exams for unauthenticated users', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(false), { wrapper });

      expect(result.current.navRoutes).toEqual([
        { path: '/exams', label: 'BROWSE EXAMS' }
      ]);
    });

    it('should be consistent across different paths for unauthenticated users', () => {
      const paths = ['/', '/exams', '/login'];
      
      paths.forEach(path => {
        const wrapper = createWrapper([path]);
        const { result } = renderHook(() => useNavigation(false), { wrapper });

        expect(result.current.navRoutes).toEqual([
          { path: '/exams', label: 'BROWSE EXAMS' }
        ]);
      });
    });
  });

  describe('navigation routes for authenticated users', () => {
    it('should return full navigation for authenticated users', () => {
      const wrapper = createWrapper(['/home']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current.navRoutes).toEqual([
        { path: '/home', label: 'HOME' },
        { path: '/exams', label: 'BROWSE EXAMS' },
        { path: '/exams/create', label: 'CREATE EXAM' }
      ]);
    });

    it('should maintain order of navigation routes', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      const expectedOrder = ['HOME', 'BROWSE EXAMS', 'CREATE EXAM'];
      const actualOrder = result.current.navRoutes.map(route => route.label);

      expect(actualOrder).toEqual(expectedOrder);
    });

    it('should include all required paths for authenticated users', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      const paths = result.current.navRoutes.map(route => route.path);
      
      expect(paths).toContain('/home');
      expect(paths).toContain('/exams');
      expect(paths).toContain('/exams/create');
    });

    it('should be consistent across different paths for authenticated users', () => {
      const paths = ['/home', '/exams', '/profile', '/exams/create'];
      const expectedRoutes = [
        { path: '/home', label: 'HOME' },
        { path: '/exams', label: 'BROWSE EXAMS' },
        { path: '/exams/create', label: 'CREATE EXAM' }
      ];
      
      paths.forEach(path => {
        const wrapper = createWrapper([path]);
        const { result } = renderHook(() => useNavigation(true), { wrapper });

        expect(result.current.navRoutes).toEqual(expectedRoutes);
      });
    });
  });

  describe('protected route detection', () => {
    it('should identify home as protected route', () => {
      const wrapper = createWrapper(['/home']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current.isProtectedRoute).toBe(true);
    });

    it('should identify profile as protected route', () => {
      const wrapper = createWrapper(['/profile']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current.isProtectedRoute).toBe(true);
    });

    it('should identify exam creation as protected route', () => {
      const wrapper = createWrapper(['/exams/create']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current.isProtectedRoute).toBe(true);
    });

    it('should identify nested protected routes', () => {
      const protectedPaths = [
        '/home/dashboard',
        '/profile/settings',
        '/exams/create/step-1'
      ];

      protectedPaths.forEach(path => {
        const wrapper = createWrapper([path]);
        const { result } = renderHook(() => useNavigation(true), { wrapper });

        expect(result.current.isProtectedRoute).toBe(true);
      });
    });

    it('should not identify public routes as protected', () => {
      const publicPaths = [
        '/',
        '/exams',
        '/login',
        '/about',
        '/exams/123'
      ];

      publicPaths.forEach(path => {
        const wrapper = createWrapper([path]);
        const { result } = renderHook(() => useNavigation(false), { wrapper });

        expect(result.current.isProtectedRoute).toBe(false);
      });
    });

    it('should handle edge cases in protected route detection', () => {
      const edgeCases = [
        '/homes', // Similar but not exact match
        '/profiles', // Similar but not exact match
        '/exam/create', // Close but not exact
        '/exams/created' // Close but not exact
      ];

      edgeCases.forEach(path => {
        const wrapper = createWrapper([path]);
        const { result } = renderHook(() => useNavigation(false), { wrapper });

        expect(result.current.isProtectedRoute).toBe(false);
      });
    });

    it('should handle exact path matching', () => {
      // Test that exact paths match but variations don't
      const testCases = [
        { path: '/home', expected: true },
        { path: '/home/', expected: true }, // Trailing slash should match
        { path: '/home/settings', expected: true }, // Nested should match
        { path: '/homecoming', expected: false }, // Should not match
        { path: '/exams/create', expected: true },
        { path: '/exams/create/', expected: true },
        { path: '/exams/create/new', expected: true },
        { path: '/exams/created', expected: false }
      ];

      testCases.forEach(({ path, expected }) => {
        const wrapper = createWrapper([path]);
        const { result } = renderHook(() => useNavigation(true), { wrapper });

        expect(result.current.isProtectedRoute).toBe(expected);
      });
    });
  });

  describe('layout visibility', () => {
    it('should show layout for most routes', () => {
      const routesWithLayout = [
        '/home',
        '/exams',
        '/profile',
        '/exams/create',
        '/exams/123',
        '/about'
      ];

      routesWithLayout.forEach(path => {
        const wrapper = createWrapper([path]);
        const { result } = renderHook(() => useNavigation(true), { wrapper });

        expect(result.current.shouldShowLayout).toBe(true);
      });
    });

    it('should hide layout for login page', () => {
      const wrapper = createWrapper(['/login']);
      const { result } = renderHook(() => useNavigation(false), { wrapper });

      expect(result.current.shouldShowLayout).toBe(false);
    });

    it('should hide layout for root path', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(false), { wrapper });

      expect(result.current.shouldShowLayout).toBe(false);
    });

    it('should handle layout exclusion consistently', () => {
      const excludedPaths = ['/login', '/'];

      excludedPaths.forEach(path => {
        const wrapper = createWrapper([path]);
        const { result } = renderHook(() => useNavigation(false), { wrapper });

        expect(result.current.shouldShowLayout).toBe(false);
      });
    });
  });

  describe('authentication state changes', () => {
    it('should update navigation routes when authentication changes', () => {
      const wrapper = createWrapper(['/exams']);
      const { result, rerender } = renderHook(
        ({ authenticated }) => useNavigation(authenticated),
        { 
          wrapper,
          initialProps: { authenticated: false } 
        }
      );

      // Initially unauthenticated
      expect(result.current.navRoutes).toEqual([
        { path: '/exams', label: 'BROWSE EXAMS' }
      ]);

      // Change to authenticated
      rerender({ authenticated: true });

      expect(result.current.navRoutes).toEqual([
        { path: '/home', label: 'HOME' },
        { path: '/exams', label: 'BROWSE EXAMS' },
        { path: '/exams/create', label: 'CREATE EXAM' }
      ]);
    });

    it('should maintain other properties when authentication changes', () => {
      const wrapper = createWrapper(['/exams']);
      const { result, rerender } = renderHook(
        ({ authenticated }) => useNavigation(authenticated),
        { 
          wrapper,
          initialProps: { authenticated: false } 
        }
      );

      const initialPath = result.current.currentPath;
      const initialLayout = result.current.shouldShowLayout;
      const initialProtected = result.current.isProtectedRoute;

      // Change authentication
      rerender({ authenticated: true });

      expect(result.current.currentPath).toBe(initialPath);
      expect(result.current.shouldShowLayout).toBe(initialLayout);
      expect(result.current.isProtectedRoute).toBe(initialProtected);
    });

    it('should handle rapid authentication state changes', () => {
      const wrapper = createWrapper(['/exams']);
      const { result, rerender } = renderHook(
        ({ authenticated }) => useNavigation(authenticated),
        { 
          wrapper,
          initialProps: { authenticated: false } 
        }
      );

      // Rapid state changes
      rerender({ authenticated: true });
      rerender({ authenticated: false });
      rerender({ authenticated: true });

      // Should end up with authenticated navigation
      expect(result.current.navRoutes).toHaveLength(3);
      expect(result.current.navRoutes).toContainEqual({ path: '/home', label: 'HOME' });
    });
  });

  describe('memoization and performance', () => {
    it('should memoize navRoutes for consistent authentication state', () => {
      const wrapper = createWrapper(['/exams']);
      const { result, rerender } = renderHook(
        ({ authenticated }) => useNavigation(authenticated),
        { 
          wrapper,
          initialProps: { authenticated: true } 
        }
      );

      const initialNavRoutes = result.current.navRoutes;

      // Rerender with same authentication state
      rerender({ authenticated: true });

      // Should return the same reference (memoized)
      expect(result.current.navRoutes).toBe(initialNavRoutes);
    });

    it('should create new navRoutes when authentication changes', () => {
      const wrapper = createWrapper(['/exams']);
      const { result, rerender } = renderHook(
        ({ authenticated }) => useNavigation(authenticated),
        { 
          wrapper,
          initialProps: { authenticated: false } 
        }
      );

      const unauthenticatedNavRoutes = result.current.navRoutes;

      // Change authentication
      rerender({ authenticated: true });

      const authenticatedNavRoutes = result.current.navRoutes;

      // Should be different references
      expect(authenticatedNavRoutes).not.toBe(unauthenticatedNavRoutes);
      expect(authenticatedNavRoutes).not.toEqual(unauthenticatedNavRoutes);
    });

    it('should memoize route detection computations', () => {
      const wrapper = createWrapper(['/home']);
      const { result, rerender } = renderHook(
        ({ authenticated }) => useNavigation(authenticated),
        { 
          wrapper,
          initialProps: { authenticated: true } 
        }
      );

      const initialProtected = result.current.isProtectedRoute;
      const initialLayout = result.current.shouldShowLayout;

      // Rerender with same props
      rerender({ authenticated: true });

      // Values should remain the same
      expect(result.current.isProtectedRoute).toBe(initialProtected);
      expect(result.current.shouldShowLayout).toBe(initialLayout);
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle unusual paths gracefully', () => {
      const unusualPaths = [
        '/////multiple/slashes',
        '/path with spaces',
        '/path%20with%20encoded%20spaces',
        '/path?query=value&other=test',
        '/path#fragment',
        ''
      ];

      unusualPaths.forEach(path => {
        expect(() => {
          const wrapper = createWrapper([path]);
          renderHook(() => useNavigation(true), { wrapper });
        }).not.toThrow();
      });
    });

    it('should handle very long paths', () => {
      const longPath = '/very/long/path/' + 'segment/'.repeat(100) + 'end';
      
      expect(() => {
        const wrapper = createWrapper([longPath]);
        renderHook(() => useNavigation(true), { wrapper });
      }).not.toThrow();
    });

    it('should handle paths with special characters', () => {
      const specialPaths = [
        '/path-with-dashes',
        '/path_with_underscores',
        '/path.with.dots',
        '/path+with+plus',
        '/path~with~tilde'
      ];

      specialPaths.forEach(path => {
        expect(() => {
          const wrapper = createWrapper([path]);
          renderHook(() => useNavigation(true), { wrapper });
        }).not.toThrow();
      });
    });

    it('should maintain referential stability of static values', () => {
      const wrapper = createWrapper(['/static-path']);
      const { result, rerender } = renderHook(
        ({ authenticated }) => useNavigation(authenticated),
        { 
          wrapper,
          initialProps: { authenticated: true } 
        }
      );

      const initialCurrentPath = result.current.currentPath;

      // Multiple rerenders
      rerender({ authenticated: true });
      rerender({ authenticated: true });

      expect(result.current.currentPath).toBe(initialCurrentPath);
    });

    it('should handle component unmount gracefully', () => {
      const wrapper = createWrapper(['/test']);
      const { unmount } = renderHook(() => useNavigation(true), { wrapper });

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('return value structure', () => {
    it('should always return required properties', () => {
      const wrapper = createWrapper(['/test']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(result.current).toHaveProperty('currentPath');
      expect(result.current).toHaveProperty('navRoutes');
      expect(result.current).toHaveProperty('isProtectedRoute');
      expect(result.current).toHaveProperty('shouldShowLayout');
    });

    it('should return correct types', () => {
      const wrapper = createWrapper(['/test']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      expect(typeof result.current.currentPath).toBe('string');
      expect(Array.isArray(result.current.navRoutes)).toBe(true);
      expect(typeof result.current.isProtectedRoute).toBe('boolean');
      expect(typeof result.current.shouldShowLayout).toBe('boolean');
    });

    it('should ensure navRoutes have correct structure', () => {
      const wrapper = createWrapper(['/test']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      result.current.navRoutes.forEach(route => {
        expect(route).toHaveProperty('path');
        expect(route).toHaveProperty('label');
        expect(typeof route.path).toBe('string');
        expect(typeof route.label).toBe('string');
      });
    });

    it('should ensure navRoutes paths are valid', () => {
      const wrapper = createWrapper(['/test']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      result.current.navRoutes.forEach(route => {
        expect(route.path).toMatch(/^\/[a-zA-Z0-9\/]*$/);
        expect(route.path.length).toBeGreaterThan(0);
      });
    });

    it('should ensure navRoutes labels are valid', () => {
      const wrapper = createWrapper(['/test']);
      const { result } = renderHook(() => useNavigation(true), { wrapper });

      result.current.navRoutes.forEach(route => {
        expect(route.label.length).toBeGreaterThan(0);
        expect(route.label.trim()).toBe(route.label);
      });
    });
  });
});