import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground, erodeImage, createToken, downloadImage } from '../services/imageProcessing';
import { useStyle } from '../contexts/StyleContext';

const MONSTER_TAGS = {
    diablo: {
        type: ['Bestia', 'Demon', 'Nieumarły', 'Kultysta', 'Aberracja'],
        element: ['Ogień', 'Mróz', 'Błyskawice', 'Trucizna', 'Krew', 'Cień'],
        tier: ['Zwykły', 'Elitarny', 'Boss', 'Legendarny']
    },
    cyberpunk: {
        type: ['Cyborg', 'Dron', 'Android', 'Zmutowany', 'Mech'],
        element: ['Elektryczny', 'Termiczny', 'Próżniowy', 'Zglitchowany'],
        tier: ['Mob', 'Veteran', 'Boss unit', 'Night City Legend']
    },
    pixelart: {
        type: ['Slime', 'Szkielet', 'Gólem', 'Smok', 'Duch'],
        element: ['Ogień', 'Lód', 'Magia', 'Zło', 'Fizyczny'],
        tier: ['Level 1', 'Elite', 'Mini-boss', 'Final Boss']
    },
    gta: {
        type: ['Gangster', 'Snajper', 'Ochoroniarz', 'Były żołnierz'],
        element: ['Pistolet', 'Strzelba', 'Karabin', 'Nóż'],
        tier: ['Uliczny', 'Weteran', 'Boss mafii', 'Federalny']
    },
    fortnite: {
        type: ['Husks', 'Mist Monsters', 'Riptide', 'Wildcard'],
        element: ['Ognisty', 'Energetyczny', 'Lodowy', 'Brak'],
        tier: ['Common', 'Rare', 'Epic', 'Mythic']
    },
    hades: {
        type: ['Cień', 'Szkielet', 'Fury', 'Gorgona', 'Satyr'],
        element: ['Ogień', 'Lód', 'Cień', 'Złoto'],
        tier: ['Mały', 'Duży', 'Elitarny', 'Boss']
    },
    tibia: {
        type: ['Rat', 'Dragon', 'Demon', 'Ferumbras', 'Beholder'],
        element: ['Fire', 'Ice', 'Energy', 'Earth', 'Death'],
        tier: ['Small', 'Strong', 'Master', 'Raid Boss']
    },
    cuphead: {
        type: ['Warzywo', 'Zabawka', 'Duch', 'Mechanizm'],
        element: ['Vintage', 'Inkwell', 'Grainy', 'Colorful'],
        tier: ['Normal', 'Hard', 'Expert', 'Phase 3']
    }
};

interface Result {
    id: string;
    url: string;
    status: 'success';
    modelUsed?: string;
    isRemovingBg?: boolean;
    originalUrl?: string;
    type?: string;
}

