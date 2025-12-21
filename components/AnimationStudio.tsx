import React, { useCallback, useState } from 'react';
import { Stage, Container, Graphics, Text } from '@pixi/react';
import * as PIXI from 'pixi.js';

// ---- Components for the Canvas ----

interface BoneProps {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    color: number;
    isSelected?: boolean;
}

const Bone = ({ x, y, width, height, rotation, color, isSelected }: BoneProps) => {
    const draw = useCallback(
        (g: PIXI.Graphics) => {
            g.clear();
            g.beginFill(color);
            // Main bone shape
            g.drawRoundedRect(-width / 2, -height / 2, width, height, 5);
            g.endFill();

            // Selection outline
            if (isSelected) {
                g.lineStyle(2, 0xffffff, 0.8);
                g.drawRoundedRect(-width / 2 - 2, -height / 2 - 2, width + 4, height + 4, 6);
            }
        },
        [width, height, color, isSelected]
    );

    return <Graphics draw={draw} x={x} y={y} rotation={rotation} />;
};

// ---- Main Component ----

export const AnimationStudio: React.FC = () => {
    const [selectedPart, setSelectedPart] = useState<string | null>(null);

    // Mock data for a simple "skeleton"
    const [parts, setParts] = useState([
        { id: 'torso', x: 400, y: 300, width: 60, height: 100, rotation: 0, color: 0x8B0000, name: 'Tors' },
        { id: 'head', x: 400, y: 230, width: 50, height: 50, rotation: 0, color: 0xFFD700, name: 'Głowa' },
        { id: 'arm_l', x: 350, y: 300, width: 20, height: 80, rotation: 0.2, color: 0x555555, name: 'Lewa Ręka' },
        { id: 'arm_r', x: 450, y: 300, width: 20, height: 80, rotation: -0.2, color: 0x555555, name: 'Prawa Ręka' },
    ]);

    const updatePart = (id: string, key: string, value: number) => {
        setParts(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
    };

    const activePart = parts.find(p => p.id === selectedPart);

    return (
        <div className="flex flex-col lg:flex-row gap-6 text-stone-200">
            {/* --- Sidebar / Controls --- */}
            <div className="w-full lg:w-1/4 bg-black/60 border border-stone-800 p-4 rounded backdrop-blur-sm">
                <h3 className="font-diablo text-xl text-red-500 mb-4 border-b border-stone-800 pb-2">Przybornik Animatora</h3>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-stone-400 text-sm uppercase tracking-widest">Elementy</h4>
                        <div className="grid grid-cols-1 gap-1">
                            {parts.map(part => (
                                <button
                                    key={part.id}
                                    onClick={() => setSelectedPart(part.id)}
                                    className={`text-left px-3 py-2 text-sm border ${selectedPart === part.id
                                            ? 'border-red-600 bg-red-900/20 text-white'
                                            : 'border-stone-800 hover:border-stone-600 text-stone-400'
                                        } transition-colors rounded`}
                                >
                                    {part.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activePart && (
                        <div className="space-y-3 animate-fade-in p-3 bg-stone-900/50 rounded border border-stone-800/50">
                            <h4 className="text-amber-500 text-xs uppercase font-bold text-center">{activePart.name} - Właściwości</h4>

                            <div>
                                <label className="text-[10px] text-stone-500 uppercase">Obrót (Rotation)</label>
                                <input
                                    type="range"
                                    min="-3.14"
                                    max="3.14"
                                    step="0.01"
                                    value={activePart.rotation}
                                    onChange={(e) => updatePart(activePart.id, 'rotation', parseFloat(e.target.value))}
                                    className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-stone-500 uppercase">X</label>
                                    <input
                                        type="number"
                                        value={activePart.x}
                                        onChange={(e) => updatePart(activePart.id, 'x', Number(e.target.value))}
                                        className="w-full bg-black border border-stone-700 text-xs p-1 text-center"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-stone-500 uppercase">Y</label>
                                    <input
                                        type="number"
                                        value={activePart.y}
                                        onChange={(e) => updatePart(activePart.id, 'y', Number(e.target.value))}
                                        className="w-full bg-black border border-stone-700 text-xs p-1 text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Main Stage --- */}
            <div className="w-full lg:w-3/4 bg-black border border-stone-800 shadow-2xl overflow-hidden relative min-h-[500px] flex items-center justify-center">
                {/* Background Grid Hint */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                <Stage width={800} height={600} options={{ backgroundAlpha: 0, antialias: true }}>
                    <Container>
                        {parts.map(part => (
                            <Bone
                                key={part.id}
                                {...part}
                                isSelected={selectedPart === part.id}
                            />
                        ))}
                    </Container>
                </Stage>

                <div className="absolute bottom-2 right-2 text-stone-600 text-[10px]">
                    PixiJS Render Target
                </div>
            </div>
        </div>
    );
};
