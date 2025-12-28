// contexts/StyleContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { GameStyle, GAME_STYLES, StyleConfig } from '../services/gameStyles';

export type ThemeMode = 'dark' | 'light';

interface StyleContextType {
    currentStyle: GameStyle;
    styleConfig: StyleConfig;
    themeMode: ThemeMode;
    setStyle: (style: GameStyle) => void;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const StyleContext = createContext<StyleContextType | undefined>(undefined);

export const StyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentStyle, setCurrentStyle] = useState<GameStyle>(() => {
        return (localStorage.getItem('forge-style') as GameStyle) || 'diablo';
    });
    const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
        return (localStorage.getItem('forge-theme') as ThemeMode) || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('forge-style', currentStyle);
    }, [currentStyle]);

    useEffect(() => {
        localStorage.setItem('forge-theme', themeMode);
        if (themeMode === 'light') {
            document.documentElement.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
        }
    }, [themeMode]);

    const toggleTheme = () => {
        setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const value = {
        currentStyle,
        styleConfig: GAME_STYLES[currentStyle],
        themeMode,
        setStyle: setCurrentStyle,
        setThemeMode,
        toggleTheme
    };

    return (
        <StyleContext.Provider value={value}>
            {children}
        </StyleContext.Provider>
    );
};

export const useStyle = (): StyleContextType => {
    const context = useContext(StyleContext);
    if (!context) {
        throw new Error('useStyle must be used within a StyleProvider');
    }
    return context;
};
