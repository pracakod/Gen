
import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground, erodeImage, createToken, downloadImage } from '../services/imageProcessing';
import { useStyle } from '../contexts/StyleContext';

const MOUNT_TAGS = {
    diablo: {
        type: ['Koń', 'Bestia', 'Pająk', 'Skorpion', 'Demon'],
        armor: ['Bez pancerza', 'Skórzany', 'Żelazny', 'Kościany', 'Eteryczny'],
        element: ['Ogień', 'Cień', 'Strach', 'Krew']
    },
    cyberpunk: {
        type: ['Motocykl', 'Hover Car', 'Ciężarówka', 'Dron-nosiciel'],
        armor: ['Standard', 'Opancerzony', 'Sportowy', 'Zardzewiały'],
        element: ['Neonowy', 'Chromowy', 'Militarny', 'Zglitchowany']
    },
    pixelart: {
        type: ['Koń', 'Gryf', 'Smok', 'Wielka Żaba', 'Chmura'],
        armor: ['Zwykły', 'Srebrny', 'Złoty', 'Magiczny'],
        element: ['Latający', 'Szybki', 'Pikselowy', 'Mocny']
    }
};

interface Result {
    id: string;
    url: string;
    modelUsed?: string;
    isRemovingBg?: boolean;
    originalUrl?: string;
}

