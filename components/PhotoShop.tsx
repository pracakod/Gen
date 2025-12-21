// components/PhotoShop.tsx

import React, { useState } from 'react';
import { IconMaker } from './IconMaker';
import { BackgroundRemover } from './BackgroundRemover';
import { Laboratory } from './Laboratory';
import { ImageEditor } from './ImageEditor';

type PhotoTab = 'icons' | 'remover' | 'lab' | 'editor';

export const PhotoShop: React.FC = () => {
    const [activeTab, setActiveTab] = useState<PhotoTab>('icons');

    const tabs = [
        { id: 'icons' as PhotoTab, label: '🎨 Kreator Ikon', desc: 'Twórz ikony z ramkami i tłem' },
        { id: 'remover' as PhotoTab, label: '✂️ Usuwanie Tła', desc: 'Wyczyść tło z obrazu' },
        { id: 'editor' as PhotoTab, label: '🖌️ Edytor', desc: 'Podstawowa edycja obrazów' },
        { id: 'lab' as PhotoTab, label: '🧪 Laboratorium', desc: 'Łącz warstwy i elementy' },
    ];

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2 bg-black/30 p-3 rounded-lg">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              px-4 py-3 rounded-lg transition-all duration-200 text-left min-w-[160px]
              ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-amber-900/60 to-orange-900/60 border border-amber-500/50 shadow-lg shadow-amber-900/30'
                                : 'bg-black/40 border border-stone-800 hover:border-stone-600'
                            }
            `}
                    >
                        <div className="font-bold text-sm">{tab.label}</div>
                        <div className="text-[10px] text-stone-500 mt-1">{tab.desc}</div>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-black/20 rounded-lg p-4 min-h-[500px]">
                {activeTab === 'icons' && (
                    <div className="animate-fade-in">
                        <IconMaker />
                    </div>
                )}
                {activeTab === 'remover' && (
                    <div className="animate-fade-in">
                        <BackgroundRemover />
                    </div>
                )}
                {activeTab === 'editor' && (
                    <div className="animate-fade-in">
                        <ImageEditor />
                    </div>
                )}
                {activeTab === 'lab' && (
                    <div className="animate-fade-in">
                        <Laboratory />
                    </div>
                )}
            </div>
        </div>
    );
};
