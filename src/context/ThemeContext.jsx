import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { THEME_VARIANTS } from '../theme';
import { useAgencyConfig } from './AgencyConfigContext';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const { config } = useAgencyConfig();

    // Initialize from localStorage or fallback to 'dark'
    const [themeMode, setThemeModeState] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme_mode') || 'dark';
        }
        return 'dark';
    });
    const [accentColor, setAccentColor] = useState('#ef4444');

    // Wrapper to update state and localStorage
    const setThemeMode = (mode) => {
        setThemeModeState(mode);
        localStorage.setItem('theme_mode', mode);
    };

    useEffect(() => {
        if (config) {
            // Only apply config theme if NO local preference exists
            const localTheme = localStorage.getItem('theme_mode');
            if (!localTheme && config.theme_mode) {
                setThemeMode(config.theme_mode);
            }

            // Accents are always Org-controlled for now
            setAccentColor(config.accent_color || '#ef4444');
        }
    }, [config]);

    // Apply 'dark' class to html element
    useEffect(() => {
        const root = window.document.documentElement;
        console.log('ThemeContext: Setting theme mode to', themeMode); // DEBUG
        root.classList.remove('light', 'dark');
        root.classList.add(themeMode);

        // Also ensure body has it, just in case cmdk portals there and needs inheritance
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(themeMode);
    }, [themeMode]);

    // Construct the active theme object
    const theme = useMemo(() => {
        const baseTheme = THEME_VARIANTS[themeMode === 'light' ? 'light' : 'dark'];

        // Deep copy to avoid mutating the base
        const newTheme = JSON.parse(JSON.stringify(baseTheme));

        // Inject custom accent color into 'default' accent
        if (newTheme.accents && newTheme.accents.default) {
            newTheme.accents.default.primary = accentColor;
            // Create a glow with opacity
            // Simple hex to rgba conversion if needed, or just use CSS variables in future
            // For now, let's try to keep it simple. If accentColor is hex:
            newTheme.accents.default.glow = `${accentColor}26`; // 15% opacity approx (0.15 * 255 = 38 -> 0x26)
        }

        return newTheme;
    }, [themeMode, accentColor]);

    const value = {
        theme,
        themeMode,
        accentColor,
        // We could expose setters here if we want instant preview before saving
        setThemeMode,
        setAccentColor
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
