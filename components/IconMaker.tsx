import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiabloButton } from './DiabloButton';

type Shape = 'square' | 'rounded-square' | 'circle' | 'arch' | 'diamond' | 'hexagon' | 'octagon' | 'shield' | 'star' | 'heart';
type Rarity = 'Common' | 'Magic' | 'Rare' | 'Legendary' | 'Unique' | 'Custom';
type Style = 'fantasy' | 'modern';
type BgMode = 'solid' | 'gradient' | 'radial' | 'custom';

const RARITY_COLORS: Record<Rarity, string> = {
    Common: '#a8a8a8',
    Magic: '#6969ff',
    Rare: '#ffff00',
    Legendary: '#ff8000',
    Unique: '#c7b377',
    Custom: '#ffffff'
};

const SHAPES: { id: Shape; label: string; icon: string }[] = [
    { id: 'square', label: '◼ Kwadrat', icon: 'M 10 10 H 90 V 90 H 10 Z' },
    { id: 'rounded-square', label: '▢ Zaokrąglony', icon: 'M 30 10 H 70 A 20 20 0 0 1 90 30 V 70 A 20 20 0 0 1 70 90 H 30 A 20 20 0 0 1 10 70 V 30 A 20 20 0 0 1 30 10' },
    { id: 'circle', label: '● Koło', icon: 'M 50 10 A 40 40 0 1 1 50 90 A 40 40 0 1 1 50 10' },
    { id: 'arch', label: '∩ Łuk', icon: 'M 10 90 V 40 A 40 40 0 0 1 90 40 V 90 Z' },
    { id: 'diamond', label: '◆ Romb', icon: 'M 50 10 L 90 50 L 50 90 L 10 50 Z' },
    { id: 'hexagon', label: '⬡ Heksagon', icon: 'M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 30 Z' },
    { id: 'octagon', label: '⯃ Oktagon', icon: 'M 35 10 H 65 L 90 35 V 65 L 65 90 H 35 L 10 65 V 35 Z' },
    { id: 'shield', label: '🛡 Tarcza', icon: 'M 10 10 H 90 V 60 Q 50 100 10 60 Z' },
    { id: 'star', label: '★ Gwiazda', icon: 'M 50 10 L 61 35 H 88 L 66 52 L 75 78 L 50 62 L 25 78 L 34 52 L 12 35 H 39 Z' },
    { id: 'heart', label: '♥ Serce', icon: 'M 50 90 C 50 90 10 70 10 40 C 10 15 45 15 50 35 C 55 15 90 15 90 40 C 90 70 50 90 50 90' },
];

const PRESET_BACKGROUNDS = [
    { id: 'transparent', label: 'Przezroczyste', color: 'rgba(0,0,0,0)' },
    { id: 'void', label: 'Pustka', color: '#000000' },
    { id: 'white', label: 'Biel', color: '#ffffff' },
    { id: 'grey', label: 'Szary', color: '#4a4a4a' },
    { id: 'blood', label: 'Krew', color: '#1a0505' },
    { id: 'ruby', label: 'Rubin', color: '#8b0000' },
    { id: 'emerald', label: 'Szmaragd', color: '#006400' },
    { id: 'sapphire', label: 'Szafir', color: '#00008b' },
    { id: 'amethyst', label: 'Ametyst', color: '#4b0082' },
];

const GRADIENT_PRESETS = [
    { id: 'fire', label: '🔥 Ogień', colors: ['#ff0000', '#ff8000', '#ffff00'] },
    { id: 'ice', label: '❄️ Lód', colors: ['#00ffff', '#0080ff', '#0000ff'] },
    { id: 'poison', label: '☠️ Trucizna', colors: ['#00ff00', '#008000', '#004000'] },
    { id: 'shadow', label: '🌑 Cień', colors: ['#000000', '#2a2a2a', '#4a4a4a'] },
    { id: 'gold', label: '✨ Złoto', colors: ['#ffd700', '#ff8c00', '#b8860b'] },
    { id: 'arcane', label: '💜 Arkana', colors: ['#ff00ff', '#8000ff', '#4000ff'] },
    { id: 'blood', label: '🩸 Krew', colors: ['#8b0000', '#4a0000', '#1a0000'] },
];

const DEFAULTS = {
    zoom: 1,
    panX: 0,
    panY: 0,
    borderWidth: 10,
    gradientAngle: 180,
};

