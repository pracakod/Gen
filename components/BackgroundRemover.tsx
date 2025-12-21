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

    // Zoom i przesuwanie podglądu
    const [viewZoom, setViewZoom] = useState(DEFAULTS.zoom);
    const [viewPanX, setViewPanX] = useState(DEFAULTS.panX);
    const [viewPanY, setViewPanY] = useState(DEFAULTS.panY);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (image && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
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
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                    ctx.drawImage(img, 0, 0);
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
        const ctx = canvas?.getContext('2d');
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

                const getIdx = (x: number, y: number) => (y * width + x) * 4;
                const getVisIdx = (x: number, y: number) => y * width + x;

                while (queue.length > 0) {
                    const [cx, cy] = queue.shift()!;
                    const idx = getIdx(cx, cy);

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
            const newState = canvas.toDataURL();
            setHistory(prev => [...prev, newState]);
            setLoading(false);
        }, 10);
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / (rect.width / viewZoom);
        const scaleY = canvasRef.current.height / (rect.height / viewZoom);

        // Poprawka na zoom i pan
        const x = Math.floor(((e.clientX - rect.left) / viewZoom - viewPanX) * scaleX / viewZoom);
        const y = Math.floor(((e.clientY - rect.top) / viewZoom - viewPanY) * scaleY / viewZoom);

        if (x >= 0 && x < canvasRef.current.width && y >= 0 && y < canvasRef.current.height) {
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

                            if (isEdge) {
                                data[idx + 3] = 0;
                            }
                        }
                    }
                }
                ctx.putImageData(imageData, 0, 0);
            }

            const newState = canvas.toDataURL();
            setHistory(prev => [...prev, newState]);
            setLoading(false);
        }, 10);
    };

    const handleDilate = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        setLoading(true);
        setTimeout(() => {
            const width = canvas.width;
            const height = canvas.height;
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const oldData = new Uint8ClampedArray(data);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (y * width + x) * 4;
                    if (oldData[idx + 3] === 0) {
                        let hasVisibleNeighbor = false;
                        let avgR = 0, avgG = 0, avgB = 0, count = 0;

                        const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];

                        for (const [dx, dy] of neighbors) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nIdx = (ny * width + nx) * 4;
                                if (oldData[nIdx + 3] > 0) {
                                    hasVisibleNeighbor = true;
                                    avgR += oldData[nIdx];
                                    avgG += oldData[nIdx + 1];
                                    avgB += oldData[nIdx + 2];
                                    count++;
                                }
                            }
                        }

                        if (hasVisibleNeighbor && count > 0) {
                            data[idx] = Math.round(avgR / count);
                            data[idx + 1] = Math.round(avgG / count);
                            data[idx + 2] = Math.round(avgB / count);
                            data[idx + 3] = 255;
                        }
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            const newState = canvas.toDataURL();
            setHistory(prev => [...prev, newState]);
            setLoading(false);
        }, 10);
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
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <label className="font-diablo text-green-500 text-[10px] uppercase">🧹 Usuwanie Tła</label>
                    <div className="flex gap-2">
                        <button
                            onClick={handleUndo}
                            disabled={history.length <= 1}
                            className="bg-black border border-stone-700 text-stone-400 px-3 py-1 text-[10px] uppercase hover:bg-stone-800 disabled:opacity-50"
                        >
                            ↩ Cofnij
                        </button>
                        <button
                            onClick={() => { setImage(null); setHistory([]); setReplaceBg(null); }}
                            className="bg-red-900/20 border border-red-900/50 text-red-500 px-3 py-1 text-[10px] uppercase hover:bg-red-900/40"
                        >
                            🗑 Wyczyść
                        </button>
                    </div>
                </div>

                {!image && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-stone-700 p-12 text-center cursor-pointer hover:border-green-500/50 transition-colors bg-black/50"
                    >
                        <p className="text-stone-500 text-xs font-serif">📷 Kliknij, aby wgrać obraz</p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            className="hidden"
                            ref={fileInputRef}
                        />
                    </div>
                )}

                {image && (
                    <div className="flex flex-col gap-4">
                        {/* Panel narzędzi */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black p-4 border border-stone-800 rounded">
                            {/* Tolerancja */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-stone-400 text-[10px] uppercase">Tolerancja: {tolerance}</span>
                                    <ResetButton onClick={() => setTolerance(DEFAULTS.tolerance)} />
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={tolerance}
                                    onChange={(e) => setTolerance(parseInt(e.target.value))}
                                    className="w-full accent-green-600 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* Tryb */}
                            <div>
                                <span className="text-stone-400 text-[10px] uppercase block mb-1">Tryb usuwania</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setMode('contiguous')}
                                        className={`flex-1 px-2 py-1 text-[10px] uppercase border ${mode === 'contiguous' ? 'border-green-500 text-green-500 bg-green-900/20' : 'border-stone-700 text-stone-500'}`}
                                    >
                                        🪄 Różdżka
                                    </button>
                                    <button
                                        onClick={() => setMode('global')}
                                        className={`flex-1 px-2 py-1 text-[10px] uppercase border ${mode === 'global' ? 'border-blue-500 text-blue-500 bg-blue-900/20' : 'border-stone-700 text-stone-500'}`}
                                    >
                                        🌐 Globalny
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Zoom i przesuwanie */}
                        <div className="grid grid-cols-3 gap-4 bg-black/50 p-3 border border-stone-800 rounded">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-stone-400 text-[9px] uppercase">🔍 Zoom: {(viewZoom * 100).toFixed(0)}%</span>
                                    <ResetButton onClick={() => setViewZoom(DEFAULTS.zoom)} />
                                </div>
                                <input
                                    type="range" min="0.25" max="4" step="0.25"
                                    value={viewZoom} onChange={e => setViewZoom(parseFloat(e.target.value))}
                                    className="w-full accent-green-600 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-stone-400 text-[9px] uppercase">↔ Pozycja X: {viewPanX}px</span>
                                    <ResetButton onClick={() => setViewPanX(DEFAULTS.panX)} />
                                </div>
                                <input
                                    type="range" min="-500" max="500" step="10"
                                    value={viewPanX} onChange={e => setViewPanX(parseInt(e.target.value))}
                                    className="w-full accent-green-600 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-stone-400 text-[9px] uppercase">↕ Pozycja Y: {viewPanY}px</span>
                                    <ResetButton onClick={() => setViewPanY(DEFAULTS.panY)} />
                                </div>
                                <input
                                    type="range" min="-500" max="500" step="10"
                                    value={viewPanY} onChange={e => setViewPanY(parseInt(e.target.value))}
                                    className="w-full accent-green-600 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Narzędzia krawędzi */}
                        <div className="flex flex-wrap gap-2 bg-black/50 p-3 border border-stone-800 rounded">
                            <span className="text-stone-500 text-[10px] uppercase w-full mb-2">Narzędzia krawędzi:</span>
                            <button
                                onClick={() => handleErode(1)}
                                disabled={loading}
                                title="Usuwa 1 piksel z krawędzi widocznego obrazu (gdy usunąłeś za mało)"
                                className="px-3 py-1.5 text-[10px] uppercase border border-stone-700 text-amber-500 hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                            >
                                ➖ Zmniejsz (1px)
                            </button>
                            <button
                                onClick={() => handleErode(3)}
                                disabled={loading}
                                title="Usuwa 3 piksele z krawędzi (agresywniejsze)"
                                className="px-3 py-1.5 text-[10px] uppercase border border-stone-700 text-amber-500 hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                            >
                                ➖ Zmniejsz (3px)
                            </button>
                            <button
                                onClick={handleDilate}
                                disabled={loading}
                                title="Rozszerza widoczne piksele o 1px (gdy usunąłeś za dużo)"
                                className="px-3 py-1.5 text-[10px] uppercase border border-stone-700 text-cyan-500 hover:bg-cyan-900/20 transition-colors disabled:opacity-50"
                            >
                                ➕ Powiększ (1px)
                            </button>
                        </div>

                        {/* Opcje wyświetlania */}
                        <div className="flex items-center gap-4 bg-black/50 p-3 border border-stone-800 rounded">
                            <label className="flex items-center gap-2 text-[10px] text-stone-400 uppercase cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showGrid}
                                    onChange={(e) => setShowGrid(e.target.checked)}
                                    className="accent-green-500"
                                />
                                Siatka przezroczystości
                            </label>
                            <button
                                onClick={() => bgInputRef.current?.click()}
                                className="px-3 py-1 text-[10px] uppercase border border-stone-700 text-stone-400 hover:bg-stone-800"
                            >
                                🖼 Podłóż tło
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBgUpload}
                                className="hidden"
                                ref={bgInputRef}
                            />
                            {replaceBg && (
                                <button
                                    onClick={() => setReplaceBg(null)}
                                    className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300"
                                >
                                    ✕ Usuń podłożone tło
                                </button>
                            )}
                        </div>

                        {/* Canvas */}
                        <div
                            className="relative border border-stone-700 overflow-hidden flex justify-center items-center"
                            style={{
                                background: showGrid && !replaceBg
                                    ? 'repeating-conic-gradient(#333 0% 25%, #222 0% 50%) 50% / 20px 20px'
                                    : replaceBg
                                        ? `url(${replaceBg}) center/cover`
                                        : '#1a1a1a',
                                minHeight: '400px'
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                style={{
                                    transform: `scale(${viewZoom}) translate(${viewPanX}px, ${viewPanY}px)`,
                                    transformOrigin: 'center center',
                                }}
                                className={`max-w-full max-h-[60vh] ${loading ? 'cursor-wait' : 'cursor-crosshair'}`}
                            />
                            {loading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-green-500 font-diablo animate-pulse">Przetwarzanie...</span>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-[10px] text-stone-500 uppercase">
                            🎯 Kliknij na kolor, aby go usunąć ({mode === 'contiguous' ? 'Sąsiadujące piksele' : 'Wszystkie pasujące piksele'})
                        </p>

                        <div className="flex justify-center gap-4">
                            <a
                                href={history[history.length - 1]}
                                download="obraz_bez_tla.png"
                                className="border border-green-900 text-green-500 px-8 py-2 font-diablo text-xs uppercase hover:bg-green-900/20 transition-colors"
                            >
                                📥 Pobierz PNG
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
