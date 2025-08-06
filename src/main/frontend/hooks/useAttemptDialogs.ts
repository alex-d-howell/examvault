import { useState, useCallback } from 'react';

interface UseAttemptDialogsReturn {
  // Dialog states
  showConfirmDialog: boolean;
  showLeaveDialog: boolean;

  // Dialog actions
  openConfirmDialog: () => void;
  closeConfirmDialog: () => void;
  openLeaveDialog: () => void;
  closeLeaveDialog: () => void;

  // Navigation state
  pendingNavigation: string | null;
  setPendingNavigation: (url: string | null) => void;

  // Confirmation handlers
  handleConfirmSubmit: (submitFn: () => Promise<void>) => Promise<void>;
  handleConfirmLeave: () => void;
  handleCancelLeave: () => void;
}

export const useAttemptDialogs = (): UseAttemptDialogsReturn => {
  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Navigation state for leave dialog
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Dialog control functions
  const openConfirmDialog = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const openLeaveDialog = useCallback(() => {
    setShowLeaveDialog(true);
  }, []);

  const closeLeaveDialog = useCallback(() => {
    setShowLeaveDialog(false);
  }, []);

  // Handle submission confirmation
  const handleConfirmSubmit = useCallback(async (submitFn: () => Promise<void>): Promise<void> => {
    setShowConfirmDialog(false);
    try {
      await submitFn();
    } catch (error) {
      // Handle submit function errors gracefully
      console.error('Submit function failed:', error);
      // Re-throw if needed, or handle silently based on requirements
      // For now, we'll handle silently to prevent unhandled rejections
    }
  }, []);

  // Handle confirmed navigation (user wants to leave)
  const handleConfirmLeave = useCallback(() => {
    setShowLeaveDialog(false);

    try {
      if (pendingNavigation) {
        // Navigate to the clicked link
        window.location.href = pendingNavigation;
      } else {
        // Handle back navigation
        window.history.back();
      }
    } catch (error) {
      // Handle navigation errors gracefully
      console.error('Navigation failed:', error);
    }

    setPendingNavigation(null);
  }, [pendingNavigation]);

  // Handle cancelled navigation (user wants to stay)
  const handleCancelLeave = useCallback(() => {
    setShowLeaveDialog(false);
    setPendingNavigation(null);
  }, []);

  return {
    // Dialog states
    showConfirmDialog,
    showLeaveDialog,

    // Dialog actions
    openConfirmDialog,
    closeConfirmDialog,
    openLeaveDialog,
    closeLeaveDialog,

    // Navigation state
    pendingNavigation,
    setPendingNavigation,

    // Confirmation handlers
    handleConfirmSubmit,
    handleConfirmLeave,
    handleCancelLeave,
  };
};