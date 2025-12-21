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

const SHAPES: { id: Shape; label: string }[] = [
    { id: 'square', label: '◼ Kwadrat' },
    { id: 'rounded-square', label: '▢ Zaokrąglony' },
    { id: 'circle', label: '● Koło' },
    { id: 'arch', label: '∩ Łuk' },
    { id: 'diamond', label: '◆ Romb' },
    { id: 'hexagon', label: '⬡ Heksagon' },
    { id: 'octagon', label: '⯃ Oktagon' },
    { id: 'shield', label: '🛡 Tarcza' },
    { id: 'star', label: '★ Gwiazda' },
    { id: 'heart', label: '♥ Serce' },
];

const PRESET_BACKGROUNDS = [
    { id: 'transparent', label: 'Przezroczyste', color: 'rgba(0,0,0,0)' },
    { id: 'void', label: 'Pustka', color: '#000000' },
    { id: 'white', label: 'Biel', color: '#ffffff' },
    { id: 'grey', label: 'Szary', color: '#4a4a4a' },
    { id: 'blood', label: 'Krew', color: '#1a0505' },
    { id: 'ruby', label: 'Rubin', color: '#8b0000' },
    { id: 'venom', label: 'Jad', color: '#051a05' },
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
    { id: 'holy', label: '☀️ Światło', colors: ['#ffffff', '#fffacd', '#ffd700'] },
    { id: 'rainbow', label: '🌈 Tęcza', colors: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'] },
    { id: 'sunset', label: '🌅 Zachód', colors: ['#ff4500', '#ff6347', '#ffa500', '#ffd700'] },
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

    const ResetButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
        <button
            onClick={onClick}
            className="ml-2 px-2 py-0.5 text-[8px] bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded transition-colors"
            title="Resetuj"
        >
            ⟲
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in max-w-6xl mx-auto">
            {/* Panel kontroli */}
            <div className="flex-1 bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl space-y-5 max-h-[80vh] overflow-y-auto">
                <label className="font-diablo text-amber-600 text-[10px] uppercase mb-4 block border-b border-stone-800 pb-2">
                    🎨 Konfiguracja Ikony
                </label>

                {/* Wgrywanie */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-stone-700 bg-black/40 p-3 text-center cursor-pointer hover:border-amber-700 transition-colors"
                >
                    <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                    <span className="text-stone-500 text-xs font-serif uppercase">
                        {image ? '🔄 Zmień Obraz' : '📷 Wgraj Obraz'}
                    </span>
                </div>

                {/* Styl ramki */}
                <div>
                    <span className="text-stone-500 text-[9px] uppercase font-serif mb-2 block">Styl Ramki</span>
                    <div className="flex gap-2">
                        <button onClick={() => setStyle('fantasy')} className={`flex-1 p-2 text-[10px] border uppercase ${style === 'fantasy' ? 'border-amber-600 bg-amber-900/20 text-amber-100' : 'border-stone-800 bg-black text-stone-500'}`}>
                            ✨ Magiczny
                        </button>
                        <button onClick={() => setStyle('modern')} className={`flex-1 p-2 text-[10px] border uppercase ${style === 'modern' ? 'border-blue-500 bg-blue-900/20 text-blue-100' : 'border-stone-800 bg-black text-stone-500'}`}>
                            ▫ Nowoczesny
                        </button>
                    </div>
                </div>

                {/* Kształty */}
                <div>
                    <span className="text-stone-500 text-[9px] uppercase font-serif mb-2 block">Kształt</span>
                    <div className="grid grid-cols-5 gap-1">
                        {SHAPES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setShape(s.id)}
                                className={`p-2 text-[9px] border ${shape === s.id ? 'border-amber-600 bg-amber-900/20 text-amber-100' : 'border-stone-800 bg-black text-stone-500 hover:text-stone-300'}`}
                                title={s.label}
                            >
                                {s.label.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kolor ramki */}
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
                        <option value="Custom">Własny kolor...</option>
                    </select>
                    {rarity === 'Custom' && (
                        <input
                            type="color"
                            value={customFrameColor}
                            onChange={e => setCustomFrameColor(e.target.value)}
                            className="h-8 w-full border border-stone-700 cursor-pointer p-0 bg-transparent"
                        />
                    )}
                </div>

                {/* Grubość obrysu */}
                <div>
                    <div className="flex items-center justify-between">
                        <span className="text-stone-500 text-[9px] uppercase font-serif">Grubość Obrysu: {borderWidth}px</span>
                        <ResetButton onClick={() => setBorderWidth(DEFAULTS.borderWidth)} />
                    </div>
                    <input
                        type="range" min="1" max="30" step="1"
                        value={borderWidth} onChange={e => setBorderWidth(parseInt(e.target.value))}
                        className="w-full accent-amber-700 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer mt-1"
                    />
                </div>

                {/* TŁO */}
                <div className="border-t border-stone-800 pt-4">
                    <span className="text-stone-500 text-[9px] uppercase font-serif mb-2 block">Tryb Tła</span>
                    <div className="grid grid-cols-4 gap-1 mb-3">
                        <button onClick={() => setBgMode('solid')} className={`p-2 text-[9px] border ${bgMode === 'solid' ? 'border-amber-600 bg-amber-900/20 text-amber-100' : 'border-stone-800 bg-black text-stone-500'}`}>
                            Kolor
                        </button>
                        <button onClick={() => setBgMode('gradient')} className={`p-2 text-[9px] border ${bgMode === 'gradient' ? 'border-amber-600 bg-amber-900/20 text-amber-100' : 'border-stone-800 bg-black text-stone-500'}`}>
                            Gradient
                        </button>
                        <button onClick={() => setBgMode('radial')} className={`p-2 text-[9px] border ${bgMode === 'radial' ? 'border-amber-600 bg-amber-900/20 text-amber-100' : 'border-stone-800 bg-black text-stone-500'}`}>
                            Radialny
                        </button>
                        <button onClick={() => setBgMode('custom')} className={`p-2 text-[9px] border ${bgMode === 'custom' ? 'border-amber-600 bg-amber-900/20 text-amber-100' : 'border-stone-800 bg-black text-stone-500'}`}>
                            Własny
                        </button>
                    </div>

                    {bgMode === 'solid' && (
                        <div className="grid grid-cols-6 gap-1">
                            {PRESET_BACKGROUNDS.map(bg => (
                                <button
                                    key={bg.id}
                                    onClick={() => setBgSolid(bg.id)}
                                    className={`h-8 border relative ${bgSolid === bg.id ? 'border-white ring-2 ring-white/30' : 'border-stone-800'}`}
                                    style={{ background: bg.id === 'transparent' ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 10px 10px' : bg.color }}
                                    title={bg.label}
                                />
                            ))}
                            <button
                                onClick={() => setBgSolid('custom')}
                                className={`h-8 border flex items-center justify-center ${bgSolid === 'custom' ? 'border-white' : 'border-stone-800'}`}
                                style={{ background: customBgColor }}
                                title="Własny"
                            >
                                🎨
                            </button>
                        </div>
                    )}

                    {bgMode === 'solid' && bgSolid === 'custom' && (
                        <input
                            type="color"
                            value={customBgColor}
                            onChange={e => setCustomBgColor(e.target.value)}
                            className="h-8 w-full border border-stone-700 cursor-pointer p-0 bg-transparent mt-2"
                        />
                    )}

                    {(bgMode === 'gradient' || bgMode === 'radial') && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-5 gap-1">
                                {GRADIENT_PRESETS.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setGradientPreset(g.id)}
                                        className={`h-8 border text-[8px] ${gradientPreset === g.id ? 'border-white ring-2 ring-white/30' : 'border-stone-800'}`}
                                        style={{ background: `linear-gradient(90deg, ${g.colors.join(', ')})` }}
                                        title={g.label}
                                    />
                                ))}
                            </div>
                            {bgMode === 'gradient' && (
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-stone-500 text-[9px]">Kąt: {gradientAngle}°</span>
                                        <ResetButton onClick={() => setGradientAngle(DEFAULTS.gradientAngle)} />
                                    </div>
                                    <input
                                        type="range" min="0" max="360" step="15"
                                        value={gradientAngle} onChange={e => setGradientAngle(parseInt(e.target.value))}
                                        className="w-full accent-amber-700 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {bgMode === 'custom' && (
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <span className="text-stone-500 text-[8px] block mb-1">Kolor 1</span>
                                <input
                                    type="color"
                                    value={customGradientColor1}
                                    onChange={e => setCustomGradientColor1(e.target.value)}
                                    className="h-8 w-full border border-stone-700 cursor-pointer p-0 bg-transparent"
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-stone-500 text-[8px] block mb-1">Kolor 2</span>
                                <input
                                    type="color"
                                    value={customGradientColor2}
                                    onChange={e => setCustomGradientColor2(e.target.value)}
                                    className="h-8 w-full border border-stone-700 cursor-pointer p-0 bg-transparent"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Transformacje */}
                <div className="space-y-3 pt-4 border-t border-stone-800">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-stone-500 text-[9px] uppercase font-serif">Skalowanie: {zoom.toFixed(1)}x</span>
                            <ResetButton onClick={() => setZoom(DEFAULTS.zoom)} />
                        </div>
                        <input
                            type="range" min="0.1" max="3" step="0.1"
                            value={zoom} onChange={e => setZoom(parseFloat(e.target.value))}
                            className="w-full accent-amber-700 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer mt-1"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-stone-500 text-[9px] uppercase font-serif">Pozycja X: {panX}px</span>
                            <ResetButton onClick={() => setPanX(DEFAULTS.panX)} />
                        </div>
                        <input
                            type="range" min="-250" max="250" step="1"
                            value={panX} onChange={e => setPanX(parseFloat(e.target.value))}
                            className="w-full accent-amber-700 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer mt-1"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-stone-500 text-[9px] uppercase font-serif">Pozycja Y: {panY}px</span>
                            <ResetButton onClick={() => setPanY(DEFAULTS.panY)} />
                        </div>
                        <input
                            type="range" min="-250" max="250" step="1"
                            value={panY} onChange={e => setPanY(parseFloat(e.target.value))}
                            className="w-full accent-amber-700 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer mt-1"
                        />
                    </div>
                </div>

                <DiabloButton onClick={downloadIcon} className="w-full">📥 Pobierz Ikonę</DiabloButton>
            </div>

            {/* Podgląd */}
            <div className="flex-1 flex items-center justify-center bg-black/20 p-8 border border-stone-900 border-dashed">
                <canvas
                    ref={canvasRef}
                    width={512}
                    height={512}
                    className="max-w-full h-auto shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-stone-900 bg-[repeating-conic-gradient(#333_0%_25%,#222_0%_50%)_50%/20px_20px]"
                />
            </div>
        </div>
    );
};
