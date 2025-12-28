import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateLoreStream } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { SYSTEM_LORE_MASTER } from '../services/prompts';
import { useStyle } from '../contexts/StyleContext';

export const LoreGenerator: React.FC = () => {
    const { styleConfig, currentStyle } = useStyle();
    const [topic, setTopic] = useState(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).topic ?? '' : '';
        } catch { return ''; }
    });
    const [loreType, setLoreType] = useState('Backstory');
    const [loading, setLoading] = useState(false);

    const storageKey = `sanctuary_lore_${currentStyle}`;
    const settingsKey = `sanctuary_lore_settings_${currentStyle}`;

    const [model, setModel] = useState(() => {
        try {
            const saved = localStorage.getItem(settingsKey);
            return saved ? JSON.parse(saved).model ?? 'gemini-1.5-flash' : 'gemini-1.5-flash';
        } catch { return 'gemini-1.5-flash'; }
    });

    const [output, setOutput] = useState<string>(() => {
        return localStorage.getItem(storageKey) || '';
    });

    React.useEffect(() => {
        localStorage.setItem(settingsKey, JSON.stringify({ model, topic }));
    }, [model, topic, settingsKey]);

    React.useEffect(() => {
        localStorage.setItem(storageKey, output);
    }, [output, storageKey]);

    React.useEffect(() => {
        const savedOutput = localStorage.getItem(storageKey);
        setOutput(savedOutput || '');

        const savedSettings = localStorage.getItem(settingsKey);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setModel(parsed.model || 'gemini-1.5-flash');
                setTopic(parsed.topic || '');
            } catch {
                setModel('gemini-1.5-flash');
                setTopic('');
            }
        } else {
            setModel('gemini-1.5-flash');
            setTopic('');
        }
    }, [currentStyle, storageKey, settingsKey]);

    const getFullPrompt = () => {
        return `${styleConfig.lorePersona} Napisz ${loreType} w języku polskim na temat: ${topic || '[temat]'}. Używaj terminologii i klimatu pasującego do stylu: ${currentStyle}.`;
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setOutput('');

        try {
            const stream = generateLoreStream(getFullPrompt(), model, SYSTEM_LORE_MASTER);
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
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in p-4 transition-colors duration-500">
            <div className="premium-glass p-8 md:p-12 rounded-[3rem] space-y-8 relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.4em]">Kronika Przeznaczenia</label>
                    <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        className="bg-black-40-themed border border-white/5 text-stone-500 text-[10px] font-black p-2.5 rounded-xl outline-none cursor-pointer hover:text-stone-300 transition-colors"
                        data-tooltip="Model AI: FLASH jest szybki, PRO jest mądrzejszy i bardziej szczegółowy"
                    >
                        <option value="gemini-1.5-flash">GEMINI FLASH</option>
                        <option value="gemini-1.5-pro">GEMINI PRO</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="O czym ma być opowieść?" className="md:col-span-3 custom-textarea !min-h-0" />
                    <select value={loreType} onChange={e => setLoreType(e.target.value)} className="bg-black-40-themed border border-white/5 rounded-xl px-4 py-2 text-[11px] font-black uppercase outline-none hover:border-amber-500/30 transition-all transition-colors" data-tooltip="Wybierz format tekstu: opowieść, krótki opis lub tabela statystyk">
                        <option value="Backstory">📜 Historia</option>
                        <option value="Description">📑 Opis</option>
                        <option value="Stats">📊 Statystyki</option>
                    </select>
                </div>

                <div className="space-y-4">
                    <PromptDisplay label="Pytanie do Wyroczni" text={getFullPrompt()} colorClass="text-amber-700" />
                </div>

                <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full !py-6 text-base !bg-amber-900/10 !border-amber-600/30 !text-amber-500">
                    📜 SPIERZ HISTORIĘ
                </DiabloButton>
            </div>

            {output && (
                <div className={`${currentStyle === 'diablo' && 'font-serif'} bg-black-20-themed relative group animate-fade-in shadow-2xl border border-white/5 rounded-[2rem] p-12 overflow-hidden transition-all duration-500`}>
                    <div className="absolute top-6 right-8 flex gap-4">
                        <button onClick={() => setOutput('')} className="text-[10px] font-black text-stone-600 hover:text-red-500 uppercase transition-colors opacity-0 group-hover:opacity-100" data-tooltip="Wyczyść całe zapisane lore">Zatrzyj ślady</button>
                    </div>
                    <div className="prose prose-invert prose-amber max-w-none whitespace-pre-wrap text-xl leading-relaxed first-letter:text-6xl first-letter:font-serif first-letter:mr-4 first-letter:float-left first-letter:text-amber-600 first-letter:font-black theme-text">
                        {output}
                    </div>
                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center opacity-30 text-[10px] font-black uppercase tracking-[0.3em] theme-text-sub">
                        <span>Artefakt zapisany w kronikach świata</span>
                        <span>{model === 'gemini-1.5-pro' ? 'Katedra Mądrości' : 'Błyskawiczna Wizja'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