export const MountGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    // Storage key per style
    const storageKey = `sanctuary_mounts_${currentStyle}`;
    const settingsKey = `sanctuary_mounts_settings_${currentStyle}`;

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

    const [selectedTags, setSelectedTags] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).selectedTags ?? {} : {};
    });

    const toggleTag = (category: string, value: string) => {
        setSelectedTags(prev => ({
            ...prev,
            [category]: prev[category] === value ? '' : value
        }));
    };

    // Save settings
    React.useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify({ autoRemoveBg, model, selectedTags }));
    }, [autoRemoveBg, model, selectedTags, settingsKey]);

    // Reload when style changes
    React.useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setResults(saved ? JSON.parse(saved) : []);
    }, [currentStyle]);

    const getMountPrefix = () => {
        if (currentStyle === 'cyberpunk') return 'Cyberpunk 2077 vehicle, futuristic motorcycle or hover car';
        if (currentStyle === 'pixelart') return '16-bit pixel art mount sprite, retro game vehicle or creature';
        return 'Diablo 4 mount';
    };

    const getFullPrompt = () => {
        const parts = [getMountPrefix()];
        if (selectedTags.type) parts.push(selectedTags.type);
        if (selectedTags.armor) parts.push(selectedTags.armor);
        if (selectedTags.element) parts.push(selectedTags.element);
        if (prompt) parts.push(prompt);

        const baseText = parts.join(', ');
        const fitInFrame = "full mount view, side profile view, must be fully visible within the frame, not cut off, head and tail visible, centered";
        const cleanEdges = "clean sharp edges, NO FOG, NO PARTICLES, NO BLOOM, NO SMOKE, NO VOLUMETRIC LIGHTING, high contrast between subject and background";

        if (autoRemoveBg) {
            return `${baseText}, ${styleConfig.artStyle}, ${styleConfig.lighting}, side view, ${fitInFrame}, ${cleanEdges}, on pure white background, isolated on white, cut out, empty background, no shadows on background, NO TEXT, ${styleConfig.negative}`;
        }
        return `${baseText}, ${styleConfig.artStyle}, ${styleConfig.lighting}, ${styleConfig.environment}, side view, ${fitInFrame}, ${cleanEdges}, on solid pure neon green background #00FF00, flat color background, no shadows on background, NO TEXT, ${styleConfig.negative}`;
    };

    const getPlaceholder = () => {
        if (currentStyle === 'cyberpunk') return 'np. Motocykl z neonami, hover car...';
        if (currentStyle === 'pixelart') return 'np. Koń pixelowy, smok do jazdy...';
        return 'np. Koń w zbroi z kości...';
    };

    const getButtonText = () => {
        if (currentStyle === 'cyberpunk') return 'Przekaż Pojazd';
        if (currentStyle === 'pixelart') return 'Stwórz Mount';
        return 'Otwórz Stajnię';
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
        } catch (e) { console.error(e) } finally { setLoading(false) }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <label className="font-diablo text-orange-900 text-[10px] uppercase block">Stajnie Sanktuarium</label>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="autoTransparentMount" checked={autoRemoveBg} onChange={e => setAutoRemoveBg(e.target.checked)} className="accent-emerald-600" />
                        <label htmlFor="autoTransparentMount" className="text-emerald-500 text-[9px] uppercase font-serif cursor-pointer hover:text-emerald-400">Przezroczyste Tło</label>
                    </div>
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none">
                        <option value="free-pollinations">🌀 Moc Pustki (Free)</option>
                        <option value="gemini-2.5-flash-image">⚡ Gemini Flash</option>
                    </select>
                </div>
                <div className="space-y-4 mb-4">
                    {Object.entries(MOUNT_TAGS[currentStyle as keyof typeof MOUNT_TAGS]).map(([category, values]) => (
                        <div key={category}>
                            <label className="text-stone-500 text-[9px] uppercase mb-1 block">
                                {category === 'type' ? 'Typ' : category === 'armor' ? 'Pancerz' : 'Atrybut'}
                            </label>
                            <div className="flex flex-wrap gap-1">
                                {values.map(val => (
                                    <button
                                        key={val}
                                        onClick={() => toggleTag(category, val)}
                                        className={`px-2 py-0.5 text-[10px] border transition-all ${selectedTags[category] === val
                                            ? 'bg-orange-900/40 border-orange-600 text-orange-200'
                                            : 'bg-black border-stone-800 text-stone-500 hover:border-stone-600'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full bg-black border border-stone-800 p-4 mb-4 text-stone-200 outline-none focus:border-orange-900"
                />
                <div className="mb-4">
                    <PromptDisplay label="Rozkaz" text={getFullPrompt()} colorClass="text-orange-900" />
                </div>
                <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full">{getButtonText()}</DiabloButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((res) => (
                    <div key={res.id} className="relative group border border-stone-800 bg-black p-1 flex flex-col gap-1">
                        <span className="absolute top-2 left-2 bg-black/60 text-[8px] text-stone-500 px-1 border border-stone-800 z-10">{res.modelUsed}</span>
                        <div className="relative aspect-square border border-stone-800 overflow-hidden bg-black bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)]">
                            <img src={res.url} className={`w-full h-full object-contain transition-opacity ${res.isRemovingBg ? 'opacity-30' : 'opacity-100'}`} />
                        </div>

                        <div className="flex justify-between items-center bg-stone-900/50 p-1 border border-stone-800">
                            <span className="text-[8px] text-stone-500 uppercase font-serif">Krawędź</span>
                            <div className="flex gap-1">
                                <button onClick={() => modifyEdge(res.id, 1)} className="bg-black text-amber-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-amber-600 disabled:opacity-50" disabled={res.isRemovingBg} title="Dotnij (Zmniejsz)">-</button>
                                <button onClick={() => modifyEdge(res.id, -1)} className="bg-black text-emerald-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-emerald-600 disabled:opacity-50" disabled={res.isRemovingBg || !res.originalUrl} title="Cofnij (Reset)">↺</button>
                            </div>
                        </div>

                        <div className="flex gap-1 mt-1">
                            <button onClick={() => removeBg(res.id)} className="flex-1 text-center bg-stone-900 text-stone-500 text-[8px] uppercase py-1 border border-stone-800 hover:text-white">Wytnij</button>
                            <button
                                onClick={() => makeToken(res.id)}
                                disabled={res.isRemovingBg}
                                className="bg-stone-900 text-amber-500 text-[8px] uppercase p-1 border border-stone-800 hover:text-amber-300 flex-1 transition-colors disabled:opacity-50"
                                title="Stwórz Token VTT"
                            >
                                Token
                            </button>
                            <button
                                onClick={() => downloadImage(res.url, `sanctuary_mount_${res.id}.png`)}
                                className="flex-1 text-center bg-stone-900 text-stone-500 text-[8px] uppercase py-1 border border-stone-800 hover:text-white"
                            >
                                Zapisz
                            </button>
                            <button onClick={() => setResults(prev => prev.filter((r) => r.id !== res.id))} className="bg-red-900/80 text-white px-2 py-1 text-[10px] uppercase border border-red-900">X</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
