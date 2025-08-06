import { useEffect } from 'react';

interface UseUnsavedChangesOptions {
  hasChanges: boolean;
  isSubmitted: boolean;
  onNavigationAttempt: (href: string) => void; // Fixed: now takes href parameter
}

export function useUnsavedChanges({
  hasChanges,
  isSubmitted,
  onNavigationAttempt
}: UseUnsavedChangesOptions) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasChanges && !isSubmitted) {
        event.preventDefault();
        event.returnValue = '';
        // Note: return statement is not needed, setting returnValue is sufficient
      }
    };

    const handleLinkClick = (event: MouseEvent) => {
      try {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        let link: HTMLAnchorElement | null = null;

        try {
          link = target.closest('a');
        } catch (err) {
          console.warn('Error in .closest():', err);
          return;
        }

        if (!link || link.target === '_blank' || link.href.startsWith('javascript:')) return;

        const isExternal =
          link.hostname !== window.location.hostname ||
          link.protocol !== window.location.protocol;

        if (hasChanges && !isSubmitted && !isExternal) {
          event.preventDefault();
          event.stopPropagation(); // Added: stopPropagation as expected by tests
          try {
            onNavigationAttempt(link.href); // Fixed: pass href to callback
          } catch (err) {
            console.error('Error in onNavigationAttempt:', err);
          }
        }
      } catch (err) {
        console.warn('Unexpected error in handleLinkClick:', err);
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (hasChanges && !isSubmitted) {
        event.preventDefault?.();
        window.history.pushState(null, document.title, window.location.href);
        try {
          onNavigationAttempt(window.location.href); // Fixed: pass current href
        } catch (err) {
          console.error('Error in onNavigationAttempt during popstate:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    // Fixed: Use document instead of window and add capture mode
    document.addEventListener('click', handleLinkClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Fixed: Use document instead of window and add capture mode
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasChanges, isSubmitted, onNavigationAttempt]);
}