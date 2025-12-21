import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { useStyle } from '../contexts/StyleContext';
import { removeBackground, sliceSpriteSheet, downloadImage, detectFrames } from '../services/imageProcessing';

// Kierunki
const DIRECTIONS = [
    { id: 'n', label: '↑ N', angle: 'facing north, back view' },
    { id: 'ne', label: '↗ NE', angle: 'facing northeast, back-right view' },
    { id: 'e', label: '→ E', angle: 'facing east, right side view' },
    { id: 'se', label: '↘ SE', angle: 'facing southeast, front-right view' },
    { id: 's', label: '↓ S', angle: 'facing south, front view' },
    { id: 'sw', label: '↙ SW', angle: 'facing southwest, front-left view' },
    { id: 'w', label: '← W', angle: 'facing west, left side view' },
    { id: 'nw', label: '↖ NW', angle: 'facing northwest, back-left view' },
];

// System tagów per styl
const TAGS = {
    diablo: {
        race: ['Człowiek', 'Nieumarły', 'Demon', 'Anioł', 'Druid'],
        class: ['Barbarzyńca', 'Nekromanta', 'Czarownica', 'Łotrzyk', 'Druid', 'Paladyn'],
        armor: ['Brak', 'Szmaty', 'Skóra', 'Kolczuga', 'Płytowa'],
        weapon: ['Brak', 'Miecz', 'Topór', 'Kosa', 'Laska', 'Łuk'],
        color: ['Czerwony', 'Czarny', 'Złoty', 'Fioletowy', 'Zielony'],
    },
    cyberpunk: {
        race: ['Człowiek', 'Cyborg', 'Android', 'Mutant', 'Hybrid'],
        class: ['Netrunner', 'Solo', 'Techie', 'Fixer', 'Rockerboy', 'Nomad'],
        armor: ['Brak', 'Kurtka', 'Kamizelka taktyczna', 'Pancerz bojowy', 'Exoszkielet'],
        weapon: ['Brak', 'Pistolet', 'Karabin', 'Katana', 'Mantis Blades', 'Tech Weapon'],
        color: ['Neon różowy', 'Cyan', 'Żółty', 'Fioletowy', 'Chromowany'],
    },
    pixelart: {
        race: ['Człowiek', 'Elf', 'Krasnolud', 'Goblin', 'Szkielet'],
        class: ['Rycerz', 'Mag', 'Łucznik', 'Złodziej', 'Kapłan', 'Berserker'],
        armor: ['Brak', 'Szaty', 'Lekka', 'Średnia', 'Ciężka'],
        weapon: ['Brak', 'Miecz', 'Łuk', 'Laska', 'Sztylet', 'Młot'],
        color: ['Niebieski', 'Czerwony', 'Zielony', 'Złoty', 'Srebrny'],
    },
};

interface SpriteResult {
    id: string;
    direction: string;
    url: string;
    modelUsed?: string;
    isRemovingBg?: boolean;
    originalUrl?: string;
}

