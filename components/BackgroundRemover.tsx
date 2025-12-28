import React, { useState, useRef, useEffect } from 'react';
import { DiabloButton } from './DiabloButton';

type RemoveMode = 'contiguous' | 'global';

const DEFAULTS = {
    tolerance: 30,
    zoom: 1,
    panX: 0,
    panY: 0,
};

export const BackgroundRemover: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [tolerance, setTolerance] = useState(DEFAULTS.tolerance);
    const [mode, setMode] = useState<RemoveMode>('contiguous');
    const [loading, setLoading] = useState(false);
    const [replaceBg, setReplaceBg] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);

    const [viewZoom, setViewZoom] = useState(DEFAULTS.zoom);
    const [viewPanX, setViewPanX] = useState(DEFAULTS.panX);
    const [viewPanY, setViewPanY] = useState(DEFAULTS.panY);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (image && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                const img = new Image();
                img.onload = () => {
                    canvasRef.current!.width = img.width;
                    canvasRef.current!.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    if (history.length === 0) setHistory([image]);
                };
                img.src = image;
            }
        }
    }, [image]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const res = ev.target?.result as string;
                setImage(res);
                setHistory([res]);
                setViewZoom(DEFAULTS.zoom);
                setViewPanX(DEFAULTS.panX);
                setViewPanY(DEFAULTS.panY);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setReplaceBg(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUndo = () => {
        if (history.length > 1) {
            const newHistory = [...history];
            newHistory.pop();
            const prev = newHistory[newHistory.length - 1];
            setHistory(newHistory);
            const img = new Image();
            img.onload = () => {
                if (canvasRef.current) {
                    canvasRef.current.width = img.width;
                    canvasRef.current.height = img.height;
                    const ctx = canvasRef.current.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                }
            };
            img.src = prev;
        }
    };

    const getColorDistance = (data: Uint8ClampedArray, idx: number, tr: number, tg: number, tb: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        return Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);
    };

    const removeColor = (startX: number, startY: number) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { willReadFrequently: true });
        if (!canvas || !ctx) return;

        setLoading(true);

        setTimeout(() => {
            const width = canvas.width;
            const height = canvas.height;
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            const targetIndex = (startY * width + startX) * 4;
            const tr = data[targetIndex];
            const tg = data[targetIndex + 1];
            const tb = data[targetIndex + 2];
            const ta = data[targetIndex + 3];

            if (ta === 0) {
                setLoading(false);
                return;
            }

            const threshold = tolerance * 2.5;

            if (mode === 'global') {
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] === 0) continue;
                    if (getColorDistance(data, i, tr, tg, tb) < threshold) {
                        data[i + 3] = 0;
                    }
                }
            } else {
                const queue: [number, number][] = [[startX, startY]];
                const visited = new Uint8Array(width * height);
                const getVisIdx = (x: number, y: number) => y * width + x;

                while (queue.length > 0) {
                    const [cx, cy] = queue.shift()!;
                    const idx = (cy * width + cx) * 4;

                    if (visited[getVisIdx(cx, cy)]) continue;
                    visited[getVisIdx(cx, cy)] = 1;

                    if (data[idx + 3] !== 0 && getColorDistance(data, idx, tr, tg, tb) < threshold) {
                        data[idx + 3] = 0;
                        if (cx > 0) queue.push([cx - 1, cy]);
                        if (cx < width - 1) queue.push([cx + 1, cy]);
                        if (cy > 0) queue.push([cx, cy - 1]);
                        if (cy < height - 1) queue.push([cx, cy + 1]);
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            setHistory(prev => [...prev, canvas.toDataURL('image/png')]);
            setLoading(false);
        }, 10);
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dx = e.clientX - rect.left;
        const dy = e.clientY - rect.top;
        const x = Math.floor(dx * (canvas.width / rect.width));
        const y = Math.floor(dy * (canvas.height / rect.height));

        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            removeColor(x, y);
        }
    };

    const handleErode = (iterations: number = 1) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        setLoading(true);
        setTimeout(() => {
            const width = canvas.width;
            const height = canvas.height;
            for (let iter = 0; iter < iterations; iter++) {
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                const oldData = new Uint8ClampedArray(data);
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const idx = (y * width + x) * 4;
                        if (oldData[idx + 3] > 0) {
                            let isEdge = false;
                            if (x > 0 && oldData[idx - 4 + 3] === 0) isEdge = true;
                            else if (x < width - 1 && oldData[idx + 4 + 3] === 0) isEdge = true;
                            else if (y > 0 && oldData[idx - width * 4 + 3] === 0) isEdge = true;
                            else if (y < height - 1 && oldData[idx + width * 4 + 3] === 0) isEdge = true;
                            if (isEdge) data[idx + 3] = 0;
                        }
                    }
                }
                ctx.putImageData(imageData, 0, 0);
            }
            setHistory(prev => [...prev, canvas.toDataURL('image/png')]);
            setLoading(false);
        }, 10);
    };

    const handleDilate = (iterations: number = 1) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        setLoading(true);
        setTimeout(() => {
            const width = canvas.width;
            const height = canvas.height;
            for (let iter = 0; iter < iterations; iter++) {
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                const oldData = new Uint8ClampedArray(data);
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const idx = (y * width + x) * 4;
                        if (oldData[idx + 3] === 0) {
                            let hasNeighbor = false;
                            let nr = 0, ng = 0, nb = 0, count = 0;
                            const neighbors = [
                                [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
                            ];
                            for (const [nx, ny] of neighbors) {
                                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                    const nIdx = (ny * width + nx) * 4;
                                    if (oldData[nIdx + 3] > 0) {
                                        hasNeighbor = true;
                                        nr += oldData[nIdx];
                                        ng += oldData[nIdx + 1];
                                        nb += oldData[nIdx + 2];
                                        count++;
                                    }
                                }
                            }
                            if (hasNeighbor && count > 0) {
                                data[idx] = Math.round(nr / count);
                                data[idx + 1] = Math.round(ng / count);
                                data[idx + 2] = Math.round(nb / count);
                                data[idx + 3] = 255;
                            }
                        }
                    }
                }
                ctx.putImageData(imageData, 0, 0);
            }
            setHistory(prev => [...prev, canvas.toDataURL('image/png')]);
            setLoading(false);
        }, 10);
    };

    const downloadResult = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = "no_background.png";
        link.click();
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
                    background: #10b981;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                }
                .mode-button {
                    flex: 1;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    border: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.3);
                    color: #555;
                    transition: all 0.2s;
                }
                .mode-button.active {
                    background: rgba(16, 185, 129, 0.2);
                    border-color: #10b981;
                    color: #fff;
                }
            `}</style>

            {/* Panel Sterowania */}
            <div className="premium-glass p-8 md:p-12 rounded-[3rem] space-y-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.4em]">Magiczna Gumka (Usuwanie Tła)</label>
                    <div className="flex gap-4">
                        <button onClick={handleUndo} disabled={history.length <= 1} className="text-[10px] font-black uppercase text-emerald-500 disabled:opacity-30" data-tooltip="Cofnij ostatnią zmianę">Cofnij</button>
                        <button onClick={() => { setImage(null); setHistory([]); setReplaceBg(null); }} className="text-[10px] font-black uppercase text-red-500" data-tooltip="Zacznij od nowa (czyści historię)">Reset</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/5">
                    <div className="p-6 bg-black/30 rounded-[2rem] border border-white/5 space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Tolerancja</label>
                                <span className="text-xs font-black text-emerald-500">{tolerance}</span>
                            </div>
                            <input type="range" min="1" max="100" value={tolerance} onChange={e => setTolerance(parseInt(e.target.value))} className="premium-slider" data-tooltip="Im wyższa, tym więcej podobnych kolorów zostanie usuniętych" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setMode('contiguous')} className={`mode-button ${mode === 'contiguous' ? 'active' : ''}`} data-tooltip="Usuwa tylko sąsiadujące piksele o podobnym kolorze">Różdżka</button>
                            <button onClick={() => setMode('global')} className={`mode-button ${mode === 'global' ? 'active' : ''}`} data-tooltip="Usuwa dany kolor z całego obrazka">Globalny</button>
                        </div>
                    </div>

                    <div className="p-6 bg-black/30 rounded-[2rem] border border-white/5 space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Dotnij Krawędzie</label>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleErode(3)} className="py-2.5 rounded-xl border border-white/5 bg-black/20 text-[9px] font-black uppercase text-stone-400 hover:text-red-500 transition-all" data-tooltip="Usuwa 3 piksele z krawędzi (agresywne czyszczenie)">-3 px</button>
                            <button onClick={() => handleErode(1)} className="py-2.5 rounded-xl border border-white/5 bg-black/20 text-[9px] font-black uppercase text-stone-400 hover:text-red-500 transition-all" data-tooltip="Usuwa 1 piksel z krawędzi (pozbywa się białych 'obwódek')">-1 px</button>
                            <button onClick={() => handleDilate(1)} className="py-2.5 rounded-xl border border-white/5 bg-black/20 text-[9px] font-black uppercase text-stone-400 hover:text-emerald-500 transition-all" data-tooltip="Dodaje 1 piksel do krawędzi (rozszerza postać)">+1 px</button>
                            <button onClick={() => handleDilate(3)} className="py-2.5 rounded-xl border border-white/5 bg-black/20 text-[9px] font-black uppercase text-stone-400 hover:text-emerald-500 transition-all" data-tooltip="Dodaje 3 piksele do krawędzi (mocne rozszerzenie)">+3 px</button>
                        </div>
                    </div>

                    <div className="p-6 bg-black/30 rounded-[2rem] border border-white/5 space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Podgląd Tła</label>
                        <button onClick={() => bgInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-white/10 text-[9px] font-black uppercase text-stone-500 hover:border-emerald-500/50 transition-all" data-tooltip="Wgraj obrazek, aby zobaczyć jak Twoja postać wygląda na nowym tle">🖼️ Podłóż Obraz</button>
                        <input type="file" ref={bgInputRef} onChange={handleBgUpload} className="hidden" accept="image/*" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {!image ? (
                        <div onClick={() => fileInputRef.current?.click()} className="h-32 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                            <span className="text-3xl mb-1 opacity-40 group-hover:scale-110 transition-transform">✂️</span>
                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Wgraj obraz do wycięcia</span>
                        </div>
                    ) : (
                        <div className="p-6 bg-black/30 rounded-[2.5rem] border border-white/5 flex items-center gap-6">
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between text-[9px] font-black text-stone-600 uppercase"><span>Zoom Widoku</span><span>{(viewZoom * 100).toFixed(0)}%</span></div>
                                <input type="range" min="0.2" max="4" step="0.1" value={viewZoom} onChange={e => setViewZoom(parseFloat(e.target.value))} className="premium-slider" data-tooltip="Zmień zbliżenie podglądu (użyteczne przy precyzyjnym klikaniu)" />
                            </div>
                            <DiabloButton onClick={downloadResult} className="!py-4 px-8 text-xs" data-tooltip="Pobierz gotowy obrazek z przezroczystością">EKSPORTUJ PNG</DiabloButton>
                        </div>
                    )}
                    <div className="flex items-center justify-center bg-black/30 rounded-[2.5rem] border border-white/5 px-8">
                        <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest text-center">🎯 Kliknij w kolor na podglądzie, aby go usunąć</span>
                    </div>
                </div>
            </div>

            {/* Podgląd */}
            <div className="flex flex-col items-center gap-8">
                <div className="relative group w-full max-w-4xl">
                    <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full scale-110 opacity-30"></div>
                    <div className="relative z-10 p-8 bg-[#1a1c26]/60 rounded-[3rem] border border-white/5 backdrop-blur-3xl shadow-2xl flex items-center justify-center min-h-[500px] overflow-hidden">
                        <div
                            className={`relative rounded-2xl overflow-hidden shadow-2xl ${showGrid && !replaceBg ? 'checkerboard-preview' : ''}`}
                            style={{
                                width: '100%',
                                height: '500px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: replaceBg ? `url(${replaceBg}) center/cover` : (showGrid ? '' : '#000')
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                style={{
                                    transform: `scale(${viewZoom})`,
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    cursor: loading ? 'wait' : 'crosshair'
                                }}
                                className="transition-transform duration-200 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                            />
                            {loading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                                    <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
