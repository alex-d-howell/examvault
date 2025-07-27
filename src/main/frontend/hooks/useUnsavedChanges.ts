import { useEffect, useCallback } from 'react';

interface UseUnsavedChangesProps {
  hasChanges: boolean;
  isSubmitted: boolean;
  onNavigationAttempt: (url?: string) => void;
}

interface UseUnsavedChangesReturn {
  hasUnsavedChanges: boolean;
}

export const useUnsavedChanges = ({
  hasChanges,
  isSubmitted,
  onNavigationAttempt,
}: UseUnsavedChangesProps): UseUnsavedChangesReturn => {
  // Check if user has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return !isSubmitted && hasChanges;
  }, [isSubmitted, hasChanges]);

  // Handle beforeunload event for browser navigation (refresh, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.preventDefault();
        return message;
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Handle internal navigation (back/forward buttons, link clicks)
  useEffect(() => {
    let isNavigating = false;

    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges() && !isNavigating) {
        event.preventDefault();
        // Push current state back to prevent navigation
        window.history.pushState(null, document.title, window.location.href);
        onNavigationAttempt(); // No URL for back/forward navigation
      }
    };

    // Intercept all link clicks
    const handleLinkClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (link && hasUnsavedChanges() && !isNavigating) {
        event.preventDefault();
        event.stopPropagation();
        onNavigationAttempt(link.href); // Pass the URL for link navigation
      }
    };

    // Listen for back/forward button clicks
    window.addEventListener('popstate', handlePopState);

    // Listen for link clicks with capture to intercept early
    document.addEventListener('click', handleLinkClick, true);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleLinkClick, true);
      isNavigating = false;
    };
  }, [hasUnsavedChanges, onNavigationAttempt]);

  return {
    hasUnsavedChanges: hasUnsavedChanges(),
  };
};
