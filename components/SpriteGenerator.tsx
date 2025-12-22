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
    gta: {
        race: ['Człowiek', 'Gangster', 'Biznesmen', 'Agent', 'Biker'],
        class: ['Hacker', 'Snajper', 'Specjaliasta IT', 'Ochroniarz'],
        armor: ['Brak', 'Garnitur', 'Kurtka skórzana', 'Kamizelka'],
        weapon: ['Brak', 'Pistolet', 'Uzi', 'Kij baseballowy', 'Karabin'],
        color: ['Pomarańcz', 'Blue', 'White', 'Black'],
    },
    fortnite: {
        race: ['Bohater', 'Robot', 'Kosmita', 'Zabawka'],
        class: ['Commander', 'Ninja', 'Soldier'],
        armor: ['Default Skin', 'Tactical', 'Futuristic', 'Funky'],
        weapon: ['Assault Rifle', 'Shotgun', 'Pickaxe', 'Sniper'],
        color: ['Epic Purple', 'Rare Blue', 'Legendary Gold'],
    },
    hades: {
        race: ['Bóstwo', 'Duch', 'Cień', 'Szkielet', 'Heros'],
        class: ['Wojownik', 'Posłaniec', 'Strażnik', 'Berserker'],
        armor: ['Toga', 'Złota Zbroja', 'Przepaska'],
        weapon: ['Miecz', 'Włócznia', 'Łuk', 'Tarcza', 'Sztylety'],
        color: ['Blood Red', 'Divine Gold', 'Spectral Blue'],
    },
    tibia: {
        race: ['Human', 'Orc', 'Dwarf', 'Elf', 'Skeleton'],
        class: ['Knight', 'Paladin', 'Sorcerer', 'Druid'],
        armor: ['Leather Set', 'Plate Set', 'Golden Set', 'Demon Set'],
        weapon: ['Sword', 'Axe', 'Mace', 'Staff', 'Crossbow'],
        color: ['Retro RGB', 'Tibia Green'],
    },
    cuphead: {
        race: ['Humanoid', 'Object-head', 'Animal', 'Ghost'],
        class: ['Brawler', 'Trickster', 'Boss'],
        armor: ['Retro Suit', 'Cartoon Dress'],
        weapon: ['Peashooter', 'Gloves', 'Wand', 'Cane'],
        color: ['Vintage Red', 'Classic Blue', 'Old Paper'],
    }
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

    const [bgMode, setBgMode] = useState<'transparent' | 'green' | 'themed'>(() => {
        const saved = localStorage.getItem(settingsKey);
        if (!saved) return 'transparent';
        const parsed = JSON.parse(saved);
        if (parsed.bgMode) return parsed.bgMode;
        return parsed.autoRemoveBg ? 'transparent' : 'green';
    });

    const [bgTag, setBgTag] = useState(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).bgTag ?? '' : '';
    });

    const [loading, setLoading] = useState(false);
    const [currentDirection, setCurrentDirection] = useState<string | null>(null);
    const [gridRows, setGridRows] = useState(3);
    const [gridCols, setGridCols] = useState(3);
    const [animatingFrames, setAnimatingFrames] = useState<string[] | null>(null);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [animationFPS, setAnimationFPS] = useState(10);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Pobierz tagi dla aktualnego stylu
    const getCurrentTags = () => {
        if (currentStyle === 'cyberpunk') return TAGS.cyberpunk;
        if (currentStyle === 'pixelart') return TAGS.pixelart;
        return TAGS.diablo;
    };

    // Zapisz ustawienia
    React.useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify({ tags: selectedTags, model, customPrompt, genMode, bgMode, bgTag }));
    }, [selectedTags, model, customPrompt, genMode, bgMode, bgTag, settingsKey]);

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
        const qualityBoost = "masterpiece, best quality, 8k resolution, ultra detailed, highly detailed, professional game art, perfect anatomy";

        let bgPrompt = "";
        if (bgMode === 'transparent') {
            bgPrompt = "transparent background, no background, isolated subject, PNG with alpha channel, cut out, empty background, no shadows";
        } else if (bgMode === 'green') {
            bgPrompt = "on solid pure neon green background #00FF00, flat color background, no shadows on background";
        } else {
            const bgDesc = bgTag ? `${bgTag} background, ${styleConfig.environment}` : styleConfig.environment;
            bgPrompt = bgDesc;
        }

        if (genMode === 'sheet') {
            const selectedLabels = selectedDirections.map(id => DIRECTIONS.find(d => d.id === id)?.label).join(', ');
            const allInOneNote = "COMPOSITE IMAGE, ALL VIEW ANGLES SHOWN TOGETHER ON ONE SINGLE IMAGE,";
            return `${qualityBoost}, SPRITE SHEET, ${allInOneNote} ${base}, multiple views including: ${selectedLabels}, character shown from different angles in a grid, ${fitInFrame}, ${cleanEdges}, ${styleConfig.artStyle}, ${bgPrompt}, high quality game asset, NO TEXT, ${styleConfig.negative}`;
        }

        return `${qualityBoost}, ${base}, ${directionAngle}, ${fitInFrame}, ${cleanEdges}, single character, ${styleConfig.artStyle}, ${bgPrompt}, NO TEXT, ${styleConfig.negative}`;
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
                if (bgMode === 'transparent') {
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
                    if (bgMode === 'transparent') {
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

    const handlePreviewAnimation = (result: SpriteResult) => {
        // Find all frames that belong to this sheet or are results of a slice
        // If it's a sheet, we might want to slice it first or preview from existing sliced frames
        // Let's assume user wants to preview CURRENTLY visible results that are frames
        const frames = results.filter(r => r.id.startsWith(result.id) && r.id !== result.id).map(r => r.url);
        if (frames.length > 0) {
            setAnimatingFrames(frames);
            setCurrentFrameIndex(0);
        } else {
            // If no frames found, maybe it's a list of single sprites? 
            // Preview all currently visible single sprites
            const allSingles = results.filter(r => r.direction !== 'sheet').map(r => r.url).reverse();
            if (allSingles.length > 0) {
                setAnimatingFrames(allSingles);
                setCurrentFrameIndex(0);
            }
        }
    };

    React.useEffect(() => {
        if (!animatingFrames) return;
        const interval = setInterval(() => {
            setCurrentFrameIndex(prev => (prev + 1) % animatingFrames.length);
        }, 1000 / animationFPS);
        return () => clearInterval(interval);
    }, [animatingFrames, animationFPS]);

    const handleSlice = async (result: SpriteResult, mode: 'grid' | 'smart') => {
        try {
            setLoading(true);
            let frames: string[] = [];

            if (mode === 'grid') {
                frames = await sliceSpriteSheet(result.url, gridRows, gridCols);
            } else {
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

    const handleRemoveBg = async (id: string) => {
        setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
        const item = results.find(r => r.id === id);
        if (!item) return;
        try {
            // Spróbuj usunąć tło na podstawie ustawienia autoRemoveBg, 
            // ale jeśli to arkusz, preferuj inteligentne usunięcie czarnego tła lub bieli
            const mode = bgMode === 'transparent' ? 'white' : 'green';
            const newUrl = await removeBackground(item.url, mode);
            setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false, originalUrl: item.url } : r));
        } catch (e) {
            setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
        }
    };

    const undoRemoveBg = (id: string) => {
        setResults(prev => prev.map(r => r.id === id && r.originalUrl ? { ...r, url: r.originalUrl, originalUrl: undefined } : r));
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target?.result as string;
                setResults(prev => [{
                    id: `upload_${Date.now()}_${Math.random()}`,
                    direction: file.name.replace(/\.[^/.]+$/, ""), // Name without extension
                    url: url,
                    modelUsed: 'Wgrany Plik'
                }, ...prev]);
            };
            reader.readAsDataURL(file);
        });
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
        return `${styleConfig.buttons.generate} Sprite Sheets`;
    };

    const getLabelForStyle = () => {
        return `${styleConfig.name} Sprite Generator`;
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
                        <div className="flex bg-black/40 border border-stone-800 p-0.5 rounded overflow-hidden">
                            {[
                                { id: 'transparent', label: 'Przezroczyste', color: 'emerald' },
                                { id: 'green', label: 'Zielone', color: 'green' },
                                { id: 'themed', label: 'Tematyczne', color: 'amber' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setBgMode(mode.id as any)}
                                    className={`px-2 py-1 text-[8px] uppercase font-serif transition-all ${bgMode === mode.id
                                        ? `bg-${mode.color}-900/40 text-${mode.color}-400`
                                        : 'text-stone-600 hover:text-stone-400'
                                        }`}
                                >
                                    {mode.label}
                                </button>
                            ))}
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

                {bgMode === 'themed' && (
                    <div className="mb-6 p-4 bg-black/40 border border-amber-900/30 rounded animate-fade-in">
                        <label className="text-amber-800 text-[9px] uppercase mb-2 block font-diablo tracking-widest">Obierz Scenerię</label>
                        <div className="flex flex-wrap gap-1.5">
                            {styleConfig.backgroundTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setBgTag(bgTag === tag ? '' : tag)}
                                    className={`px-2 py-1 text-[10px] border transition-all ${bgTag === tag
                                        ? 'bg-amber-900/40 border-amber-600 text-amber-200 shadow-[0_0_10px_rgba(120,53,15,0.2)]'
                                        : 'bg-black border-stone-800 text-stone-500 hover:border-stone-600'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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
                                    ? `+ SPRITE SHEET, grid of views (${selectedDirections.length}), ${bgMode === 'transparent' ? 'white bg' : bgMode === 'green' ? 'neon green bg' : 'themed bg'}...`
                                    : `+ [Kierunek], full body, centered, ${styleConfig.artStyle}, ${bgMode === 'transparent' ? 'white bg' : bgMode === 'green' ? 'neon green bg' : 'themed bg'}...`
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

                <div className="mt-4 pt-4 border-t border-stone-800 space-y-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-stone-500 uppercase">Wymiary siatki (Wiersze x Kolumny)</span>
                        <div className="flex gap-2">
                            <select
                                value={gridRows}
                                onChange={(e) => setGridRows(Number(e.target.value))}
                                className="flex-1 bg-stone-900 text-stone-300 text-[10px] border border-stone-800 p-1"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} wierszy</option>)}
                            </select>
                            <select
                                value={gridCols}
                                onChange={(e) => setGridCols(Number(e.target.value))}
                                className="flex-1 bg-stone-900 text-stone-300 text-[10px] border border-stone-800 p-1"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} kolumn</option>)}
                            </select>
                        </div>
                    </div>

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
                            multiple
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-stone-800 text-stone-300 text-[9px] uppercase py-2 hover:bg-stone-700 transition-colors"
                        >
                            📂 Wgraj własny arkusz / obrazek
                        </button>
                    </div>
                </div>
            </div>

            {/* Wyniki */}
            {results.length > 0 && (
                <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl">
                    <h3 className="text-stone-500 text-[10px] uppercase mb-4">Wygenerowane Sprite'y ({results.length})</h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {results.map(r => (
                            <div key={r.id} className="relative group flex flex-col gap-1 bg-stone-900/40 p-1 border border-stone-800/50 hover:border-amber-900/50 transition-colors">
                                <div className="aspect-square bg-black border border-stone-800 overflow-hidden bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)] shadow-inner">
                                    <img src={r.url} alt={r.direction} className={`w-full h-full object-contain transition-opacity ${r.isRemovingBg ? 'opacity-30' : 'opacity-100'}`} />

                                    {/* Opcje dla arkuszy (generowanych i wgranych) oraz obrazków nie będących klatkami */}
                                    {(r.direction === 'sheet' || r.id.startsWith('upload')) && !r.isRemovingBg && (
                                        <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 z-20">
                                            <div className="text-[7px] text-amber-500 uppercase font-bold mb-1">Opcje Arkusza</div>
                                            <button
                                                onClick={() => handleSlice(r, 'grid')}
                                                className="w-full bg-amber-900/80 text-white text-[9px] py-1 uppercase font-bold hover:bg-amber-800 shadow-lg"
                                            >
                                                Siatka {gridRows}x{gridCols}
                                            </button>
                                            <button
                                                onClick={() => handleSlice(r, 'smart')}
                                                className="w-full bg-blue-900/80 text-white text-[9px] py-1 uppercase font-bold hover:bg-blue-800"
                                            >
                                                Inteligentne
                                            </button>
                                            <button
                                                onClick={() => handlePreviewAnimation(r)}
                                                className="w-full bg-emerald-900/80 text-white text-[9px] py-1 uppercase font-bold hover:bg-emerald-800"
                                            >
                                                ▶ Animuj Wszystkie
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1 px-1 pb-1">
                                    <span className="text-[7px] text-center text-stone-500 uppercase truncate">
                                        {r.direction}
                                    </span>
                                    <div className="flex gap-1">
                                        {r.originalUrl ? (
                                            <button
                                                onClick={() => undoRemoveBg(r.id)}
                                                className="flex-1 bg-amber-900/30 text-amber-500 text-[8px] py-1 border border-amber-900/30 hover:bg-amber-900/50"
                                            >
                                                Cofnij
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRemoveBg(r.id)}
                                                disabled={r.isRemovingBg}
                                                className="flex-1 bg-stone-900 text-stone-400 text-[8px] py-1 border border-stone-800 hover:text-white disabled:opacity-50"
                                                title="Usuń tło (Białe/Zielone zależnie od ustawień)"
                                            >
                                                Wytnij
                                            </button>
                                        )}
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
                                    className="absolute -top-2 -right-2 bg-red-900 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-red-800 shadow-lg hover:bg-red-700"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Modal Animacji */}
            {animatingFrames && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
                    <div className="bg-stone-900 border-2 border-amber-900/50 p-8 relative max-w-lg w-full flex flex-col items-center shadow-[0_0_50px_rgba(120,53,15,0.3)]">
                        <button
                            onClick={() => setAnimatingFrames(null)}
                            className="absolute top-2 right-2 text-stone-500 hover:text-white text-2xl transition-colors"
                        >
                            ×
                        </button>
                        <h2 className="font-diablo text-amber-500 text-lg mb-6 uppercase tracking-widest">Podgląd Animacji</h2>
                        <div className="aspect-square w-64 bg-black border border-stone-800 flex items-center justify-center overflow-hidden bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)] shadow-inner">
                            <img
                                src={animatingFrames[currentFrameIndex]}
                                alt="Animacja"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <p className="mt-4 text-stone-500 text-[10px] uppercase tracking-widest font-serif">
                            Klatka {currentFrameIndex + 1} z {animatingFrames.length}
                        </p>

                        <div className="mt-6 w-full flex flex-col items-center gap-2">
                            <label className="text-amber-600 text-[9px] uppercase font-serif tracking-widest">
                                Szybkość Duchów: {animationFPS} FPS
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={animationFPS}
                                onChange={(e) => setAnimationFPS(parseInt(e.target.value))}
                                className="w-full h-1 bg-stone-800 appearance-none cursor-pointer accent-amber-600 rounded-lg"
                            />
                            <div className="flex justify-between w-full text-[8px] text-stone-600 uppercase font-serif px-1">
                                <span>Powoli</span>
                                <span>Błyskawicznie</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setAnimatingFrames(null)}
                            className="mt-8 px-8 py-2 bg-amber-900/40 text-amber-200 border border-amber-900/50 hover:bg-amber-900/60 transition-all uppercase text-[10px] tracking-widest font-bold"
                        >
                            Zamknij portal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
