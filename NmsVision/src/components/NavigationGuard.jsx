import React, { useEffect } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';

/**
 * NavigationGuard Component
 * 
 * Prevents manual URL changes for Admin and Operator roles.
 * Blocks address bar modifications and Back/Forward browser buttons.
 * Only allows navigation triggered via the application's UI (Link, navigate).
 */
const NavigationGuard = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const navType = useNavigationType();

    useEffect(() => {
        const rawRole = localStorage.getItem('userRole') || '';
        const userRole = rawRole.toLowerCase();
        
        // Check if user has a restricted role (Admin or Operateur/Operator)
        const isRestrictedUser = userRole === 'admin' || userRole === 'operateur' || userRole === 'operator';
        
        // If the user is NOT an Admin or Operator yet (e.g. at Login/Signup),
        // we allow navigation but we keep track of the path as a potential "last valid path"
        if (!isRestrictedUser) {
            sessionStorage.setItem('lastValidPath', location.pathname);
            return;
        }

        // FOR ADMIN AND OPERATOR: All manual URL modifications must be blocked.
        const lastValidPath = sessionStorage.getItem('lastValidPath');

        /**
         * Navigation Type Analysis:
         * - PUSH / REPLACE: Triggered by code (Link or navigate()). These are "Authorized actions".
         * - POP: Triggered by browser (Address bar Enter, Back/Forward buttons, Reload). These are "Manual modifications".
         */
        if (navType === 'POP') {
            // If the user is trying to change the URL manually (different from where they are)
            if (lastValidPath && location.pathname !== lastValidPath) {
                console.warn(`[NavigationGuard] Blocked manual navigation attempt to: ${location.pathname}`);
                
                // Revert to the last valid path immediately
                // replace: true ensures the unauthorized URL doesn't stay in browser history
                navigate(lastValidPath, { replace: true });
                return;
            }
        }

        // If the navigation is PUSH/REPLACE, or a POP that matches lastValidPath (like a Refresh),
        // we accept it and update our checkpoint.
        sessionStorage.setItem('lastValidPath', location.pathname);

    }, [location.pathname, navType, navigate]);

    return children;
};

export default NavigationGuard;
