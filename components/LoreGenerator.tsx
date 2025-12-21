
import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateLoreStream } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { SYSTEM_LORE_MASTER } from '../services/prompts';

export const LoreGenerator: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [loreType, setLoreType] = useState('Backstory');
    const [loading, setLoading] = useState(false);

    // Persistence
    const [output, setOutput] = useState<string>(() => {
        return localStorage.getItem('sanctuary_lore_output') || '';
    });
    React.useEffect(() => {
        localStorage.setItem('sanctuary_lore_output', output);
    }, [output]);

    const getFullPrompt = () => {
        return `Write a ${loreType} about: ${topic || '[temat]'}.`;
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setOutput('');

        const userPrompt = getFullPrompt();

        try {
            const stream = generateLoreStream(userPrompt, 'gemini-1.5-flash', SYSTEM_LORE_MASTER);
            for await (const chunk of stream) {
                setOutput(prev => prev + chunk);
            }
        } catch (e) {
            setOutput("Ciemność przesłoniła wizję...");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl">
                <label className="font-diablo text-yellow-700 text-[10px] uppercase mb-4 block">Kroniki Horadrimów</label>
                <div className="flex gap-4 mb-4">
                    <input
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="np. Upadły Anioł Inarius..."
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
                    <PromptDisplay label="Pytanie do Kronik" text={getFullPrompt()} colorClass="text-yellow-700" />
                </div>
                <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full">Spisz Kronikę</DiabloButton>
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
                    <div className="mt-4 text-[9px] text-amber-900/40 uppercase not-italic">Wyrocznia: Gemini Flash Text</div>
                </div>
            )}
        </div>
    );
};