export const IconMaker: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [shape, setShape] = useState<Shape>('square');
    const [style, setStyle] = useState<Style>('fantasy');
    const [rarity, setRarity] = useState<Rarity>('Legendary');
    const [customFrameColor, setCustomFrameColor] = useState('#ffffff');

    // Tło
    const [bgMode, setBgMode] = useState<BgMode>('solid');
    const [bgSolid, setBgSolid] = useState<string>('void');
    const [customBgColor, setCustomBgColor] = useState('#000000');
    const [gradientPreset, setGradientPreset] = useState('fire');
    const [gradientAngle, setGradientAngle] = useState(DEFAULTS.gradientAngle);
    const [customGradientColor1, setCustomGradientColor1] = useState('#ff0000');
    const [customGradientColor2, setCustomGradientColor2] = useState('#0000ff');

    // Transformacje
    const [zoom, setZoom] = useState(DEFAULTS.zoom);
    const [panX, setPanX] = useState(DEFAULTS.panX);
    const [panY, setPanY] = useState(DEFAULTS.panY);
    const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImage(ev.target?.result as string);
                setZoom(DEFAULTS.zoom);
                setPanX(DEFAULTS.panX);
                setPanY(DEFAULTS.panY);
            };
            reader.readAsDataURL(file);
        }
    };

    const getFrameColor = () => rarity === 'Custom' ? customFrameColor : RARITY_COLORS[rarity];

    const drawPath = (ctx: CanvasRenderingContext2D, s: Shape, x: number, y: number, w: number, h: number) => {
        ctx.beginPath();
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2;

        switch (s) {
            case 'square':
                ctx.rect(x, y, w, h);
                break;
            case 'rounded-square':
                ctx.roundRect(x, y, w, h, 40);
                break;
            case 'circle':
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                break;
            case 'arch':
                ctx.moveTo(x, y + r);
                ctx.arc(cx, y + r, r, Math.PI, 0);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                break;
            case 'diamond':
                ctx.moveTo(cx, y);
                ctx.lineTo(x + w, cy);
                ctx.lineTo(cx, y + h);
                ctx.lineTo(x, cy);
                ctx.closePath();
                break;
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 2;
                    const px = cx + r * Math.cos(angle);
                    const py = cy + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case 'octagon':
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI / 4) * i - Math.PI / 8;
                    const px = cx + r * Math.cos(angle);
                    const py = cy + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case 'shield':
                ctx.moveTo(x, y);
                ctx.lineTo(x + w, y);
                ctx.lineTo(x + w, y + h * 0.6);
                ctx.quadraticCurveTo(cx, y + h * 1.2, x, y + h * 0.6);
                ctx.closePath();
                break;
            case 'star':
                const spikes = 5;
                const outerRadius = r;
                const innerRadius = r * 0.5;
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI / spikes) * i - Math.PI / 2;
                    const px = cx + radius * Math.cos(angle);
                    const py = cy + radius * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                break;
            case 'heart':
                ctx.moveTo(cx, y + h * 0.3);
                ctx.bezierCurveTo(cx, y, x, y, x, y + h * 0.35);
                ctx.bezierCurveTo(x, y + h * 0.65, cx, y + h * 0.85, cx, y + h);
                ctx.bezierCurveTo(cx, y + h * 0.85, x + w, y + h * 0.65, x + w, y + h * 0.35);
                ctx.bezierCurveTo(x + w, y, cx, y, cx, y + h * 0.3);
                ctx.closePath();
                break;
        }
    };

    const createBackground = (ctx: CanvasRenderingContext2D, w: number, h: number): string | CanvasGradient => {
        if (bgMode === 'solid') {
            if (bgSolid === 'custom') return customBgColor;
            const preset = PRESET_BACKGROUNDS.find(p => p.id === bgSolid);
            return preset ? preset.color : '#000000';
        } else if (bgMode === 'gradient' || bgMode === 'radial') {
            const gradientData = GRADIENT_PRESETS.find(g => g.id === gradientPreset);
            const colors = gradientData?.colors || [customGradientColor1, customGradientColor2];

            let gradient: CanvasGradient;
            if (bgMode === 'radial') {
                gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
            } else {
                const angleRad = (gradientAngle * Math.PI) / 180;
                const x1 = w / 2 - Math.cos(angleRad) * w / 2;
                const y1 = h / 2 - Math.sin(angleRad) * h / 2;
                const x2 = w / 2 + Math.cos(angleRad) * w / 2;
                const y2 = h / 2 + Math.sin(angleRad) * h / 2;
                gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            }

            colors.forEach((color, i) => {
                gradient.addColorStop(i / (colors.length - 1), color);
            });

            return gradient;
        } else if (bgMode === 'custom') {
            const gradient = ctx.createLinearGradient(0, 0, w, h);
            gradient.addColorStop(0, customGradientColor1);
            gradient.addColorStop(1, customGradientColor2);
            return gradient;
        }
        return '#000000';
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const margin = 20;
        const drawAreaW = w - margin * 2;
        const drawAreaH = h - margin * 2;
        const x = margin;
        const y = margin;

        drawPath(ctx, shape, x, y, drawAreaW, drawAreaH);
        ctx.save();
        ctx.clip();

        const bgFill = createBackground(ctx, w, h);
        if (bgFill !== 'rgba(0,0,0,0)') {
            ctx.fillStyle = bgFill;
            ctx.fillRect(0, 0, w, h);
        }

        if (image) {
            const img = new Image();
            img.src = image;
            if (img.complete) {
                const scale = Math.max(drawAreaW / img.width, drawAreaH / img.height) * zoom;
                const imgW = img.width * scale;
                const imgH = img.height * scale;
                const centerX = w / 2 - imgW / 2 + panX;
                const centerY = h / 2 - imgH / 2 + panY;
                ctx.drawImage(img, centerX, centerY, imgW, imgH);
            } else {
                img.onload = () => draw();
            }
        }

        ctx.restore();

        // Ramka
        ctx.save();
        const frameColor = getFrameColor();
        ctx.strokeStyle = frameColor;

        if (style === 'fantasy') {
            ctx.lineWidth = borderWidth;
            drawPath(ctx, shape, x, y, drawAreaW, drawAreaH);
            ctx.shadowColor = frameColor;
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000';
            ctx.stroke();
        } else {
            ctx.lineWidth = borderWidth;
            drawPath(ctx, shape, x, y, drawAreaW, drawAreaH);
            ctx.stroke();
        }

        ctx.restore();
    }, [image, shape, style, rarity, customFrameColor, bgMode, bgSolid, customBgColor, gradientPreset, gradientAngle, customGradientColor1, customGradientColor2, zoom, panX, panY, borderWidth]);

    useEffect(() => {
        draw();
    }, [draw]);

    const downloadIcon = () => {
        if (canvasRef.current) {
            const url = canvasRef.current.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `ikona_${shape}.png`;
            a.click();
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in p-4 text-stone-300">
            <style>{`
                .premium-glass {
                    background: rgba(26, 28, 38, 0.45) !important;
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .shape-button {
                    aspect-ratio: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.3);
                    color: #555;
                    transition: all 0.2s;
                }
                .shape-button.active {
                    background: rgba(124, 77, 255, 0.2);
                    border-color: #7c4dff;
                    color: #fff;
                    box-shadow: 0 0 15px rgba(124, 77, 255, 0.2);
                }
                .checkerboard-preview {
                    background-image: linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 25%);
                    background-size: 20px 20px;
                }
                .premium-slider {
                    -webkit-appearance: none;
                    background: rgba(255,255,255,0.05);
                    height: 4px;
                    border-radius: 2px;
                    width: 100%;
                }
                .premium-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #7c4dff;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(124, 77, 255, 0.5);
                }
            `}</style>

            {/* Panel Sterowania */}
            <div className="premium-glass p-8 md:p-12 rounded-[3rem] space-y-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.4em]">Kreator Obramowań Ikon</label>
                    <div className="flex gap-4">
                        <button onClick={() => setStyle('fantasy')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${style === 'fantasy' ? 'border-amber-600/50 bg-amber-900/20 text-amber-500' : 'border-white/5 bg-black/40 text-stone-600'}`}>✨ FANTASY</button>
                        <button onClick={() => setStyle('modern')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${style === 'modern' ? 'border-blue-500/50 bg-blue-900/20 text-blue-500' : 'border-white/5 bg-black/40 text-stone-600'}`}>▫ MODERN</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/5">
                    {/* Kształt */}
                    <div className="p-6 bg-black/30 rounded-[2rem] border border-white/5 space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Matryca Kształtu</label>
                        <div className="grid grid-cols-5 gap-2">
                            {SHAPES.map(s => (
                                <button key={s.id} onClick={() => setShape(s.id)} className={`shape-button ${shape === s.id ? 'active' : ''}`}>
                                    <svg viewBox="0 0 100 100" className="w-5 h-5 fill-current"><path d={s.icon} /></svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rzadkość */}
                    <div className="p-6 bg-black/30 rounded-[2rem] border border-white/5 space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Rzadkość & Grubość</label>
                        <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)} className="w-full bg-black/40 border border-white/5 text-stone-300 text-[10px] font-black p-3 rounded-xl outline-none">
                            {Object.keys(RARITY_COLORS).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <input type="range" min="1" max="40" value={borderWidth} onChange={e => setBorderWidth(parseInt(e.target.value))} className="premium-slider" />
                    </div>

                    {/* Tło */}
                    <div className="p-6 bg-black/30 rounded-[2rem] border border-white/5 space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Styl Tła</label>
                        <div className="flex gap-2 mb-2">
                            {['solid', 'gradient', 'radial'].map(mode => (
                                <button key={mode} onClick={() => setBgMode(mode as any)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${bgMode === mode ? 'border-[#7c4dff] bg-[#7c4dff]/10 text-white' : 'border-white/5 text-stone-600'}`}>
                                    {mode}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {bgMode === 'solid' ? PRESET_BACKGROUNDS.map(bg => (
                                <button key={bg.id} onClick={() => setBgSolid(bg.id)} className={`h-6 rounded-lg border transition-all ${bgSolid === bg.id ? 'border-white' : 'border-white/5'}`} style={{ background: bg.color }} />
                            )) : GRADIENT_PRESETS.map(g => (
                                <button key={g.id} onClick={() => setGradientPreset(g.id)} className={`h-6 rounded-lg border transition-all ${gradientPreset === g.id ? 'border-white' : 'border-white/5'}`} style={{ background: `linear-gradient(90deg, ${g.colors.join(', ')})` }} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Transformacje i Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-black/30 rounded-[2.5rem] border border-white/5 space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Pozycjonowanie Obrazu</label>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[9px] font-black text-stone-600 uppercase"><span>Zoom</span><span>{zoom.toFixed(2)}x</span></div>
                            <input type="range" min="0.1" max="4" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="premium-slider" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-stone-600 uppercase">Oś X</span>
                                    <input type="range" min="-300" max="300" value={panX} onChange={e => setPanX(parseFloat(e.target.value))} className="premium-slider" />
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-stone-600 uppercase">Oś Y</span>
                                    <input type="range" min="-300" max="300" value={panY} onChange={e => setPanY(parseFloat(e.target.value))} className="premium-slider" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div onClick={() => fileInputRef.current?.click()} className="flex-1 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-[#7c4dff]/30 hover:bg-[#7c4dff]/5 transition-all group">
                            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                            <span className="text-3xl mb-2 opacity-40 group-hover:scale-110 transition-transform">🖼️</span>
                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">WGRAJ OBRAZ</span>
                        </div>
                        <DiabloButton onClick={downloadIcon} className="w-full !py-6 text-sm">📥 EKSPORTUJ IKONĘ</DiabloButton>
                    </div>
                </div>
            </div>

            {/* Podgląd */}
            <div className="flex flex-col items-center gap-8">
                <div className="relative group">
                    <div className="absolute inset-0 bg-[#7c4dff]/5 blur-[120px] rounded-full scale-150 opacity-50"></div>
                    <div className="relative z-10 p-12 bg-[#1a1c26]/60 rounded-[4rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
                        <div className="checkerboard-preview p-2 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl bg-black">
                            <canvas ref={canvasRef} width={512} height={512} className="max-w-full h-auto drop-shadow-[0_20px_80px_rgba(0,0,0,0.9)]" />
                        </div>
                    </div>
                </div>
                <div className="text-[11px] font-black text-stone-700 uppercase tracking-[0.5em] flex items-center gap-6">
                    <div className="w-16 h-[1px] bg-stone-900"></div>
                    FINAL PREVIEW 512x512
                    <div className="w-16 h-[1px] bg-stone-900"></div>
                </div>
            </div>
        </div>
    );
};
