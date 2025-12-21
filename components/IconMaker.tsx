import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DiabloButton } from './DiabloButton';

type Shape = 'square' | 'rounded-square' | 'circle' | 'arch' | 'diamond';
type Rarity = 'Common' | 'Magic' | 'Rare' | 'Legendary' | 'Unique' | 'Custom';
type Style = 'fantasy' | 'modern';

const RARITY_COLORS: Record<Rarity, string> = {
    Common: '#a8a8a8', // Grey
    Magic: '#6969ff', // Blue
    Rare: '#ffff00', // Yellow
    Legendary: '#ff8000', // Orange
    Unique: '#c7b377', // Gold
    Custom: '#ffffff'
};

const SHAPES: { id: Shape; label: string }[] = [
    { id: 'square', label: '◼ Kwadrat' },
    { id: 'rounded-square', label: '▢ Zaokrąglony' },
    { id: 'circle', label: '● Koło' },
    { id: 'arch', label: '∩ Łuk' },
    { id: 'diamond', label: '◆ Romb' },
];

const PRESET_BACKGROUNDS = [
    { id: 'transparent', label: 'Przezroczyste', color: 'rgba(0,0,0,0)' },
    { id: 'void', label: 'Pustka (Czarny)', color: '#000000' },
    { id: 'white', label: 'Czystość (Biel)', color: '#ffffff' },
    { id: 'grey', label: 'Kamień (Szary)', color: '#4a4a4a' },
    { id: 'blood', label: 'Krew (Ciemna Czerwień)', color: '#1a0505' },
    { id: 'ruby', label: 'Rubin (Czerwień)', color: '#8b0000' },
    { id: 'venom', label: 'Jad (Ciemna Zieleń)', color: '#051a05' },
    { id: 'emerald', label: 'Szmaragd (Zieleń)', color: '#006400' },
    { id: 'parchment', label: 'Pergamin', color: '#1a1810' },
    { id: 'sapphire', label: 'Szafir (Granat)', color: '#00008b' },
    { id: 'amethyst', label: 'Ametyst (Fiolet)', color: '#4b0082' },
];

