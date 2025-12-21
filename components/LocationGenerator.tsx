
import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground, erodeImage, createToken } from '../services/imageProcessing';
import { useStyle } from '../contexts/StyleContext';

interface Result {
    id: string;
    url: string;
    modelUsed?: string;
    isRemovingBg?: boolean;
    originalUrl?: string;
}

export const LocationGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [autoRemoveBg, setAutoRemoveBg] = useState(false);
    const [model, setModel] = useState('free-pollinations');

    // Load from local storage
    const [results, setResults] = useState<Result[]>(() => {
        const saved = localStorage.getItem('sanctuary_location_result');
        if (!saved) return [];
        try {
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) {
                if (typeof parsed === 'string') return [{ id: Math.random().toString(), url: parsed, modelUsed: 'Moc Pustki (Free)' }];
                return [{ ...parsed, id: parsed.id || Math.random().toString(), modelUsed: parsed.modelUsed || 'Moc Pustki (Free)' }];
            }
            return parsed.map((item: any) => ({
                ...item,
                id: item.id || Math.random().toString(),
                modelUsed: item.modelUsed || 'Moc Pustki (Free)'
            }));
        } catch { return []; }
    });

    // Save to local storage
    React.useEffect(() => {
        localStorage.setItem('sanctuary_location_result', JSON.stringify(results));
    }, [results]);

    const getLocationPrefix = () => {
        if (currentStyle === 'cyberpunk') return 'Cyberpunk 2077 environment, Night City location, neon-lit urban';
        if (currentStyle === 'pixelart') return '16-bit pixel art game environment, retro RPG location';
        return 'Diablo 4 environment';
    };

    const getFullPrompt = () => {
        if (autoRemoveBg) {
            return `${getLocationPrefix()}, ${prompt || '[opis]'}, ${styleConfig.artStyle}, ${styleConfig.lighting}, on pure white background, isolated on white, cut out, empty background, NO TEXT, ${styleConfig.negative}`;
        }
        return `${getLocationPrefix()}, ${prompt || '[opis]'}, ${styleConfig.artStyle}, ${styleConfig.lighting}, ${styleConfig.environment}, NO TEXT, ${styleConfig.negative}`;
    };

    const getPlaceholder = () => {
        if (currentStyle === 'cyberpunk') return 'np. Klub nocny w neonach, brudna alejka...';
        if (currentStyle === 'pixelart') return 'np. Las pixel art, zamek 16-bit...';
        return 'np. Katedra Tristram w płomieniach...';
    };

    const processRemoveBg = async (imageUrl: string) => {
        return removeBackground(imageUrl, autoRemoveBg ? 'white' : 'green');
    };

    const removeBg = async (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
        const item = results.find(r => r.id === id);
        if (!item) return;
        try {
            const newUrl = await processRemoveBg(item.url);
            setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false } : r));
        } catch (e) { setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r)); }
    };

    const modifyEdge = async (id: string, amount: number) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
        const item = results.find(r => r.id === id);
        if (!item) return;

        if (amount === -1) {
            if (item.originalUrl) setResults(prev => prev.map(r => r.id === id ? { ...r, url: item.originalUrl!, isRemovingBg: false } : r));
            else setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
            return;
        }

        try {
            const newUrl = await erodeImage(item.url, amount);
            setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false } : r));
        } catch (e) {
            setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
        }
    };

    const makeToken = async (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
        const item = results.find(r => r.id === id);
        if (!item) return;
        try {
            const newUrl = await createToken(item.url);
            setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false } : r));
        } catch (e) {
            setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setLoading(true);
        const full = getFullPrompt();
        try {
            const { url, modelUsed } = await generateAvatar(full, model);
            let finalUrl = url;
            if (autoRemoveBg) {
                try { finalUrl = await processRemoveBg(url); } catch (e) { }
            }
            setResults(prev => [{ id: Math.random().toString(), url: finalUrl, modelUsed, originalUrl: url }, ...prev]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <label className="font-diablo text-stone-400 text-[10px] uppercase block">Architektura Ciemności</label>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="autoTransparentLocation" checked={autoRemoveBg} onChange={e => setAutoRemoveBg(e.target.checked)} className="accent-emerald-600" />
                        <label htmlFor="autoTransparentLocation" className="text-emerald-500 text-[9px] uppercase font-serif cursor-pointer hover:text-emerald-400">Przezroczyste Tło</label>
                    </div>
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none">
                        <option value="free-pollinations">🌀 Moc Pustki (Free)</option>
                        <option value="gemini-2.5-flash-image">⚡ Gemini Flash</option>
                    </select>
                </div>
                <div className="flex flex-col gap-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={getPlaceholder()}
                        className="w-full bg-black border border-stone-800 p-4 text-stone-200 outline-none focus:border-stone-600 min-h-[100px]"
                    />
                    <div className="mb-2">
                        <PromptDisplay label="Wizja" text={getFullPrompt()} colorClass="text-stone-500" />
                    </div>
                    <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full">Wizualizuj</DiabloButton>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((r) => (
                    <div key={r.id} className="border-4 border-double border-stone-800 p-1 bg-black shadow-[0_0_50px_rgba(0,0,0,1)] relative flex flex-col gap-1">
                        <span className="absolute top-2 left-2 bg-black/60 text-[8px] text-stone-500 px-1 border border-stone-800 z-10 font-serif">Moc: {r.modelUsed}</span>
                        <div className="relative overflow-hidden bg-black bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)]">
                            <img src={r.url} className={`w-full h-full object-contain transition-opacity ${r.isRemovingBg ? 'opacity-30' : 'opacity-100'}`} />
                        </div>

                        <div className="flex justify-between items-center bg-stone-900/50 p-1 border border-stone-800">
                            <span className="text-[8px] text-stone-500 uppercase font-serif">Krawędź</span>
                            <div className="flex gap-1">
                                <button onClick={() => modifyEdge(r.id, 1)} className="bg-black text-amber-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-amber-600 disabled:opacity-50" disabled={r.isRemovingBg} title="Dotnij (Zmniejsz)">-</button>
                                <button onClick={() => modifyEdge(r.id, -1)} className="bg-black text-emerald-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-emerald-600 disabled:opacity-50" disabled={r.isRemovingBg || !r.originalUrl} title="Cofnij (Reset)">↺</button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-1 px-2">
                            <div className="flex gap-2 w-full">
                                <button onClick={() => removeBg(r.id)} className="flex-1 text-center bg-stone-900/50 text-stone-500 text-[8px] uppercase py-1 border border-stone-800 hover:text-white">Wytnij</button>
                                <button
                                    onClick={() => makeToken(r.id)}
                                    disabled={r.isRemovingBg}
                                    className="bg-stone-900 text-amber-500 text-[8px] uppercase p-1 border border-stone-800 hover:text-amber-300 flex-1 transition-colors disabled:opacity-50"
                                    title="Stwórz Token VTT"
                                >
                                    Token
                                </button>
                                <a href={r.url} download={`sanctuary_location_${r.id}.png`} className="flex-1 text-center bg-stone-900/50 text-stone-500 hover:text-stone-300 uppercase text-[9px] border border-stone-800 py-1">Zapisz</a>
                                <button onClick={() => setResults(prev => prev.filter(item => item.id !== r.id))} className="text-red-900 hover:text-red-700 uppercase text-[9px] px-2 border border-red-900/20">Usuń</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
