import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground, erodeImage, createToken, downloadImage } from '../services/imageProcessing';
import { useStyle } from '../contexts/StyleContext';

interface Result {
    id: string;
    url: string;
    modelUsed?: string;
    isRemovingBg?: boolean;
    originalUrl?: string;
    mode?: string;
}

export const SpriteGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();

    const storageKey = `sanctuary_sprites_${currentStyle}`;
    const settingsKey = `sanctuary_sprites_settings_${currentStyle}`;

    const [loading, setLoading] = useState(false);

    const [prompt, setPrompt] = useState(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).prompt ?? '' : '';
        } catch { return ''; }
    });

    const [genMode, setGenMode] = useState<'sheet' | 'single'>(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).genMode ?? 'sheet' : 'sheet';
        } catch { return 'sheet'; }
    });

    const [bgMode, setBgMode] = useState<'transparent' | 'green' | 'themed'>(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).bgMode ?? 'transparent' : 'transparent';
        } catch { return 'transparent'; }
    });

    const [model, setModel] = useState(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).model ?? 'free-pollinations' : 'free-pollinations';
        } catch { return 'free-pollinations'; }
    });

    const [results, setResults] = useState<Result[]>(() => {
        const saved = localStorage.getItem(storageKey);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(results));
    }, [results, storageKey]);

    React.useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify({ genMode, bgMode, model, prompt }));
    }, [genMode, bgMode, model, prompt, settingsKey]);

    React.useEffect(() => {
        const savedResults = localStorage.getItem(storageKey);
        try {
            setResults(savedResults ? JSON.parse(savedResults) : []);
        } catch {
            setResults([]);
        }

        const savedSettings = localStorage.getItem(settingsKey);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setGenMode(parsed.genMode || 'sheet');
                setBgMode(parsed.bgMode || 'transparent');
                setModel(parsed.model || 'free-pollinations');
                setPrompt(parsed.prompt || '');
            } catch {
                setGenMode('sheet');
                setBgMode('transparent');
                setModel('free-pollinations');
                setPrompt('');
            }
        } else {
            setGenMode('sheet');
            setBgMode('transparent');
            setModel('free-pollinations');
            setPrompt('');
        }
    }, [currentStyle, storageKey, settingsKey]);

    const getFullPrompt = () => {
        const base = currentStyle === 'pixelart' ? '16-bit pixel art' : 'game sprite';
        const modeStr = genMode === 'sheet' ? 'sprite sheet, multiple poses, walking animation frames' : 'single character sprite, side view';
        // Ulepszony prompt dla przezroczystości
        const bgStr = bgMode === 'transparent' ? 'on pure white background, isolated, high contrast' :
            bgMode === 'green' ? 'on neon green background #00FF00' :
                'themed background';

        return `${base} ${modeStr}, ${prompt}, masterpiece, best quality, 8k, ${bgStr}, no text, ${styleConfig.artStyle}, ${styleConfig.negative}`;
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        setError(null);

        try {
            const { url, modelUsed } = await generateAvatar(getFullPrompt(), model);
            let finalUrl = url;
            if (bgMode === 'transparent') finalUrl = await removeBackground(url, 'white');

            setResults(prev => [{
                id: Math.random().toString(),
                url: finalUrl,
                modelUsed,
                originalUrl: url,
                mode: genMode === 'sheet' ? 'Arkusze' : 'Pojedynczy'
            }, ...prev]);
        } catch (e) {
            setError("Matryca została uszkodzona.");
        } finally {
            setLoading(false);
        }
    };

    const modifyEdge = async (id: string, amount: number) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
        const item = results.find(r => r.id === id);
        if (!item) return;

        if (amount === -1 && item.originalUrl) {
            setResults(prev => prev.map(r => r.id === id ? { ...r, url: item.originalUrl!, isRemovingBg: false } : r));
            return;
        }

        try {
            const newUrl = await erodeImage(item.url, amount);
            setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false } : r));
        } catch (e) {
            setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in p-4 transition-colors duration-500">
            {/* Panel Główny */}
            <div className="premium-glass p-8 md:p-12 rounded-[3rem] space-y-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.4em]">Generator Spritów</label>
                    <div className="flex flex-wrap justify-center gap-4 items-center">
                        <div className="flex bg-black-40-themed border border-white/5 p-1 rounded-xl">
                            {[
                                { id: 'sheet', label: 'Arkusz' },
                                { id: 'single', label: 'Solo' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setGenMode(m.id as any)}
                                    className={`relative px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${genMode === m.id ? 'bg-indigo-900/40 text-indigo-200' : 'text-stone-600 hover:text-stone-400'}`}
                                    data-tooltip={m.id === 'sheet' ? 'Wygeneruj cały arkusz animacji' : 'Wygeneruj pojedynczego sprita'}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-black-40-themed border border-white/5 p-1 rounded-xl">
                            {[
                                { id: 'transparent', label: 'PNG' },
                                { id: 'green', label: 'Green' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setBgMode(m.id as any)}
                                    className={`relative px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${bgMode === m.id ? 'bg-emerald-900/40 text-emerald-200' : 'text-stone-600 hover:text-stone-400'}`}
                                    data-tooltip={m.id === 'transparent' ? 'Przezroczyste tło (PNG)' : 'Zielone tło (Chroma Key)'}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-black-40-themed border border-white/5 text-stone-500 text-[10px] font-black p-2.5 rounded-xl outline-none cursor-pointer hover:text-stone-300 transition-colors">
                            <option value="free-pollinations">MOC PUSTKI</option>
                            <option value="gemini-2.5-flash-image">GEMINI FLASH</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Definicja Postaci (Opis)</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Np. rycerz w niebieskiej zbroi, animacja chodu..." className="custom-textarea" />
                    <PromptDisplay label="Kod źródłowy sprita" text={getFullPrompt()} colorClass="text-indigo-900" />
                </div>

                <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full !py-6 text-base !bg-indigo-900/20 !border-indigo-600/40 !text-indigo-400">
                    ✨ GENERUJ SPRITE
                </DiabloButton>
            </div>

            {/* Wyniki */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 text-[10px] font-black text-stone-700 uppercase tracking-[0.4em]">
                    <div className="flex-1 h-px bg-white/5"></div>
                    Magazyn Spritów
                    <div className="flex-1 h-px bg-white/5"></div>
                </div>

                {results.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-stone-800 rounded-[3rem]">
                        <span className="text-6xl mb-4">✨</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Archiwum jest puste</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {results.map((res) => (
                            <div key={res.id} className="result-card group">
                                <div className="p-4 flex justify-between items-center bg-black-20-themed border-b border-white/5">
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{res.mode}</span>
                                    <button onClick={() => setResults(prev => prev.filter(r => r.id !== res.id))} className="text-stone-600 hover:text-red-500 transition-colors" data-tooltip="Usuń sprite z magazynu">✕</button>
                                </div>
                                <div className="relative aspect-video m-6 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-black/40 checkerboard-grid">
                                    <img src={res.url} className={`w-full h-full object-contain p-4 transition-all duration-700 ${res.isRemovingBg ? 'scale-90 opacity-40 blur-md' : 'group-hover:scale-105'}`} alt="Generated sprite" />
                                    {res.isRemovingBg && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 pt-0 space-y-3">
                                    <div className="flex items-center justify-between bg-black-40-themed rounded-xl p-2 border border-white/5">
                                        <span className="text-[9px] font-black text-stone-600 uppercase ml-2 tracking-widest">Krawędzie</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => modifyEdge(res.id, 1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-indigo-500 hover:border-indigo-500 transition-all font-black" data-tooltip="Zwężaj kontur (popraw wycięcie)">-</button>
                                            <button onClick={() => modifyEdge(res.id, -1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-emerald-500 hover:border-emerald-500 transition-all font-black text-[10px]" data-tooltip="Przywróć oryginał">↺</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => downloadImage(res.url, `sprite_${res.id}.png`)} className="col-span-2 py-3 rounded-xl bg-indigo-600/10 border border-indigo-600/20 text-[10px] font-black uppercase text-indigo-400 hover:bg-indigo-600/20 transition-all" data-tooltip="Zapisz sprite na dysku">Pobierz PNG</button>
                                        <button onClick={() => createToken(res.url).then(u => setResults(prev => prev.map(r => r.id === res.id ? { ...r, url: u } : r)))} className="py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[9px] font-black uppercase hover:bg-white/5 transition-all text-white/50" data-tooltip="Stwórz żeton VTT">Token</button>
                                        <button onClick={() => removeBackground(res.url, 'white').then(u => setResults(prev => prev.map(r => r.id === res.id ? { ...r, url: u } : r)))} className="py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[9px] font-black uppercase hover:bg-white/5 transition-all text-white/50" data-tooltip="Ponów usuwanie tła">Wytnij</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
