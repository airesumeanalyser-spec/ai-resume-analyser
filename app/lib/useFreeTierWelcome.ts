/**
 * useFreeTierWelcome Hook
 * 
 * Manages the free tier welcome modal state for newly logged-in users.
 * 
 * Features:
 * - Auto-show on first login (sessionStorage check)
 * - Persistent dismissal per session
 * - Forced show/hide for testing
 * - Calculates free trial days from localStorage
 * 
 * Returns:
 * {
 *   showModal: boolean,
 *   freeTrialDaysRemaining: number,
 *   dismissModal: () => void,
 *   forceShowModal: () => void,
 * }
 */

import { useEffect, useState } from 'react';
import { useApiStore } from './api';

export function useFreeTierWelcome() {
    const { auth } = useApiStore();
    const [showModal, setShowModal] = useState(false);
    const [freeTrialDaysRemaining, setFreeTrialDaysRemaining] = useState(14);

    useEffect(() => {
        // Only show for authenticated users
        if (!auth.isAuthenticated) {
            setShowModal(false);
            return;
        }

        // Check if we've already shown the modal this session
        const hasShownModal = sessionStorage.getItem('freeTierWelcomeShown');

        if (!hasShownModal) {
            // Calculate trial days remaining from localStorage or default to 14
            try {
                const userData = localStorage.getItem('user_trial_data');
                if (userData) {
                    const data = JSON.parse(userData);
                    setFreeTrialDaysRemaining(data.trialDaysRemaining || 14);
                } else {
                    setFreeTrialDaysRemaining(14);
                }
            } catch (error) {
                console.error('Error reading trial data:', error);
                setFreeTrialDaysRemaining(14);
            }

            // Show modal after a short delay for better UX
            const timer = setTimeout(() => {
                setShowModal(true);
                sessionStorage.setItem('freeTierWelcomeShown', 'true');
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [auth.isAuthenticated]);

    const dismissModal = () => {
        setShowModal(false);
    };

    const forceShowModal = () => {
        setShowModal(true);
        sessionStorage.removeItem('freeTierWelcomeShown');
    };

    return {
        showModal,
        freeTrialDaysRemaining,
        dismissModal,
        forceShowModal,
    };
}
