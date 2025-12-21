// contexts/StyleContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameStyle, GAME_STYLES, StyleConfig } from '../services/gameStyles';

interface StyleContextType {
    currentStyle: GameStyle;
    styleConfig: StyleConfig;
    setStyle: (style: GameStyle) => void;
}

const StyleContext = createContext<StyleContextType | undefined>(undefined);

export const StyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentStyle, setCurrentStyle] = useState<GameStyle>('diablo');

    const value = {
        currentStyle,
        styleConfig: GAME_STYLES[currentStyle],
        setStyle: setCurrentStyle
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