export const MonsterGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();

    const storageKey = `sanctuary_monsters_${currentStyle}`;
    const settingsKey = `sanctuary_monsters_settings_${currentStyle}`;

    const [loading, setLoading] = useState(false);

    const [prompt, setPrompt] = useState(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).prompt ?? '' : '';
        } catch { return ''; }
    });

    const [bgMode, setBgMode] = useState<'transparent' | 'green' | 'themed'>(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            if (!saved) return 'transparent';
            const parsed = JSON.parse(saved);
            return parsed.bgMode ?? 'transparent';
        } catch { return 'transparent'; }
    });

    const [bgTag, setBgTag] = useState(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).bgTag ?? '' : '';
        } catch { return ''; }
    });

    const [model, setModel] = useState(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).model ?? 'free-pollinations' : 'free-pollinations';
        } catch { return 'free-pollinations'; }
    });

    const [selectedTags, setSelectedTags] = useState<Record<string, string>>(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).selectedTags ?? {} : {};
        } catch { return {}; }
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
        localStorage.setItem(settingsKey, JSON.stringify({
            bgMode,
            bgTag,
            model,
            selectedTags,
            prompt
        }));
    }, [bgMode, bgTag, model, selectedTags, prompt, settingsKey]);

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
                setBgMode(parsed.bgMode || 'transparent');
                setBgTag(parsed.bgTag || '');
                setModel(parsed.model || 'free-pollinations');
                setSelectedTags(parsed.selectedTags || {});
                setPrompt(parsed.prompt || '');
            } catch {
                setBgMode('transparent');
                setBgTag('');
                setModel('free-pollinations');
                setSelectedTags({});
                setPrompt('');
            }
        } else {
            setBgMode('transparent');
            setBgTag('');
            setModel('free-pollinations');
            setSelectedTags({});
            setPrompt('');
        }
    }, [currentStyle, storageKey, settingsKey]);

    const getFullPrompt = () => {
        const parts = [currentStyle === 'diablo' ? 'Terrifying Diablo 4 monster' : 'monstrous creature'];
        Object.values(selectedTags).forEach(v => v && parts.push(v));
        if (prompt) parts.push(prompt);

        const baseText = parts.join(', ');
        const fit = "full body shot, centered, masterpiece, high quality, 8k, detailed anatomy";

        // Ulepszony prompt dla przezroczystości
        const bgStr = bgMode === 'transparent' ? 'on pure white background, isolated subject, high contrast' :
            bgMode === 'green' ? 'on neon green background #00FF00' :
                (bgTag || 'dark background');

        return `${baseText}, ${fit}, ${bgStr}, no text, ${styleConfig.artStyle}, ${styleConfig.negative}`;
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && Object.keys(selectedTags).length === 0) return;
        setLoading(true);
        setError(null);

        try {
            const { url, modelUsed } = await generateAvatar(getFullPrompt(), model);
            let finalUrl = url;
            if (bgMode === 'transparent') finalUrl = await removeBackground(url, 'white');

            setResults(prev => [{
                id: Math.random().toString(),
                url: finalUrl,
                status: 'success',
                modelUsed,
                originalUrl: url,
                type: selectedTags.type || 'Bestia'
            }, ...prev]);
        } catch (e) {
            setError("Rytuał przyzwania zawiódł.");
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

    const toggleTag = (category: string, value: string) => {
        setSelectedTags(prev => ({
            ...prev,
            [category]: prev[category] === value ? '' : value
        }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in p-4 transition-colors duration-500">
            {/* Panel Boczny (teraz Główny) */}
            <div className="premium-glass p-8 md:p-12 rounded-[3rem] space-y-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.4em]">Krąg Przyzwania Bestii</label>
                    <div className="flex flex-wrap justify-center gap-4 items-center">
                        <div className="flex bg-black-40-themed border border-white/5 p-1 rounded-xl">
                            {[
                                { id: 'transparent', label: 'Czyste' },
                                { id: 'green', label: 'Screen' },
                                { id: 'themed', label: 'Scena' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setBgMode(mode.id as any)}
                                    className={`relative px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${bgMode === mode.id ? 'bg-red-900/40 text-red-200' : 'text-stone-600 hover:text-stone-400'}`}
                                    data-tooltip={mode.id === 'transparent' ? 'Automatyczne wycinanie tła' : mode.id === 'green' ? 'Bestia na zielonym tle' : 'Bestia w wybranym otoczeniu'}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                        <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="bg-black-40-themed border border-white/5 text-stone-500 text-[10px] font-black p-2.5 rounded-xl outline-none cursor-pointer hover:text-stone-300 transition-colors"
                            data-tooltip="Wybierz model AI do przywołania bestii"
                        >
                            <option value="free-pollinations">MOC PUSTKI</option>
                            <option value="gemini-2.5-flash-image">GEMINI FLASH</option>
                        </select>
                    </div>
                </div>

                {/* Kategorie Tagów */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                    {bgMode === 'themed' && (
                        <div className="md:col-span-3 p-6 bg-red-900/10 rounded-3xl border border-red-900/20 shadow-inner">
                            <label className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-4 block flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                Pielesz Bestii
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {styleConfig.backgroundTags.map(tag => (
                                    <button key={tag} onClick={() => setBgTag(bgTag === tag ? '' : tag)} className={`tag-button ${bgTag === tag ? 'active' : ''}`}>{tag}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(Object.entries(MONSTER_TAGS[currentStyle as keyof typeof MONSTER_TAGS] || MONSTER_TAGS.diablo)).map(([category, values]) => (
                        <div key={category} className="p-6 bg-black-40-themed rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                                    {category === 'type' ? '💀 Gatunek' : category === 'element' ? '🔥 Żywioł' : '🎖️ Ranga'}
                                </label>
                                {selectedTags[category] && <span className="text-[8px] font-black text-red-500 animate-pulse">WEZWANO</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {values.map(val => (
                                    <button key={val} onClick={() => toggleTag(category, val)} className={`tag-button ${selectedTags[category] === val ? 'active' : ''}`}>{val}</button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Opis */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Klątwa Manifestacji (Opis)</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Np. trzygłowy pies, płonące oczy, skrzydła nietoperza..." className="custom-textarea" />
                    <PromptDisplay label="Zapis Rytuału" text={getFullPrompt()} colorClass="text-red-900" />
                </div>

                <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full !py-6 text-base !bg-red-900/20 !border-red-600/40 !text-red-400">
                    💀 PRZYWOŁAJ BESTIĘ
                </DiabloButton>
            </div>

            {/* Wyniki */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 text-[10px] font-black text-stone-700 uppercase tracking-[0.4em]">
                    <div className="flex-1 h-px bg-white/5"></div>
                    Archiwum Bestiariusza
                    <div className="flex-1 h-px bg-white/5"></div>
                </div>

                {results.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-stone-800 rounded-[3rem]">
                        <span className="text-6xl mb-4">💀</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Łańcuchy są puste</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {results.map((res) => (
                            <div key={res.id} className="result-card group">
                                <div className="p-4 flex justify-between items-center bg-black-20-themed border-b border-white/5">
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{res.type}</span>
                                    <button onClick={() => setResults(prev => prev.filter(r => r.id !== res.id))} className="text-stone-600 hover:text-red-500 transition-colors" data-tooltip="Usuń trwale z bestiariusza">✕</button>
                                </div>
                                <div className="relative aspect-square checkerboard-grid m-6 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-black/40">
                                    <img src={res.url} className={`w-full h-full object-contain p-6 transition-all duration-700 ${res.isRemovingBg ? 'scale-90 opacity-40 blur-md' : 'group-hover:scale-110'}`} alt="Generated monster" />
                                    {res.isRemovingBg && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <div className="w-10 h-10 border-4 border-red-500/10 border-t-red-500 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 pt-0 space-y-3">
                                    <div className="flex items-center justify-between bg-black-40-themed rounded-xl p-2 border border-white/5">
                                        <span className="text-[9px] font-black text-stone-600 uppercase ml-2 tracking-widest">Krawędzie</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => modifyEdge(res.id, 1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-red-500 hover:border-red-500 transition-all font-black" data-tooltip="Zwężaj kontur (popraw wycięcie)">-</button>
                                            <button onClick={() => modifyEdge(res.id, -1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-emerald-500 hover:border-emerald-500 transition-all font-black text-[10px]" data-tooltip="Przywróć oryginał">↺</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => downloadImage(res.url, `monster_${res.id}.png`)} className="col-span-2 py-3 rounded-xl bg-red-600/10 border border-red-600/20 text-[10px] font-black uppercase text-red-400 hover:bg-red-600/20 transition-all" data-tooltip="Zapisz obrazek potwora">Pobierz PNG</button>
                                        <button onClick={() => createToken(res.url).then(u => setResults(prev => prev.map(r => r.id === res.id ? { ...r, url: u } : r)))} className="py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[9px] font-black uppercase hover:bg-white/5 transition-all text-white/50" data-tooltip="Stwórz żeton VTT">Token</button>
                                        <button onClick={() => removeBackground(res.url, bgMode === 'green' ? 'green' : 'white').then(u => setResults(prev => prev.map(r => r.id === res.id ? { ...r, url: u } : r)))} className="py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[9px] font-black uppercase hover:bg-white/5 transition-all text-white/50" data-tooltip="Ponów usuwanie tła">Wytnij</button>
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
