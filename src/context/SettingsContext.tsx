import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SettingsConfig {
    display: {
        compactMode: boolean;
        fontSize: 'small' | 'medium' | 'large';
        tableDensity: 'comfortable' | 'standard' | 'compact';
    };
    session: {
        autoLogout: boolean;
        sessionTimeout: number; // in minutes
    };
    accessibility: {
        highContrast: boolean;
        reducedMotion: boolean;
    };
}

export const defaultSettings: SettingsConfig = {
    display: {
        compactMode: false,
        fontSize: 'medium',
        tableDensity: 'standard',
    },
    session: {
        autoLogout: false,
        sessionTimeout: 30,
    },
    accessibility: {
        highContrast: false,
        reducedMotion: false,
    },
};

interface SettingsContextType {
    settings: SettingsConfig;
    updateSettings: (settings: SettingsConfig) => void;
    updateSetting: <K extends keyof SettingsConfig, T extends keyof SettingsConfig[K]>(
        category: K,
        key: T,
        value: SettingsConfig[K][T]
    ) => void;
    resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('app-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(parsed);
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
    }, []);

    // Apply settings to document
    useEffect(() => {
        const root = document.documentElement;
        
        // Apply font size
        root.classList.remove('font-small', 'font-medium', 'font-large');
        root.classList.add(`font-${settings.display.fontSize}`);
        
        // Apply compact mode
        if (settings.display.compactMode) {
            root.classList.add('compact-mode');
        } else {
            root.classList.remove('compact-mode');
        }
        
        // Apply table density
        root.classList.remove('table-comfortable', 'table-standard', 'table-compact');
        root.classList.add(`table-${settings.display.tableDensity}`);
        
        // Apply high contrast
        if (settings.accessibility.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
        
        // Apply reduced motion
        if (settings.accessibility.reducedMotion) {
            root.classList.add('reduced-motion');
        } else {
            root.classList.remove('reduced-motion');
        }
    }, [settings]);

    // Auto logout timer
    useEffect(() => {
        if (!settings.session.autoLogout) return;

        let timeoutId: NodeJS.Timeout;
        const timeoutDuration = settings.session.sessionTimeout * 60 * 1000; // Convert to milliseconds

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            
            timeoutId = setTimeout(() => {
                // Trigger logout
                localStorage.removeItem('sb-token');
                window.location.href = '/auth/login2';
            }, timeoutDuration);
        };

        // Reset timer on user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, resetTimer);
        });

        // Start initial timer
        resetTimer();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [settings.session.autoLogout, settings.session.sessionTimeout]);

    const updateSettings = (newSettings: SettingsConfig) => {
        setSettings(newSettings);
        localStorage.setItem('app-settings', JSON.stringify(newSettings));
    };

    const updateSetting = <K extends keyof SettingsConfig, T extends keyof SettingsConfig[K]>(
        category: K,
        key: T,
        value: SettingsConfig[K][T]
    ) => {
        const newSettings = {
            ...settings,
            [category]: {
                ...settings[category],
                [key]: value,
            },
        };
        updateSettings(newSettings);
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        localStorage.removeItem('app-settings');
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, updateSetting, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
