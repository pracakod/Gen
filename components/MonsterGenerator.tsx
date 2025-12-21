import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground, erodeImage, createToken } from '../services/imageProcessing';
import { useStyle } from '../contexts/StyleContext';


interface Result {
    id: string;
    url: string;
    status: 'success';
    modelUsed?: string;
    isRemovingBg?: boolean;
    originalUrl?: string;
}

export const MonsterGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    // Storage key per style
    const storageKey = `sanctuary_monsters_${currentStyle}`;
    const settingsKey = `sanctuary_monsters_settings_${currentStyle}`;

    const [autoRemoveBg, setAutoRemoveBg] = useState(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).autoRemoveBg ?? false : false;
    });
    const [model, setModel] = useState(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).model ?? 'free-pollinations' : 'free-pollinations';
    });

    // Load from local storage (per style)
    const [results, setResults] = useState<Result[]>(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    });

    // Save to local storage (per style)
    React.useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(results));
    }, [results, storageKey]);

    // Save settings
    React.useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify({ autoRemoveBg, model }));
    }, [autoRemoveBg, model, settingsKey]);

    // Reload when style changes
    React.useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setResults(saved ? JSON.parse(saved) : []);
    }, [currentStyle]);

    const getMonsterPrefix = () => {
        if (currentStyle === 'cyberpunk') return 'Cyberpunk 2077 enemy, cyborg creature, malfunctioning android, mutant';
        if (currentStyle === 'pixelart') return '16-bit pixel art enemy sprite, retro game boss';
        return 'Horrific Diablo 4 monster';
    };

    const getFullPrompt = () => {
        if (autoRemoveBg) {
            return `${getMonsterPrefix()}, ${prompt || '[opis]'}, ${styleConfig.artStyle}, ${styleConfig.lighting}, on pure white background, isolated on white, cut out, empty background, NO TEXT, ${styleConfig.negative}`;
        }
        return `${getMonsterPrefix()}, ${prompt || '[opis]'}, ${styleConfig.artStyle}, ${styleConfig.lighting}, on solid pure neon green background #00FF00, NO TEXT, ${styleConfig.negative}`;
    };

    const getPlaceholder = () => {
        if (currentStyle === 'cyberpunk') return 'np. Cyborg morderczy, mutant z kanałów...';
        if (currentStyle === 'pixelart') return 'np. Boss smok, goblin wojownik...';
        return 'np. Demon ognia z rogami...';
    };

    const getButtonText = () => {
        if (currentStyle === 'cyberpunk') return 'Aktywuj Zagrożenie';
        if (currentStyle === 'pixelart') return 'Spawn Enemy';
        return 'Przyzwij Bestię';
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
        if (!prompt.trim()) return;
        setLoading(true);
        const fullPrompt = getFullPrompt();
        try {
            const { url, modelUsed } = await generateAvatar(fullPrompt, model);
            let finalUrl = url;
            if (autoRemoveBg) {
                try { finalUrl = await processRemoveBg(url); } catch (e) { }
            }
            setResults(prev => [{ id: Math.random().toString(), url: finalUrl, status: 'success', modelUsed, originalUrl: url, isRemovingBg: false }, ...prev]);
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
                    <label className="font-diablo text-red-900 text-[10px] uppercase block">Przyzwanie Demona</label>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="autoTransparentMonster" checked={autoRemoveBg} onChange={e => setAutoRemoveBg(e.target.checked)} className="accent-emerald-600" />
                        <label htmlFor="autoTransparentMonster" className="text-emerald-500 text-[9px] uppercase font-serif cursor-pointer hover:text-emerald-400">Przezroczyste Tło</label>
                    </div>
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none">
                        <option value="free-pollinations">🌀 Moc Pustki (Free)</option>
                        <option value="gemini-2.5-flash-image">⚡ Gemini Flash</option>
                    </select>
                </div>

                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full bg-black border border-stone-800 p-4 mb-4 text-stone-200 outline-none focus:border-red-900"
                />
                <div className="mb-4">
                    <PromptDisplay label="Zaklęcie" text={getFullPrompt()} colorClass="text-red-900" />
                </div>
                <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full text-red-500 border-red-900 hover:bg-red-900/20">{getButtonText()}</DiabloButton>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {results.map(r => (
                    <div key={r.id} className="border border-stone-900 bg-black p-1 relative flex flex-col gap-1">
                        <span className="absolute top-2 left-2 bg-black/60 text-[8px] text-stone-500 px-1 border border-stone-800 z-10 pointer-events-none">
                            {r.modelUsed || 'Moc Pustki (Free)'}
                        </span>
                        <div className="relative aspect-square border border-stone-800 overflow-hidden bg-black bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)]">
                            <img src={r.url} className={`w-full h-full object-contain transition-opacity ${r.isRemovingBg ? 'opacity-30' : 'opacity-100'}`} />
                        </div>

                        <div className="flex justify-between items-center bg-stone-900/50 p-1 border border-stone-800">
                            <span className="text-[8px] text-stone-500 uppercase font-serif">Krawędź</span>
                            <div className="flex gap-1">
                                <button onClick={() => modifyEdge(r.id, 1)} className="bg-black text-amber-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-amber-600 disabled:opacity-50" disabled={r.isRemovingBg} title="Dotnij (Zmniejsz)">-</button>
                                <button onClick={() => modifyEdge(r.id, -1)} className="bg-black text-emerald-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-emerald-600 disabled:opacity-50" disabled={r.isRemovingBg || !r.originalUrl} title="Cofnij (Reset)">↺</button>
                            </div>
                        </div>

                        <div className="flex gap-1 mt-1">
                            <button onClick={() => removeBg(r.id)} className="flex-1 text-center text-[8px] text-stone-500 uppercase py-1 hover:text-white border border-stone-800 bg-stone-900">Wytnij</button>
                            <button
                                onClick={() => makeToken(r.id)}
                                disabled={r.isRemovingBg}
                                className="bg-stone-900 text-amber-500 text-[8px] uppercase p-1 border border-stone-800 hover:text-amber-300 flex-1 transition-colors disabled:opacity-50"
                                title="Stwórz Token VTT"
                            >
                                Token
                            </button>
                            <a href={r.url} download={`sanctuary_monster_${r.id}.png`} className="flex-1 text-center text-[8px] text-stone-500 uppercase py-1 hover:text-stone-300 border border-stone-800 bg-stone-900">Pobierz</a>
                            <button
                                onClick={() => setResults(prev => prev.filter(res => res.id !== r.id))}
                                className="text-center text-[8px] text-red-500 uppercase py-1 px-2 hover:bg-red-900/20 border border-red-900/30"
                            >
                                X
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
