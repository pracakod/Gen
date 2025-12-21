import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { useStyle } from '../contexts/StyleContext';
import { removeBackground } from '../services/imageProcessing';

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

    const [loading, setLoading] = useState(false);
    const [currentDirection, setCurrentDirection] = useState<string | null>(null);

    // Pobierz tagi dla aktualnego stylu
    const getCurrentTags = () => {
        if (currentStyle === 'cyberpunk') return TAGS.cyberpunk;
        if (currentStyle === 'pixelart') return TAGS.pixelart;
        return TAGS.diablo;
    };

    // Zapisz ustawienia
    React.useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify({ tags: selectedTags, model, customPrompt }));
    }, [selectedTags, model, customPrompt, settingsKey]);

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

    // Buduj prompt z tagów i własnego tekstu
    const buildPrompt = (directionAngle: string) => {
        const tags = getCurrentTags();
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

        return `${stylePrefix}, ${baseDesc}, ${directionAngle}, full body, centered, single character, ${styleConfig.artStyle}, on solid pure neon green background #00FF00, NO TEXT, ${styleConfig.negative}`;
    };

    // Generuj dla wybranych kierunków
    const handleGenerate = async () => {
        if (selectedDirections.length === 0) return;

        setLoading(true);

        for (const dirId of selectedDirections) {
            const dir = DIRECTIONS.find(d => d.id === dirId);
            if (!dir) continue;

            setCurrentDirection(dirId);
            const prompt = buildPrompt(dir.angle);

            try {
                const { url, modelUsed } = await generateAvatar(prompt, model);
                // Usuń zielone tło
                let finalUrl = url;
                try {
                    finalUrl = await removeBackground(url, 'green');
                } catch (e) { }

                setResults(prev => [
                    { id: `${Date.now()}_${dirId}`, direction: dirId, url: finalUrl, modelUsed },
                    ...prev
                ]);
            } catch (e) {
                console.error(`Błąd generowania ${dirId}:`, e);
            }
        }

        setCurrentDirection(null);
        setLoading(false);
    };

    // Usuń wynik
    const removeResult = (id: string) => {
        setResults(prev => prev.filter(r => r.id !== id));
    };

    // Wyczyść wszystko
    const clearAll = () => {
        setResults([]);
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
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none"
                    >
                        <option value="free-pollinations">🌀 Moc Pustki (Free)</option>
                        <option value="gemini-2.5-flash-image">⚡ Gemini Flash</option>
                    </select>
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

                {/* Wybór kierunków */}
                <div className="mb-6">
                    <label className="text-stone-500 text-[9px] uppercase mb-2 block">Kierunki (kliknij aby wybrać)</label>
                    <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
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
                        Wybrano: {selectedDirections.length} kierunków
                    </p>
                </div>

                {/* Podgląd prompta - dla pierwszego wybranego kierunku */}
                {selectedDirections.length > 0 && (
                    <div className="mb-4 space-y-2">
                        {selectedDirections.slice(0, 3).map(dirId => {
                            const dir = DIRECTIONS.find(d => d.id === dirId);
                            return dir ? (
                                <PromptDisplay
                                    key={dirId}
                                    label={`Prompt dla ${dir.label}`}
                                    text={buildPrompt(dir.angle)}
                                    colorClass="text-amber-900"
                                />
                            ) : null;
                        })}
                        {selectedDirections.length > 3 && (
                            <p className="text-stone-600 text-[8px] text-center">...i {selectedDirections.length - 3} więcej</p>
                        )}
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
            </div>

            {/* Wyniki */}
            {results.length > 0 && (
                <div className="bg-stone-900/90 p-6 border-2 border-stone-800">
                    <h3 className="text-stone-500 text-[10px] uppercase mb-4">Wygenerowane Sprite'y ({results.length})</h3>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                        {results.map(r => (
                            <div key={r.id} className="relative group">
                                <div className="aspect-square bg-black border border-stone-800 overflow-hidden bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)]">
                                    <img src={r.url} alt={r.direction} className="w-full h-full object-contain" />
                                </div>
                                <span className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-center text-stone-400 uppercase">
                                    {r.direction}
                                </span>
                                <button
                                    onClick={() => removeResult(r.id)}
                                    className="absolute top-0 right-0 bg-red-900/80 text-white text-[10px] px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ×
                                </button>
                                <a
                                    href={r.url}
                                    download={`sprite_${currentStyle}_${r.direction}.png`}
                                    className="absolute top-0 left-0 bg-stone-900/80 text-stone-300 text-[8px] px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ↓
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
