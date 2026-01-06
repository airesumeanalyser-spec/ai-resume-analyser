/**
 * useTrialExpiringWarning Hook
 * 
 * Custom hook to manage trial expiring modal logic.
 * Shows a modal when free trial is about to expire (3 days or less).
 * 
 * Features:
 * - Automatic modal trigger
 * - Dismissible with localStorage persistence
 * - Respects user preferences
 * - Returns modal state and handlers
 * 
 * Usage:
 * ```tsx
 * const { showModal, dismissModal, trialDaysRemaining } = useTrialExpiringWarning(14);
 * 
 * <TrialExpiringModal
 *   isOpen={showModal}
 *   daysRemaining={trialDaysRemaining}
 *   onDismiss={dismissModal}
 *   onUpgrade={() => navigate('/plans')}
 * />
 * ```
 */

import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to manage trial expiring warning modal
 * 
 * @param daysRemaining - Number of days remaining in trial
 * @param thresholdDays - Number of days before showing modal (default: 3)
 * @returns Object with modal state and handlers
 */
export function useTrialExpiringWarning(
    daysRemaining: number = 0,
    thresholdDays: number = 3
) {
    const [showModal, setShowModal] = useState(false);
    const [dismissedToday, setDismissedToday] = useState(false);

    /**
     * Check if modal was already dismissed today
     */
    useEffect(() => {
        const dismissalDate = localStorage.getItem('trial_modal_dismissed_date');
        const today = new Date().toDateString();

        if (dismissalDate === today) {
            setDismissedToday(true);
        } else {
            setDismissedToday(false);
        }
    }, []);

    /**
     * Show modal if trial is ending soon and not dismissed
     */
    useEffect(() => {
        if (
            daysRemaining > 0 &&
            daysRemaining <= thresholdDays &&
            !dismissedToday
        ) {
            // Show modal after a short delay to let page load
            const timer = setTimeout(() => {
                setShowModal(true);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [daysRemaining, thresholdDays, dismissedToday]);

    /**
     * Dismiss modal and record dismissal date
     */
    const dismissModal = useCallback(() => {
        const today = new Date().toDateString();
        localStorage.setItem('trial_modal_dismissed_date', today);
        setShowModal(false);
        setDismissedToday(true);
    }, []);

    /**
     * Force show modal (useful for testing)
     */
    const forceShowModal = useCallback(() => {
        setShowModal(true);
        setDismissedToday(false);
    }, []);

    /**
     * Reset modal (clears dismissal)
     */
    const resetModal = useCallback(() => {
        localStorage.removeItem('trial_modal_dismissed_date');
        setDismissedToday(false);
    }, []);

    return {
        showModal,
        dismissModal,
        forceShowModal,
        resetModal,
        trialDaysRemaining: daysRemaining,
        isDismissedToday: dismissedToday,
    };
}
