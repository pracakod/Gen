// components/StyleSelector.tsx

import React from 'react';
import { useStyle } from '../contexts/StyleContext';
import { GAME_STYLES, GameStyle } from '../services/gameStyles';

export const StyleSelector: React.FC = () => {
    const { currentStyle, setStyle } = useStyle();

    const styles = Object.values(GAME_STYLES);

    return (
        <div className="flex justify-center gap-2 mb-6">
            {styles.map((style) => (
                <button
                    key={style.id}
                    onClick={() => setStyle(style.id)}
                    className={`
            px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 
            flex items-center gap-2 border-2
            ${currentStyle === style.id
                            ? style.id === 'diablo'
                                ? 'bg-red-900 border-red-500 text-red-100 shadow-lg shadow-red-900/50'
                                : style.id === 'cyberpunk'
                                    ? 'bg-cyan-900 border-cyan-400 text-cyan-100 shadow-lg shadow-cyan-500/50'
                                    : 'bg-emerald-900 border-emerald-400 text-emerald-100 shadow-lg shadow-emerald-500/50'
                            : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        }
          `}
                >
                    <span className="text-lg">{style.icon}</span>
                    <span>{style.name}</span>
                </button>
            ))}
        </div>
    );
};
