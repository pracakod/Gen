import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground, erodeImage, createToken, downloadImage } from '../services/imageProcessing';
import { useStyle } from '../contexts/StyleContext';

const PET_TAGS = {
    diablo: {
        species: ['Kruk', 'Wilk', 'Wąż', 'Pająk', 'Mały Demon', 'Chowaniec'],
        element: ['Cień', 'Ogień', 'Krew', 'Kość', 'Eteryczny'],
        size: ['Malutki', 'Mały', 'Średni']
    },
    cyberpunk: {
        species: ['Dron', 'Robo-kot', 'Robo-pies', 'Hologram', 'Cyber-ptak'],
        element: ['Neonowy', 'Chromowy', 'Zglitchowany', 'Militarny'],
        size: ['Kieszonkowy', 'Kompaktowy', 'Standardowy']
    },
    pixelart: {
        species: ['Duszek', 'Slime', 'Mały Smok', 'Sowa'],
        element: ['Magiczny', 'Jasny', 'Retro', 'Złoty'],
        size: ['8-bit', '16-bit', 'Mini']
    },
    gta: {
        species: ['Rotweiler', 'Pudel', 'Małpka', 'Papuga'],
        element: ['Obroża z kolcami', 'Złoty łańcuch', 'Ubranko', 'Okulary'],
        size: ['Domowy', 'Bojowy', 'Kompaktowy']
    },
    fortnite: {
        species: ['Llama', 'Kurczak', 'Wilczek', 'Żabka'],
        element: ['Tęczowy', 'Mechaniczny', 'Neonowy', 'Epik'],
        size: ['Toy-size', 'Small', 'Cute']
    },
    hades: {
        species: ['Duchowiec', 'Mały Cerber', 'Wąż', 'Olimpijski Ptak'],
        element: ['Ogień', 'Lód', 'Cień', 'Złoto'],
        size: ['Boski', 'Standardowy', 'Esencja']
    },
    tibia: {
        species: ['Panda', 'Bat', 'Bug', 'Cat'],
        element: ['Classic', 'Magic', 'Tibian', 'Rare'],
        size: ['Tiny', 'Small', 'Normal']
    },
    cuphead: {
        species: ['Ryba', 'Ptak', 'Filiżanka', 'Klaun'],
        element: ['Vintage', 'Sepia', 'Inkwell', 'Grainy'],
        size: ['Cartoonish', 'Retro', 'Small']
    }
};

interface Result {
    id: string;
    url: string;
    modelUsed?: string;
    isRemovingBg?: boolean;
    originalUrl?: string;
}

