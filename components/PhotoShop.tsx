// components/PhotoShop.tsx

import React, { useState } from 'react';
import { IconMaker } from './IconMaker';
import { BackgroundRemover } from './BackgroundRemover';
import { BatchCropper } from './BatchCropper';
import { SpriteGenerator } from './SpriteGenerator';

type PhotoTab = 'icons' | 'remover' | 'cropper' | 'sprites';

export const PhotoShop: React.FC = () => {
    const [activeTab, setActiveTab] = useState<PhotoTab>('icons');

    const tabs = [
        { id: 'icons' as PhotoTab, label: '🎨 Kreator Ikon', desc: 'Twórz ikony z ramkami i tłem', icon: '🎨' },
        { id: 'remover' as PhotoTab, label: '✂️ Usuwanie Tła', desc: 'Wyczyść tło z obrazu', icon: '✂️' },
        { id: 'cropper' as PhotoTab, label: '📦 Skracanie Obrazków', desc: 'Masowe przycinanie i centrowanie', icon: '📦' },
        { id: 'sprites' as PhotoTab, label: '🎮 Arkusze Sprite', desc: 'Generuj arkusze animacji 2D', icon: '🎮' },
    ];

    return (
        <div className="space-y-8 p-4">
            {/* Nav Tabs */}
            <div className="flex flex-wrap justify-center gap-3 p-2 bg-stone-950/50 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                {/* Subtle background glow that follows the hand */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative px-6 py-4 rounded-2xl transition-all duration-500 text-left min-w-[200px] group/tab overflow-hidden
                                ${isActive
                                    ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                                    : 'bg-black/20 border border-transparent hover:border-white/10 hover:bg-white/5'
                                }
                            `}
                        >
                            {/* Particle effect for active tab */}
                            {isActive && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                                    <div className="absolute -inset-1 bg-amber-500/10 blur-xl animate-pulse" />
                                </div>
                            )}

                            <div className="relative z-10 flex items-start gap-4">
                                <div className={`
                                    text-2xl transition-all duration-500 
                                    ${isActive ? 'scale-125 rotate-[15deg] drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'group-hover/tab:scale-110 group-hover/tab:-rotate-12'}
                                `}>
                                    {tab.icon}
                                </div>
                                <div className="space-y-0.5">
                                    <div className={`font-black text-xs uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-amber-200' : 'text-stone-400'}`}>
                                        {tab.label.split(' ').slice(1).join(' ')}
                                    </div>
                                    <div className="text-[9px] font-bold text-stone-600 uppercase tracking-tighter leading-tight">
                                        {tab.desc}
                                    </div>
                                </div>
                            </div>

                            {/* Hover highlight */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/tab:opacity-100 transition-opacity duration-500" />
                        </button>
                    );
                })}
            </div>

            {/* Workplace Content with sophisticated transitions */}
            <div className="relative min-h-[600px]">
                <div className="absolute inset-0 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div key={activeTab} className="animate-slide-up-fade relative z-10">
                    <div className="bg-black/20 backdrop-blur-sm rounded-[2.5rem] border border-white/5 p-6 shadow-2xl">
                        {activeTab === 'icons' && <IconMaker />}
                        {activeTab === 'remover' && <BackgroundRemover />}
                        {activeTab === 'cropper' && <BatchCropper />}
                        {activeTab === 'sprites' && <SpriteGenerator />}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-up-fade {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px) scale(0.98); 
                        filter: blur(10px);
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1);
                        filter: blur(0);
                    }
                }
                .animate-slide-up-fade {
                    animation: slide-up-fade 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
            `}</style>
        </div>
    );
};
