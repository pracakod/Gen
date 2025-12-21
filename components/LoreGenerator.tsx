import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateLoreStream } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { SYSTEM_LORE_MASTER } from '../services/prompts';
import { useStyle } from '../contexts/StyleContext';

export const LoreGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();
    const [topic, setTopic] = useState('');
    const [loreType, setLoreType] = useState('Backstory');
    const [loading, setLoading] = useState(false);

    // Persistence per style
    const storageKey = `sanctuary_lore_${currentStyle}`;
    const settingsKey = `sanctuary_lore_settings_${currentStyle}`;

    const [model, setModel] = useState(() => {
        const saved = localStorage.getItem(settingsKey);
        return saved ? JSON.parse(saved).model ?? 'gemini-1.5-flash' : 'gemini-1.5-flash';
    });

    const [output, setOutput] = useState<string>(() => {
        return localStorage.getItem(storageKey) || '';
    });

    // Save settings
    React.useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify({ model }));
    }, [model, settingsKey]);

    // Save results
    React.useEffect(() => {
        localStorage.setItem(storageKey, output);
    }, [output, storageKey]);

    // Reload when style changes
    React.useEffect(() => {
        setOutput(localStorage.getItem(storageKey) || '');
    }, [currentStyle]);

    const getFullPrompt = () => {
        return `${styleConfig.lorePersona} Napisz ${loreType} w języku polskim na temat: ${topic || '[temat]'}. Używaj terminologii i klimatu pasującego do stylu: ${styleConfig.artStyle}.`;
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setOutput('');

        const userPrompt = getFullPrompt();

        try {
            const stream = generateLoreStream(userPrompt, model, SYSTEM_LORE_MASTER);
            for await (const chunk of stream) {
                setOutput(prev => prev + chunk);
            }
        } catch (e) {
            setOutput("Ciemność przesłoniła wizję...");
        } finally {
            setLoading(false);
        }
    };

    const getLabel = () => styleConfig.tabLabels.lore;
    const getPlaceholder = () => styleConfig.placeholders.lore;
    const getButtonText = () => styleConfig.buttons.lore;

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <label className="font-diablo text-yellow-700 text-[10px] uppercase block">{getLabel()}</label>
                    <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none"
                    >
                        <option value="gemini-1.5-flash">⚡ Gemini Flash (Szybki)</option>
                        <option value="gemini-1.5-pro">🧠 Gemini Pro (Mądry)</option>
                    </select>
                </div>
                <div className="flex gap-4 mb-4">
                    <input
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder={getPlaceholder()}
                        className="flex-1 bg-black border border-stone-800 p-2 text-stone-200 outline-none"
                    />
                    <select
                        value={loreType}
                        onChange={e => setLoreType(e.target.value)}
                        className="bg-black text-stone-400 border border-stone-800 p-2 text-[10px]"
                    >
                        <option value="Backstory">Historia</option>
                        <option value="Description">Opis</option>
                        <option value="Stats">Statystyki RPG</option>
                    </select>
                </div>
                <div className="mb-4">
                    <PromptDisplay label="Pytanie do Wyroczni" text={getFullPrompt()} colorClass="text-yellow-700" />
                </div>
                <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full">{getButtonText()}</DiabloButton>
            </div>

            {output && (
                <div className="bg-amber-900/10 p-6 border border-amber-900/30 text-center font-serif italic text-amber-100/80 leading-relaxed relative group">
                    "{output}"
                    <button
                        onClick={() => setOutput('')}
                        className="absolute top-2 right-2 text-amber-900/50 hover:text-amber-700 text-[10px] uppercase opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Wyczyść
                    </button>
                    <div className="mt-4 text-[9px] text-amber-900/40 uppercase not-italic">Wyrocznia: {model === 'gemini-1.5-pro' ? 'Gemini Pro Text' : 'Gemini Flash Text'}</div>
                </div>
            )}
        </div>
    );
};