export const SpriteGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();

    // Storage per style
    const storageKey = `sanctuary_sprites_${currentStyle}`;
    const settingsKey = `sanctuary_sprites_settings_${currentStyle}`;

    // Stan tagów
    const [selectedTags, setSelectedTags] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).tags ?? {} : {};
    });

    // Własny prompt tekstowy
    const [customPrompt, setCustomPrompt] = useState(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).customPrompt ?? '' : '';
    });

    // Kierunki do wygenerowania
    const [selectedDirections, setSelectedDirections] = useState<string[]>(['s']);

    // Model AI
    const [model, setModel] = useState(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).model ?? 'free-pollinations' : 'free-pollinations';
    });

    // Wyniki
    const [results, setResults] = useState<SpriteResult[]>(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    });

    // Tryb generowania: 'single' (osobno) lub 'sheet' (wszystko na jednym)
    const [genMode, setGenMode] = useState<'single' | 'sheet'>(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).genMode ?? 'single' : 'single';
    });

    const [autoRemoveBg, setAutoRemoveBg] = useState(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).autoRemoveBg ?? false : false;
    });

    const [loading, setLoading] = useState(false);
    const [currentDirection, setCurrentDirection] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Pobierz tagi dla aktualnego stylu
    const getCurrentTags = () => {
        if (currentStyle === 'cyberpunk') return TAGS.cyberpunk;
        if (currentStyle === 'pixelart') return TAGS.pixelart;
        return TAGS.diablo;
    };

    // Zapisz ustawienia
    React.useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify({ tags: selectedTags, model, customPrompt, genMode, autoRemoveBg }));
    }, [selectedTags, model, customPrompt, genMode, autoRemoveBg, settingsKey]);

    // Zapisz wyniki
    React.useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(results));
    }, [results, storageKey]);

    // Reload przy zmianie stylu
    React.useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        setResults(saved ? JSON.parse(saved) : []);
        const settings = localStorage.getItem(settingsKey);
        setSelectedTags(settings ? JSON.parse(settings).tags ?? {} : {});
    }, [currentStyle]);

    // Toggle tag
    const toggleTag = (category: string, value: string) => {
        setSelectedTags(prev => ({
            ...prev,
            [category]: prev[category] === value ? '' : value
        }));
    };

    // Toggle kierunek
    const toggleDirection = (dirId: string) => {
        setSelectedDirections(prev =>
            prev.includes(dirId)
                ? prev.filter(d => d !== dirId)
                : [...prev, dirId]
        );
    };

    const selectAllDirections = () => {
        setSelectedDirections(DIRECTIONS.map(d => d.id));
    };

    // Buduj bazową część promptu (bez kierunku)
    const getBasePrompt = () => {
        const parts: string[] = [];

        // Jeśli jest własny prompt, użyj go jako bazy
        if (customPrompt.trim()) {
            parts.push(customPrompt.trim());
        } else {
            // W przeciwnym razie użyj tagów
            if (selectedTags.race) parts.push(selectedTags.race);
            if (selectedTags.class) parts.push(selectedTags.class);
            if (selectedTags.armor && selectedTags.armor !== 'Brak') parts.push(`${selectedTags.armor} armor`);
            if (selectedTags.weapon && selectedTags.weapon !== 'Brak') parts.push(`holding ${selectedTags.weapon}`);
            if (selectedTags.color) parts.push(`${selectedTags.color} color scheme`);
        }

        const baseDesc = parts.length > 0 ? parts.join(', ') : 'warrior character';

        const stylePrefix = currentStyle === 'cyberpunk'
            ? '2D game sprite, cyberpunk style, top-down RPG'
            : currentStyle === 'pixelart'
                ? '16-bit pixel art sprite, retro game style, top-down view'
                : '2D game sprite, dark fantasy style, top-down RPG';

        return `${stylePrefix}, ${baseDesc}`;
    };

    // Buduj pełny prompt dla konkretnego kierunku lub arkusza
    const buildPrompt = (directionAngle: string) => {
        const base = getBasePrompt();
        const fitInFrame = "entire character must be fully visible and centered in frame, not cut off, whole body shown";
        const cleanEdges = "clean sharp edges, NO FOG, NO PARTICLES, NO BLOOM, NO SMOKE, NO VOLUMETRIC LIGHTING, high contrast between character and background";

        const bgPrompt = autoRemoveBg
            ? "on pure white background, isolated on white, cut out, empty background, no shadows on background"
            : "on solid pure neon green background #00FF00, flat color background, no shadows on background";

        if (genMode === 'sheet') {
            const selectedLabels = selectedDirections.map(id => DIRECTIONS.find(d => d.id === id)?.label).join(', ');
            const allInOneNote = "COMPOSITE IMAGE, ALL VIEW ANGLES SHOWN TOGETHER ON ONE SINGLE IMAGE,";
            return `SPRITE SHEET, ${allInOneNote} ${base}, multiple views including: ${selectedLabels}, character shown from different angles in a grid, ${fitInFrame}, ${cleanEdges}, ${styleConfig.artStyle}, ${bgPrompt}, high quality game asset, NO TEXT, ${styleConfig.negative}`;
        }

        return `${base}, ${directionAngle}, ${fitInFrame}, ${cleanEdges}, single character, ${styleConfig.artStyle}, ${bgPrompt}, NO TEXT, ${styleConfig.negative}`;
    };

    // Generuj
    const handleGenerate = async () => {
        if (selectedDirections.length === 0) return;

        setLoading(true);

        if (genMode === 'sheet') {
            const prompt = buildPrompt('');
            setCurrentDirection('arkusz');

            try {
                const { url, modelUsed } = await generateAvatar(prompt, model);
                let finalUrl = url;
                if (autoRemoveBg) {
                    try {
                        finalUrl = await removeBackground(url, 'white');
                    } catch (e) { }
                }

                setResults(prev => [
                    { id: `${Date.now()}_sheet`, direction: 'sheet', url: finalUrl, modelUsed },
                    ...prev
                ]);
            } catch (e) {
                console.error("Błąd generowania arkusza:", e);
            }
        } else {
            for (const dirId of selectedDirections) {
                const dir = DIRECTIONS.find(d => d.id === dirId);
                if (!dir) continue;

                setCurrentDirection(dirId);
                const prompt = buildPrompt(dir.angle);

                try {
                    const { url, modelUsed } = await generateAvatar(prompt, model);
                    let finalUrl = url;
                    if (autoRemoveBg) {
                        try {
                            finalUrl = await removeBackground(url, 'white');
                        } catch (e) { }
                    }

                    setResults(prev => [
                        { id: `${Date.now()}_${dirId}`, direction: dirId, url: finalUrl, modelUsed },
                        ...prev
                    ]);
                } catch (e) {
                    console.error(`Błąd generowania ${dirId}:`, e);
                }
            }
        }

        setCurrentDirection(null);
        setLoading(false);
    };

    // Usuń wynik
    const removeResult = (id: string) => {
        setResults(prev => prev.filter(r => r.id !== id));
    };

    const handleSlice = async (result: SpriteResult, mode: 'grid' | 'smart') => {
        try {
            setLoading(true);
            let frames: string[] = [];

            if (mode === 'grid') {
                frames = await sliceSpriteSheet(result.url, 3, 3);
            } else {
                // Smart mode: first remove background to get transparency, then detect islands
                // (Assumes current background removal is already applied or we apply it temporarily)
                frames = await detectFrames(result.url);
            }

            setResults(prev => [
                ...frames.map((f, i) => ({
                    id: `${result.id}_f${i}_${Date.now()}`,
                    direction: mode === 'smart' ? `smart_${i + 1}` : `frame_${i + 1}`,
                    url: f,
                    modelUsed: result.modelUsed
                })),
                ...prev
            ]);
        } catch (e) {
            console.error("Błąd cięcia:", e);
        } finally {
            setLoading(false);
        }
    };

    const removeBlackBg = async (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
        const item = results.find(r => r.id === id);
        if (!item) return;
        try {
            const newUrl = await removeBackground(item.url, 'black');
            setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false, originalUrl: item.url } : r));
        } catch (e) {
            setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            setResults(prev => [{
                id: `upload_${Date.now()}`,
                direction: 'sheet',
                url: url,
                modelUsed: 'Wgrany Plik'
            }, ...prev]);
        };
        reader.readAsDataURL(file);
    };

    // Wyczyść wszystko
    const clearAll = () => {
        setResults([]);
    };

    // Obługa pobierania (rozwiązuje problem cross-origin)
    const handleDownload = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error("Błąd pobierania:", e);
            // Fallback do starej metody jeśli fetch zawiedzie
            window.open(url, '_blank');
        }
    };

    // Pobierz tekst przycisku
    const getButtonText = () => {
        if (currentStyle === 'cyberpunk') return 'Generuj Sprite';
        if (currentStyle === 'pixelart') return 'Renderuj Pixel Art';
        return 'Stwórz Sprite';
    };

    // Placeholdery per styl
    const getLabelForStyle = () => {
        if (currentStyle === 'cyberpunk') return 'Cyberpunk Sprite Generator';
        if (currentStyle === 'pixelart') return 'Pixel Art Sprite Generator';
        return 'Dark Fantasy Sprite Generator';
    };

    const tags = getCurrentTags();

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <label className="font-diablo text-amber-500 text-[10px] uppercase block">
                        {getLabelForStyle()}
                    </label>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="autoTransparentSprite"
                                checked={autoRemoveBg}
                                onChange={(e) => setAutoRemoveBg(e.target.checked)}
                                className="accent-emerald-600 cursor-pointer"
                            />
                            <label htmlFor="autoTransparentSprite" className="text-emerald-500 text-[9px] uppercase font-serif cursor-pointer hover:text-emerald-400">
                                Przezroczyste Tło
                            </label>
                        </div>
                        <select
                            value={genMode}
                            onChange={(e) => setGenMode(e.target.value as 'single' | 'sheet')}
                            className="bg-black text-amber-600 text-[10px] p-2 border border-amber-900 outline-none"
                        >
                            <option value="single">Osobne Obrazy</option>
                            <option value="sheet">Jeden Arkusz (Sprite Sheet)</option>
                        </select>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none"
                        >
                            <option value="free-pollinations">🌀 Moc Pustki (Free)</option>
                            <option value="gemini-2.5-flash-image">⚡ Gemini Flash</option>
                        </select>
                    </div>
                </div>

                {/* Własny Prompt */}
                <div className="mb-6">
                    <label className="text-stone-500 text-[9px] uppercase mb-2 block">Własny Opis (opcjonalnie - zastępuje tagi)</label>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder={currentStyle === 'cyberpunk' ? 'np. Netrunner z czerwonymi implantami...' : currentStyle === 'pixelart' ? 'np. Rycerz z ognistym mieczem...' : 'np. Nekromanta w płonącej szacie...'}
                        className="w-full bg-black border border-stone-800 p-3 text-stone-200 outline-none focus:border-amber-900 min-h-[60px] text-[11px]"
                    />
                    {customPrompt && (
                        <p className="text-amber-600 text-[8px] mt-1">Używam własnego opisu (tagi zignorowane)</p>
                    )}
                </div>

                {/* System Tagów */}
                <div className="space-y-4 mb-6">
                    {/* Rasa */}
                    <div>
                        <label className="text-stone-500 text-[9px] uppercase mb-2 block">Rasa / Typ</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.race.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag('race', tag)}
                                    className={`px-3 py-1 text-[10px] border transition-all ${selectedTags.race === tag
                                        ? 'bg-amber-900/50 border-amber-600 text-amber-300'
                                        : 'bg-black border-stone-700 text-stone-400 hover:border-stone-500'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Klasa */}
                    <div>
                        <label className="text-stone-500 text-[9px] uppercase mb-2 block">Klasa</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.class.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag('class', tag)}
                                    className={`px-3 py-1 text-[10px] border transition-all ${selectedTags.class === tag
                                        ? 'bg-red-900/50 border-red-600 text-red-300'
                                        : 'bg-black border-stone-700 text-stone-400 hover:border-stone-500'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Zbroja */}
                    <div>
                        <label className="text-stone-500 text-[9px] uppercase mb-2 block">Zbroja</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.armor.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag('armor', tag)}
                                    className={`px-3 py-1 text-[10px] border transition-all ${selectedTags.armor === tag
                                        ? 'bg-blue-900/50 border-blue-600 text-blue-300'
                                        : 'bg-black border-stone-700 text-stone-400 hover:border-stone-500'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Broń */}
                    <div>
                        <label className="text-stone-500 text-[9px] uppercase mb-2 block">Broń</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.weapon.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag('weapon', tag)}
                                    className={`px-3 py-1 text-[10px] border transition-all ${selectedTags.weapon === tag
                                        ? 'bg-green-900/50 border-green-600 text-green-300'
                                        : 'bg-black border-stone-700 text-stone-400 hover:border-stone-500'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kolor */}
                    <div>
                        <label className="text-stone-500 text-[9px] uppercase mb-2 block">Kolorystyka</label>
                        <div className="flex flex-wrap gap-2">
                            {tags.color.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag('color', tag)}
                                    className={`px-3 py-1 text-[10px] border transition-all ${selectedTags.color === tag
                                        ? 'bg-purple-900/50 border-purple-600 text-purple-300'
                                        : 'bg-black border-stone-700 text-stone-400 hover:border-stone-500'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Wybór kierunków i Główny Prompt */}
                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-stone-500 text-[9px] uppercase block">Kierunki (kliknij aby wybrać)</label>
                            <button
                                onClick={selectAllDirections}
                                className="text-amber-600 text-[8px] uppercase border border-amber-900/30 px-2 py-0.5 hover:bg-amber-900/20 transition-colors"
                            >
                                Zaznacz wszystkie
                            </button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-4 gap-1">
                            {DIRECTIONS.map(dir => (
                                <button
                                    key={dir.id}
                                    onClick={() => toggleDirection(dir.id)}
                                    className={`p-2 text-[12px] border transition-all ${selectedDirections.includes(dir.id)
                                        ? 'bg-amber-900/50 border-amber-600 text-amber-300'
                                        : 'bg-black border-stone-700 text-stone-500 hover:border-stone-500'
                                        }`}
                                    title={dir.angle}
                                >
                                    {dir.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-stone-600 text-[8px] text-center mt-2">
                            Wybrano: {selectedDirections.length} kierunków {selectedDirections.length === DIRECTIONS.length && "(Wszystkie)"}
                        </p>
                    </div>

                    <div className="flex-1 bg-black/40 border border-stone-800 p-3">
                        <label className="text-amber-700 text-[9px] uppercase mb-2 block">Główny Prompt (Wspólny)</label>
                        <div className="text-[10px] text-stone-400 font-serif leading-tight italic">
                            {getBasePrompt()}
                        </div>
                        <div className="mt-2 pt-2 border-t border-stone-800/50">
                            <p className="text-[8px] text-stone-600 uppercase">Dodatki techniczne:</p>
                            <p className="text-[8px] text-stone-700 font-mono">
                                {genMode === 'sheet'
                                    ? `+ SPRITE SHEET, grid of views (${selectedDirections.length}), ${autoRemoveBg ? 'white bg' : 'neon green bg'}...`
                                    : `+ [Kierunek], full body, centered, ${styleConfig.artStyle}, ${autoRemoveBg ? 'white bg' : 'neon green bg'}...`
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Skrócony podgląd kierunkowy */}
                {selectedDirections.length > 0 && genMode === 'single' && (
                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedDirections.slice(0, 4).map(dirId => {
                            const dir = DIRECTIONS.find(d => d.id === dirId);
                            return dir ? (
                                <div key={dirId} className="bg-stone-950 p-2 border border-stone-900 flex justify-between items-center">
                                    <span className="text-amber-600 text-[10px] font-diablo">{dir.label}</span>
                                    <span className="text-stone-600 text-[8px] truncate ml-4 italic">{dir.angle}</span>
                                </div>
                            ) : null;
                        })}
                        {selectedDirections.length > 4 && (
                            <div className="sm:col-span-2 text-stone-600 text-[8px] text-center">
                                ...i {selectedDirections.length - 4} więcej kierunków
                            </div>
                        )}
                    </div>
                )}

                {/* Podgląd dla arkusza */}
                {selectedDirections.length > 0 && genMode === 'sheet' && (
                    <div className="mb-4 p-2 bg-amber-900/10 border border-amber-900/30">
                        <p className="text-[9px] text-amber-500 uppercase mb-1">Pełny prompt arkusza:</p>
                        <p className="text-[10px] text-stone-400 italic font-serif leading-tight">
                            {buildPrompt('')}
                        </p>
                    </div>
                )}

                {/* Przycisk generowania */}
                <DiabloButton
                    onClick={handleGenerate}
                    isLoading={loading}
                    className="w-full"
                >
                    {loading && currentDirection ? `Generuję ${currentDirection.toUpperCase()}...` : getButtonText()}
                </DiabloButton>

                {results.length > 0 && (
                    <button
                        onClick={clearAll}
                        className="w-full mt-2 text-red-900 text-[9px] uppercase py-1 border border-red-900/30 hover:bg-red-900/20"
                    >
                        Wyczyść wszystko
                    </button>
                )}

                <div className="mt-4 pt-4 border-t border-stone-800">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-stone-800 text-stone-300 text-[9px] uppercase py-2 hover:bg-stone-700 transition-colors"
                    >
                        📂 Wgraj własny arkusz / obrazek
                    </button>
                </div>
            </div>

            {/* Wyniki */}
            {results.length > 0 && (
                <div className="bg-stone-900/90 p-6 border-2 border-stone-800">
                    <h3 className="text-stone-500 text-[10px] uppercase mb-4">Wygenerowane Sprite'y ({results.length})</h3>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {results.map(r => (
                            <div key={r.id} className="relative group flex flex-col gap-1">
                                <div className="aspect-square bg-black border border-stone-800 overflow-hidden bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)]">
                                    <img src={r.url} alt={r.direction} className={`w-full h-full object-contain transition-opacity ${r.isRemovingBg ? 'opacity-30' : 'opacity-100'}`} />

                                    {r.direction === 'sheet' && !r.isRemovingBg && (
                                        <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                            <button
                                                onClick={() => handleSlice(r, 'grid')}
                                                className="w-full bg-amber-900/80 text-white text-[9px] py-1 uppercase font-bold hover:bg-amber-800"
                                            >
                                                Siatka 3x3
                                            </button>
                                            <button
                                                onClick={() => handleSlice(r, 'smart')}
                                                className="w-full bg-blue-900/80 text-white text-[9px] py-1 uppercase font-bold hover:bg-blue-800"
                                            >
                                                Inteligentne
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 px-1 pb-1">
                                    <span className="text-[7px] text-center text-stone-500 uppercase truncate">
                                        {r.direction}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => removeBlackBg(r.id)}
                                            disabled={r.isRemovingBg}
                                            className="flex-1 bg-stone-900 text-stone-400 text-[8px] py-1 border border-stone-800 hover:text-white disabled:opacity-50"
                                            title="Usuń czarne tło"
                                        >
                                            Wytnij
                                        </button>
                                        <button
                                            onClick={() => downloadImage(r.url, `sprite_${r.direction}.png`)}
                                            className="flex-1 bg-stone-900 text-stone-400 text-[8px] py-1 border border-stone-800 hover:text-white"
                                            title="Pobierz PNG"
                                        >
                                            Zapisz
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeResult(r.id)}
                                    className="absolute top-0 right-0 bg-red-900/80 text-white text-[10px] px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