export const IconMaker: React.FC = () => {
    // State
    const [image, setImage] = useState<string | null>(null);
    const [shape, setShape] = useState<Shape>('square');
    const [style, setStyle] = useState<Style>('fantasy');
    const [rarity, setRarity] = useState<Rarity>('Legendary');

    // Custom Colors
    const [customFrameColor, setCustomFrameColor] = useState('#ffffff');
    const [bgType, setBgType] = useState<string>('void'); // 'custom' or preset id
    const [customBgColor, setCustomBgColor] = useState('#000000');

    // Derived BG Color
    const getBgColor = () => {
        if (bgType === 'custom') return customBgColor;
        const preset = PRESET_BACKGROUNDS.find(p => p.id === bgType);
        return preset ? preset.color : '#000000';
    };

    // Transform State
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImage(ev.target?.result as string);
                // Reset transforms
                setZoom(1);
                setPanX(0);
                setPanY(0);
            };
            reader.readAsDataURL(file);
        }
    };

    const getFrameColor = () => rarity === 'Custom' ? customFrameColor : RARITY_COLORS[rarity];

    const drawPath = (ctx: CanvasRenderingContext2D, s: Shape, x: number, y: number, w: number, h: number) => {
        ctx.beginPath();
        if (s === 'square') {
            ctx.rect(x, y, w, h);
        } else if (s === 'rounded-square') {
            const r = 40; // Corner radius
            ctx.roundRect(x, y, w, h, r);
        } else if (s === 'circle') {
            ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
        } else if (s === 'arch') {
            const r = w / 2;
            ctx.moveTo(x, y + r);
            ctx.arc(x + w / 2, y + r, r, Math.PI, 0);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.closePath();
        } else if (s === 'diamond') {
            ctx.moveTo(x + w / 2, y); // Top
            ctx.lineTo(x + w, y + h / 2); // Right
            ctx.lineTo(x + w / 2, y + h); // Bottom
            ctx.lineTo(x, y + h / 2); // Left
            ctx.closePath();
        }
    };

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const w = canvas.width;
        const h = canvas.height;

        // Clear
        ctx.clearRect(0, 0, w, h);

        const margin = 20;
        const drawAreaW = w - margin * 2;
        const drawAreaH = h - margin * 2;
        const x = margin;
        const y = margin;

        const effectiveBgColor = getBgColor();

        // --- 1. Define Path (Shape) ---
        drawPath(ctx, shape, x, y, drawAreaW, drawAreaH);

        ctx.save(); // Save for clipping

        // --- 2. Fill Background ---
        ctx.clip(); // Clip to shape
        ctx.fillStyle = effectiveBgColor;
        // Handle transparent manually if needed, but fillRect with rgba(0,0,0,0) works (it's a no-op visually on clear canvas)
        if (effectiveBgColor !== 'rgba(0,0,0,0)') {
            ctx.fillRect(0, 0, w, h);
        }

        // --- 3. Draw Image ---
        if (image) {
            const img = new Image();
            img.src = image; // Assuming preloaded/cached by browser since state is same string
            if (img.complete) {
                // Draw center logic
                const scale = Math.max(drawAreaW / img.width, drawAreaH / img.height) * zoom;
                const imgW = img.width * scale;
                const imgH = img.height * scale;
                const centerX = w / 2 - imgW / 2 + panX;
                const centerY = h / 2 - imgH / 2 + panY;

                ctx.drawImage(img, centerX, centerY, imgW, imgH);
            } else {
                // Force redraw when loaded (simple trigger)
                img.onload = () => draw();
            }
        }

        ctx.restore(); // Remove clip

        // --- 4. Draw Frame (Stroke) ---
        ctx.save();
        const frameColor = getFrameColor();
        ctx.strokeStyle = frameColor;

        if (style === 'fantasy') {
            ctx.lineWidth = 10;
            // Redraw path for stroking
            drawPath(ctx, shape, x, y, drawAreaW, drawAreaH);

            // Glow Effect
            ctx.shadowColor = frameColor;
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset glow

            // Inner detail (thin line)
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000'; // Inner contrast
            ctx.stroke();
        } else {
            // Modern Style
            ctx.lineWidth = 4;
            // Clean simple stroke
            drawPath(ctx, shape, x, y, drawAreaW, drawAreaH);
            ctx.stroke();
        }

        ctx.restore();

    }, [image, shape, style, rarity, customFrameColor, bgType, customBgColor, zoom, panX, panY]);

    useEffect(() => {
        draw();
    }, [draw]);

    const downloadIcon = () => {
        if (canvasRef.current) {
            const url = canvasRef.current.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url;
            a.download = `diablo_icon_${shape}.png`;
            a.click();
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in max-w-6xl mx-auto">
            {/* Controls Panel */}
            <div className="flex-1 bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl space-y-6">
                <label className="font-diablo text-amber-600 text-[10px] uppercase mb-4 block border-b border-stone-800 pb-2">Konfiguracja Ikony</label>

                {/* File Upload */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-stone-700 bg-black/40 p-4 text-center cursor-pointer hover:border-amber-700 transition-colors"
                >
                    <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
                    <span className="text-stone-500 text-xs font-serif uppercase">{image ? 'Zmień Obraz' : 'Wgraj Obraz'}</span>
                </div>

                {/* Style Selector */}
                <div>
                    <span className="text-stone-500 text-[9px] uppercase font-serif mb-2 block">Styl Ramki</span>
                    <div className="flex gap-2">
                        <button onClick={() => setStyle('fantasy')} className={`flex-1 p-2 text-[10px] border uppercase ${style === 'fantasy' ? 'border-amber-600 bg-amber-900/20 text-amber-100' : 'border-stone-800 bg-black text-stone-500'}`}>Magiczny</button>
                        <button onClick={() => setStyle('modern')} className={`flex-1 p-2 text-[10px] border uppercase ${style === 'modern' ? 'border-blue-500 bg-blue-900/20 text-blue-100' : 'border-stone-800 bg-black text-stone-500'}`}>Nowoczesny</button>
                    </div>
                </div>

                {/* Shapes */}
                <div>
                    <span className="text-stone-500 text-[9px] uppercase font-serif mb-2 block">Kształt</span>
                    <div className="flex gap-2 flex-wrap">
                        {SHAPES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setShape(s.id)}
                                className={`flex-1 min-w-[60px] p-2 text-[10px] border ${shape === s.id ? 'border-amber-600 bg-amber-900/20 text-amber-100' : 'border-stone-800 bg-black text-stone-500 hover:text-stone-300'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rarity (Frame Color) */}
                <div>
                    <span className="text-stone-500 text-[9px] uppercase font-serif mb-2 block">Kolor Ramki</span>
                    <select
                        value={rarity}
                        onChange={(e) => setRarity(e.target.value as Rarity)}
                        className="w-full bg-black border border-stone-800 p-2 text-stone-300 text-[10px] outline-none mb-2"
                    >
                        <option value="Common">Zwykły (Szary)</option>
                        <option value="Magic">Magiczny (Niebieski)</option>
                        <option value="Rare">Rzadki (Żółty)</option>
                        <option value="Legendary">Legendarny (Pomarańczowy)</option>
                        <option value="Unique">Unikalny (Złoty)</option>
                        <option value="Custom">Własny...</option>
                    </select>
                    {rarity === 'Custom' && (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <input
                                type="color"
                                value={customFrameColor}
                                onChange={e => setCustomFrameColor(e.target.value)}
                                className="h-8 w-full border border-stone-700 cursor-pointer p-0 bg-transparent"
                            />
                        </div>
                    )}
                </div>

                {/* Background */}
                <div>
                    <span className="text-stone-500 text-[9px] uppercase font-serif mb-2 block">Tło</span>
                    <div className="grid grid-cols-6 gap-2 mb-2">
                        {PRESET_BACKGROUNDS.map(bg => (
                            <button
                                key={bg.id}
                                onClick={() => setBgType(bg.id)}
                                className={`h-8 border relative ${bgType === bg.id ? 'border-white' : 'border-stone-800'}`}
                                style={{ background: bg.id === 'transparent' ? 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)' : bg.color }}
                                title={bg.label}
                            >
                                {bgType === bg.id && <div className="absolute inset-0 border-2 border-white/50"></div>}
                            </button>
                        ))}
                        {/* Custom BG Button */}
                        <button
                            onClick={() => setBgType('custom')}
                            className={`h-8 border relative flex items-center justify-center bg-stone-800 ${bgType === 'custom' ? 'border-white' : 'border-stone-800'}`}
                            title="Własny Kolor"
                        >
                            <span className="text-[14px]">🎨</span>
                            {bgType === 'custom' && <div className="absolute inset-0 border-2 border-white/50"></div>}
                        </button>
                    </div>

                    {bgType === 'custom' && (
                        <div className="animate-fade-in">
                            <input
                                type="color"
                                value={customBgColor}
                                onChange={e => setCustomBgColor(e.target.value)}
                                className="h-8 w-full border border-stone-700 cursor-pointer p-0 bg-transparent"
                            />
                        </div>
                    )}
                </div>

                {/* Transforms */}
                <div className="space-y-4 pt-4 border-t border-stone-800">
                    <div>
                        <span className="text-stone-500 text-[9px] uppercase font-serif block mb-1">Skalowanie (Zoom)</span>
                        <input
                            type="range" min="0.1" max="3" step="0.1"
                            value={zoom} onChange={e => setZoom(parseFloat(e.target.value))}
                            className="w-full accent-amber-700 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <span className="text-stone-500 text-[9px] uppercase font-serif block mb-1">Przesunięcie X</span>
                        <input
                            type="range" min="-250" max="250" step="1"
                            value={panX} onChange={e => setPanX(parseFloat(e.target.value))}
                            className="w-full accent-amber-700 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <span className="text-stone-500 text-[9px] uppercase font-serif block mb-1">Przesunięcie Y</span>
                        <input
                            type="range" min="-250" max="250" step="1"
                            value={panY} onChange={e => setPanY(parseFloat(e.target.value))}
                            className="w-full accent-amber-700 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <DiabloButton onClick={downloadIcon} className="w-full">Pobierz Ikonę</DiabloButton>
            </div>

            {/* Preview Canvas */}
            <div className="flex-1 flex items-center justify-center bg-black/20 p-8 border border-stone-900 border-dashed">
                <canvas
                    ref={canvasRef}
                    width={512}
                    height={512}
                    className="max-w-full h-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-stone-900 bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)]"
                />
            </div>
        </div>
    );
};
