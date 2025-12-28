// components/StyleSelector.tsx

import React from 'react';
import { useStyle } from '../contexts/StyleContext';
import { GAME_STYLES, getStyleColors } from '../services/gameStyles';

export const StyleSelector: React.FC = () => {
    const { currentStyle, setStyle } = useStyle();

    const styles = Object.values(GAME_STYLES);

    return (
        <div className="flex flex-wrap justify-center gap-1.5 px-1">
            {styles.map((style) => (
                <button
                    key={style.id}
                    onClick={() => setStyle(style.id)}
                    className={`
                        relative px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] transition-all duration-300 
                        flex items-center gap-2 border overflow-hidden group min-w-[100px] justify-center
                        ${currentStyle === style.id
                            ? `bg-white/5 border-white/20 text-white shadow-xl`
                            : 'bg-transparent border-transparent text-stone-600 hover:text-stone-400'
                        }
                    `}
                >
                    {currentStyle === style.id && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${getStyleColors(style.id).gradient} opacity-5`} />
                    )}
                    <span className="relative z-10 whitespace-nowrap">{style.name}</span>
                    {/* Wskaźnik zawsze obecny, aby zapobiec skakaniu layoutu */}
                    <div className={`w-1 h-1 rounded-full transition-all duration-500 ${currentStyle === style.id
                        ? `bg-emerald-500 shadow-[0_0_8px_#10b981] scale-100 opacity-100`
                        : 'bg-stone-800 scale-0 opacity-0'
                        }`} />
                </button>
            ))}
        </div>
    );
};