export const PetGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();

    const storageKey = `sanctuary_pets_${currentStyle}`;
    const settingsKey = `sanctuary_pets_settings_${currentStyle}`;

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
        const parts = [currentStyle === 'diablo' ? 'Small companion pet for Diablo 4' : 'small pet companion'];
        Object.values(selectedTags).forEach(v => v && parts.push(v));
        if (prompt) parts.push(prompt);

        // Ulepszony prompt dla przezroczystości
        const bgStr = bgMode === 'transparent' ? 'on pure white background, isolated subject, high contrast' :
            bgMode === 'green' ? 'on neon green background #00FF00' :
                (bgTag || 'themed background');

        return `${parts.join(', ')}, centered, full body shot, masterpiece, best quality, 8k, ${bgStr}, no text, ${styleConfig.artStyle}, ${styleConfig.negative}`;
    };

    const handleGenerate = async () => {
        if (!prompt && Object.keys(selectedTags).length === 0) return;
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
                originalUrl: url
            }, ...prev]);
        } catch (e) {
            setError("Chowaniec nie usłuchał wezwania.");
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
            {/* Panel Główny */}
            <div className="premium-glass p-8 md:p-12 rounded-[3rem] space-y-10 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.4em]">Opiekun Chowańców</label>
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
                                    className={`relative px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${bgMode === mode.id ? 'bg-teal-900/40 text-teal-200' : 'text-stone-600 hover:text-stone-400'}`}
                                    data-tooltip={mode.id === 'transparent' ? 'Automatyczne wycinanie tła' : mode.id === 'green' ? 'Towarzysz na zielonym tle' : 'Towarzysz w wybranym otoczeniu'}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>
                        <div className="h-4 w-px bg-white/10 hidden md:block"></div>
                        <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-black-40-themed border border-white/5 text-stone-500 text-[10px] font-black p-2.5 rounded-xl outline-none cursor-pointer hover:text-stone-300 transition-colors">
                            <option value="free-pollinations">MOC PUSTKI</option>
                            <option value="gemini-2.5-flash-image">GEMINI FLASH</option>
                        </select>
                    </div>
                </div>

                {/* Tagi */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                    {bgMode === 'themed' && (
                        <div className="md:col-span-3 p-6 bg-teal-900/10 rounded-3xl border border-teal-900/20 shadow-inner">
                            <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-4 block flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                                Pielesz Towarzysza
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {styleConfig.backgroundTags.map(tag => (
                                    <button key={tag} onClick={() => setBgTag(bgTag === tag ? '' : tag)} className={`tag-button ${bgTag === tag ? 'active' : ''}`}>{tag}</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(Object.entries(PET_TAGS[currentStyle as keyof typeof PET_TAGS] || PET_TAGS.diablo)).map(([category, values]) => (
                        <div key={category} className="p-6 bg-black-40-themed rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                                    {category === 'species' ? '🐾 Gatunek' : category === 'element' ? '✨ Atrybut' : '⚖️ Rozmiar'}
                                </label>
                                {selectedTags[category] && <span className="text-[8px] font-black text-teal-500 animate-pulse">WYBRANO</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {values.map(val => (
                                    <button key={val} onClick={() => toggleTag(category, val)} className={`tag-button ${selectedTags[category] === val ? 'active' : ''}`}>{val}</button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Wezwanie Towarzysza (Opis)</label>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Np. mały smok, niebieskie futro, urocze oczy..." className="custom-textarea" />
                    <PromptDisplay label="Zapis Opiekuna" text={getFullPrompt()} colorClass="text-teal-900" />
                </div>

                <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full !py-6 text-base !bg-teal-900/20 !border-teal-600/40 !text-teal-400">
                    🐾 PRZYWOŁAJ TOWARZYSZA
                </DiabloButton>
            </div>

            {/* Wyniki */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 text-[10px] font-black text-stone-700 uppercase tracking-[0.4em]">
                    <div className="flex-1 h-px bg-white/5"></div>
                    Adoptowani Przyjaciele
                    <div className="flex-1 h-px bg-white/5"></div>
                </div>

                {results.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-stone-800 rounded-[3rem]">
                        <span className="text-6xl mb-4">🐾</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Nikt nie czeka na adopcję</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {results.map((res) => (
                            <div key={res.id} className="result-card group">
                                <div className="p-4 flex justify-between items-center bg-black-20-themed border-b border-white/5">
                                    <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">Towarzysz</span>
                                    <button onClick={() => setResults(prev => prev.filter(r => r.id !== res.id))} className="text-stone-600 hover:text-red-500 transition-colors" data-tooltip="Usuń towarzysza z listy">✕</button>
                                </div>
                                <div className="relative aspect-square checkerboard-grid m-6 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-black/40">
                                    <img src={res.url} className={`w-full h-full object-contain p-6 transition-all duration-700 ${res.isRemovingBg ? 'scale-90 opacity-40 blur-md' : 'group-hover:scale-110'}`} alt="Generated pet" />
                                    {res.isRemovingBg && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <div className="w-10 h-10 border-4 border-teal-500/10 border-t-teal-500 rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 pt-0 space-y-3">
                                    <div className="flex items-center justify-between bg-black-40-themed rounded-xl p-2 border border-white/5">
                                        <span className="text-[9px] font-black text-stone-600 uppercase ml-2 tracking-widest">Krawędzie</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => modifyEdge(res.id, 1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-teal-500 hover:border-teal-500 transition-all font-black" data-tooltip="Zwężaj kontur (popraw wycięcie)">-</button>
                                            <button onClick={() => modifyEdge(res.id, -1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-emerald-500 hover:border-emerald-500 transition-all font-black text-[10px]" data-tooltip="Przywróć oryginał">↺</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => downloadImage(res.url, `pet_${res.id}.png`)} className="col-span-2 py-3 rounded-xl bg-teal-600/10 border border-teal-600/20 text-[10px] font-black uppercase text-teal-400 hover:bg-teal-600/20 transition-all" data-tooltip="Zapisz chowańca na dysku">Pobierz PNG</button>
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
