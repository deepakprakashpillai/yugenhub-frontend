import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if a CSS media query matches.
 * @param {string} query - A CSS media query string, e.g. '(max-width: 767px)'
 * @returns {boolean} Whether the media query currently matches
 */
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (e) => setMatches(e.matches);

        // Set initial value
        setMatches(mediaQuery.matches);

        // Listen for changes
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
};

/**
 * Convenience hook: returns true when viewport is below Tailwind's `md` breakpoint (768px).
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

export default useMediaQuery;
