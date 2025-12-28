// components/ThemeToggle.tsx

import React from 'react';
import { useStyle } from '../contexts/StyleContext';

export const ThemeToggle: React.FC = () => {
    const { themeMode, toggleTheme } = useStyle();

    return (
        <button
            onClick={toggleTheme}
            className={`
                group relative flex items-center justify-between w-20 h-10 px-1.5 rounded-full transition-all duration-500 border
                ${themeMode === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]'
                    : 'bg-amber-100 border-amber-200 shadow-[inset_0_2px_4px_rgba(251,191,36,0.2)]'}
            `}
            data-tooltip={themeMode === 'dark' ? "Przełącz na tryb jasny (Biały)" : "Przełącz na tryb mroczny (Gothic)"}
        >
            {/* Background Symbols */}
            <div className="absolute inset-0 flex items-center justify-around opacity-20 pointer-events-none">
                <span className="text-[10px] grayscale">🌙</span>
                <span className="text-[10px] grayscale">☀️</span>
            </div>

            {/* Slider / Toggle Knob */}
            <div
                className={`
                    flex items-center justify-center w-7 h-7 rounded-full transition-all duration-500 transform shadow-lg relative z-10
                    ${themeMode === 'dark'
                        ? 'translate-x-0 bg-zinc-800 text-amber-500 shadow-amber-900/40'
                        : 'translate-x-10 bg-white text-orange-500 shadow-orange-200'}
                `}
            >
                <span className={`text-base transition-transform duration-500 ${themeMode === 'dark' ? 'rotate-0' : 'rotate-[360deg]'}`}>
                    {themeMode === 'dark' ? '🌙' : '☀️'}
                </span>

                {/* Glow for active state */}
                <div className={`absolute inset-0 rounded-full blur-md opacity-50 transition-all duration-500 ${themeMode === 'dark' ? 'bg-amber-900/50' : 'bg-orange-300'
                    }`} />
            </div>

            {/* Hidden state labels for accessibility */}
            <span className="sr-only">Tryb {themeMode === 'dark' ? 'ciemny' : 'jasny'}</span>
        </button>
    );
};
