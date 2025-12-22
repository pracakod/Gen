// components/StyleSelector.tsx

import React from 'react';
import { useStyle } from '../contexts/StyleContext';
import { GAME_STYLES, GameStyle } from '../services/gameStyles';

export const StyleSelector: React.FC = () => {
    const { currentStyle, setStyle } = useStyle();

    const styles = Object.values(GAME_STYLES);

    return (
        <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-4xl mx-auto">
            {styles.map((style) => (
                <button
                    key={style.id}
                    onClick={() => setStyle(style.id)}
                    className={`
            px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-[10px] md:text-sm transition-all duration-300 
            flex items-center gap-2 border-2
            ${currentStyle === style.id
                            ? `bg-${style.colors.primary}/40 border-${style.colors.accent} text-white shadow-lg`
                            : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 shadow-sm'
                        }
          `}
                >
                    <span className="text-base md:text-lg">{style.icon}</span>
                    <span className="text-[10px] md:text-sm whitespace-nowrap">{style.name}</span>
                </button>
            ))}
        </div>
    );
};
