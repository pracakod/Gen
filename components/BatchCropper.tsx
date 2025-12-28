import React, { useState, useRef } from 'react';
import JSZip from 'jszip';

interface ProcessedFile {
    blob: Blob;
    name: string;
    dataUrl: string;
    debugUrl: string;
    oldW: number;
    oldH: number;
    newW: number;
    newH: number;
}

export const BatchCropper: React.FC = () => {
    const [threshold, setThreshold] = useState(30);
    const [padding, setPadding] = useState(0);
    const [useFixedCanvas, setUseFixedCanvas] = useState(false);
    const [canvasPreset, setCanvasPreset] = useState('256');
    const [customCanvasSize, setCustomCanvasSize] = useState(256);
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [showDebug, setShowDebug] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: File[]) => {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        imageFiles.forEach(processImage);
    };

    const processImage = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const targetSize = canvasPreset === 'custom' ? customCanvasSize : parseInt(canvasPreset);
                const originalCanvas = document.createElement('canvas');
                originalCanvas.width = img.width;
                originalCanvas.height = img.height;
                const ctx = originalCanvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) return;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;
                let minX = img.width, minY = img.height, maxX = 0, maxY = 0, found = false;

                for (let y = 0; y < img.height; y++) {
                    for (let x = 0; x < img.width; x++) {
                        const alpha = data[(y * img.width + x) * 4 + 3];
                        if (alpha >= threshold && alpha > 0) {
                            if (x < minX) minX = x; if (x > maxX) maxX = x;
                            if (y < minY) minY = y; if (y > maxY) maxY = y;
                            found = true;
                        }
                    }
                }

                if (!found) return;

                const cropX1 = Math.max(0, minX - padding);
                const cropY1 = Math.max(0, minY - padding);
                const cropX2 = Math.min(img.width - 1, maxX + padding);
                const cropY2 = Math.min(img.height - 1, maxY + padding);

                const cropWidth = cropX2 - cropX1 + 1;
                const cropHeight = cropY2 - cropY1 + 1;

                // Debug Canvas (Original with Red Box)
                const debugCanvas = document.createElement('canvas');
                debugCanvas.width = img.width;
                debugCanvas.height = img.height;
                const dCtx = debugCanvas.getContext('2d');
                if (dCtx) {
                    dCtx.drawImage(img, 0, 0);
                    dCtx.strokeStyle = '#ff0000';
                    dCtx.lineWidth = Math.max(2, img.width / 100);
                    dCtx.strokeRect(cropX1, cropY1, cropWidth, cropHeight);
                }
                const debugUrl = debugCanvas.toDataURL('image/png');

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = cropWidth;
                tempCanvas.height = cropHeight;
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) return;
                tempCtx.drawImage(originalCanvas, cropX1, cropY1, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

                const finalCanvas = document.createElement('canvas');
                let finalW = cropWidth;
                let finalH = cropHeight;

                if (useFixedCanvas) {
                    let scale = 1;
                    if (cropWidth > targetSize || cropHeight > targetSize) {
                        scale = Math.min(targetSize / cropWidth, targetSize / cropHeight);
                    }
                    const scaledW = cropWidth * scale;
                    const scaledH = cropHeight * scale;
                    finalW = targetSize;
                    finalH = targetSize;
                    finalCanvas.width = finalW;
                    finalCanvas.height = finalH;
                    const finalCtx = finalCanvas.getContext('2d');
                    if (!finalCtx) return;
                    finalCtx.drawImage(tempCanvas, 0, 0, cropWidth, cropHeight, (finalW - scaledW) / 2, (finalH - scaledH) / 2, scaledW, scaledH);
                } else {
                    finalCanvas.width = finalW;
                    finalCanvas.height = finalH;
                    const finalCtx = finalCanvas.getContext('2d');
                    if (!finalCtx) return;
                    finalCtx.drawImage(tempCanvas, 0, 0);
                }

                const dataUrl = finalCanvas.toDataURL('image/png');
                finalCanvas.toBlob((blob) => {
                    if (blob) {
                        setProcessedFiles(prev => [{
                            blob,
                            name: file.name || `image_${Date.now()}.png`,
                            dataUrl,
                            debugUrl,
                            oldW: img.width,
                            oldH: img.height,
                            newW: finalW,
                            newH: finalH
                        }, ...prev]);
                    }
                }, 'image/png');
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const downloadZip = async () => {
        if (processedFiles.length === 0) return;
        const zip = new JSZip();
        processedFiles.forEach(f => zip.file(`trimmed_${f.name}`, f.blob));
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `assets_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                .checkerboard-grid {
                    background-image: linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 25%);
                    background-size: 16px 16px;
                }
                .result-card {
                    background: rgba(17, 18, 25, 0.6);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 28px;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .result-card:hover { border-color: rgba(99, 102, 241, 0.3); transform: translateY(-6px); }
            `}</style>

            {/* Panel Główny */}
            <div className="premium-glass p-8 md:p-12 rounded-[3rem] space-y-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.4em]">Masowe Przycinanie Zasobów</label>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-3 cursor-pointer group" data-tooltip="Pokaż ramkę określającą wykryty obszar cięcia">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${showDebug ? 'bg-indigo-600 border-indigo-600' : 'border-stone-700'}`}>
                                {showDebug && <span className="text-white text-[10px]">✓</span>}
                            </div>
                            <input type="checkbox" checked={showDebug} onChange={e => setShowDebug(e.target.checked)} className="hidden" />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${showDebug ? 'text-white' : 'text-stone-600'}`}>Podgląd Cięcia</span>
                        </label>
                        <button onClick={() => setProcessedFiles([])} className="text-[10px] font-black text-stone-600 hover:text-red-500 uppercase tracking-widest transition-colors" data-tooltip="Wyczyść wszystkie przetworzone obrazy">Wyczyść listę</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-white/5">
                    <div className="space-y-6 p-6 bg-black/30 rounded-[2rem] border border-white/5">
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block">Czułość Alfy ({threshold})</label>
                            <input type="range" min="1" max="255" value={threshold} onChange={e => setThreshold(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500" data-tooltip="Poziom przezroczystości od którego zaczyna się obraz (1 = bardzo czuły)" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block">Dotnij Krawędzie ({padding > 0 ? `+${padding}` : padding}px)</label>
                            <input type="range" min="-20" max="100" value={padding} onChange={e => setPadding(parseInt(e.target.value))} className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500" data-tooltip="Ujemne wartości = docinanie krawędzi. Dodatnie = dodatkowa przestrzeń." />
                        </div>
                    </div>

                    <div className="md:col-span-2 p-6 bg-black/30 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex items-center justify-between" data-tooltip="Wymuś określony rozmiar końcowy (np. 256x256)">
                            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Stałe Płótno (Canvas)</label>
                            <input type="checkbox" checked={useFixedCanvas} onChange={e => setUseFixedCanvas(e.target.checked)} className="w-5 h-5 rounded appearance-none bg-white/10 checked:bg-indigo-500 transition-colors cursor-pointer border border-white/10" />
                        </div>
                        {useFixedCanvas && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                                <select value={canvasPreset} onChange={e => setCanvasPreset(e.target.value)} className="w-full bg-black/40 border border-white/5 text-stone-400 text-[10px] p-3 rounded-xl outline-none uppercase font-black">
                                    <option value="32">32x32 (Pixel)</option>
                                    <option value="64">64x64 (Retro)</option>
                                    <option value="128">128x128 (Tile)</option>
                                    <option value="256">256x256 (HD)</option>
                                    <option value="512">512x512 (4K)</option>
                                    <option value="custom">Własny...</option>
                                </select>
                                {canvasPreset === 'custom' && (
                                    <input type="number" value={customCanvasSize} onChange={e => setCustomCanvasSize(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 text-stone-200 text-xs p-3 rounded-xl outline-none" placeholder="Wielkość w px" />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(Array.from(e.dataTransfer.files)); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-[200px] border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center transition-all cursor-pointer group ${isDragging ? 'border-indigo-500 bg-indigo-500/10 scale-95' : 'border-white/5 bg-black/20 hover:border-white/10'}`}
                    data-tooltip="Przeciągnij tutaj pliki graficzne (JPEG/PNG)"
                >
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => handleFiles(Array.from(e.target.files || []))} />
                    <span className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-500">📥</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">Wgraj grafiki do obróbki</span>
                </div>

                {processedFiles.length > 0 && (
                    <button onClick={downloadZip} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase rounded-[2rem] shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98]" data-tooltip="Pobierz wszystkie przycięte obrazy w jednym archiwum ZIP">
                        📦 POBIERZ PACZKĘ ZIP ({processedFiles.length})
                    </button>
                )}
            </div>

            {/* Results Grid */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 text-[10px] font-black text-stone-700 uppercase tracking-[0.4em]">
                    <div className="flex-1 h-[1px] bg-white/5"></div>
                    Przetworzone Pliki
                    <div className="flex-1 h-[1px] bg-white/5"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {processedFiles.map((file, idx) => {
                        const reduction = Math.round((1 - (file.newW * file.newH) / (file.oldW * file.oldH)) * 100);
                        return (
                            <div key={idx} className="result-card group">
                                <div className="relative aspect-square checkerboard-grid m-4 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-black">
                                    <img src={showDebug ? file.debugUrl : file.dataUrl} className="w-full h-full object-contain p-4 transition-all duration-700 group-hover:scale-110" />
                                    <div className="absolute top-4 right-4 px-2 py-1 bg-indigo-600/80 backdrop-blur-md rounded-lg text-[9px] font-black text-white">
                                        {reduction > 0 ? `-${reduction}%` : 'FIX'}
                                    </div>
                                </div>
                                <div className="p-4 pt-0 space-y-3">
                                    <div className="bg-black/40 rounded-xl p-2 border border-white/5 text-center">
                                        <span className="text-[9px] font-black uppercase text-stone-500">{file.oldW}x{file.oldH} ➔ {file.newW}x{file.newH}</span>
                                    </div>
                                    <button onClick={() => { const a = document.createElement('a'); a.href = file.dataUrl; a.download = `trimmed_${file.name}`; a.click(); }} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-stone-300 transition-all">Pobierz PNG</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
