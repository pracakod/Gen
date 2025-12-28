import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground, erodeImage, createToken, downloadImage } from '../services/imageProcessing';
import { useStyle } from '../contexts/StyleContext';

const ITEM_TAGS = {
  diablo: {
    type: ['Broń', 'Pancerz', 'Tarcza', 'Amulet', 'Pierścień', 'Mikstura', 'Księga'],
    material: ['Żelazo', 'Złoto', 'Obsydian', 'Kość', 'Eteryczny', 'Kryształ'],
    rarity: ['Zwykły', 'Magiczny', 'Unikalny', 'Setowy', 'Starożytny']
  },
  cyberpunk: {
    type: ['Pistolet', 'Karabin', 'Implant', 'Chip', 'Gogle', 'Pancerz'],
    material: ['Chrom', 'Polimer', 'Grafen', 'Plastik', 'Neopunk'],
    rarity: ['Common', 'Rare', 'Epic', 'Legendary', 'Iconic']
  },
  pixelart: {
    type: ['Miecz', 'Laska', 'Hełm', 'Buty', 'Zwój', 'Klucz'],
    material: ['Drewno', 'Stal', 'Srebro', 'Marmur', 'Pikselowy'],
    rarity: ['Biały', 'Zielony', 'Niebieski', 'Fioletowy', 'Pomarańczowy']
  },
  gta: {
    type: ['Pistolet', 'SMG', 'Kamizelka', 'Torba z kasą', 'Zegarek'],
    material: ['Złoto', 'Stal', 'Skóra', 'Tytan'],
    rarity: ['Standard', 'Custom', 'Underground', 'Luxury']
  },
  fortnite: {
    type: ['Scar', 'Pump Shotgun', 'Slurp Juice', 'Pickaxe', 'Glider'],
    material: ['Drewno', 'Kamień', 'Metal', 'Energia'],
    rarity: ['Uncommon', 'Rare', 'Epic', 'Legendary', 'Exotic']
  },
  hades: {
    type: ['Miecz Styksu', 'Włócznia', 'Tarcza', 'Łuk', 'Relikwia'],
    material: ['Brąz', 'Spiż', 'Krew', 'Złoto Olimpu'],
    rarity: ['Zwykłe', 'Rzadkie', 'Epickie', 'Heroiczne']
  },
  tibia: {
    type: ['Sword', 'Axe', 'Club', 'Robe', 'Shield', 'Rune'],
    material: ['Steel', 'Gold', 'Crystal', 'Dragon Scale'],
    rarity: ['Common', 'Rare', 'Very Rare', 'Legendary']
  },
  cuphead: {
    type: ['Peashooter', 'Charm', 'Super Bottle', 'Coin'],
    material: ['Paper', 'Ink', 'Glass', 'Gum'],
    rarity: ['Standard', 'Special', 'Hidden', 'Grade P']
  }
};

interface Result {
  id: string;
  url: string;
  type: string;
  status: 'loading' | 'success' | 'error';
  modelUsed?: string;
  isRemovingBg?: boolean;
  originalUrl?: string;
  originalPrompt?: string;
}

export const ItemGenerator: React.FC = () => {
  const { styleConfig, currentStyle } = useStyle();

  const storageKey = `sanctuary_items_${currentStyle}`;
  const settingsKey = `sanctuary_items_settings_${currentStyle}`;

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
    const parts = [currentStyle === 'diablo' ? 'Diablo 4 item' : 'game item'];
    Object.values(selectedTags).forEach(v => v && parts.push(v));
    if (prompt) parts.push(prompt);

    const baseText = parts.join(', ');
    const fit = "single item centered, fully inside frame, zoomed out slightly, masterpiece, best quality, 8k";
    // Ulepszony prompt dla przezroczystości
    const bgStr = bgMode === 'transparent' ? 'on pure white background, isolated subject, high contrast' :
      bgMode === 'green' ? 'on pure neon green background #00FF00' :
        (bgTag || 'themed background');

    return `${baseText}, ${fit}, ${bgStr}, no text, ${styleConfig.artStyle}, ${styleConfig.negative}`;
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && Object.keys(selectedTags).length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const fullPrompt = getFullPrompt();
      const { url, modelUsed } = await generateAvatar(fullPrompt, model);
      let finalUrl = url;
      if (bgMode === 'transparent') finalUrl = await removeBackground(url, 'white');

      setResults(prev => [{
        id: Math.random().toString(36),
        url: finalUrl,
        type: selectedTags.type || 'Przedmiot',
        status: 'success',
        modelUsed,
        originalUrl: url,
        originalPrompt: prompt
      }, ...prev]);
    } catch (err) {
      setError("Nie udało się wykuć przedmiotu.");
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
      {/* GŁÓWNY PANEL GENERATORA */}
      <div className="premium-glass p-8 md:p-12 rounded-[3rem] space-y-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.4em]">Runiczna Kuźnia Przedmiotów</label>

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
                  className={`relative px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${bgMode === mode.id ? 'bg-orange-900/40 text-orange-200' : 'text-stone-600 hover:text-stone-400'}`}
                  data-tooltip={mode.id === 'transparent' ? 'Automatyczne wycinanie tła' : mode.id === 'green' ? 'Postać na zielonym tle' : 'Postać w wybranym otoczeniu'}
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
              data-tooltip="Wybierz model AI do generowania grafiki"
            >
              <option value="free-pollinations">MOC PUSTKI</option>
              <option value="gemini-2.5-flash-image">GEMINI FLASH</option>
            </select>
          </div>
        </div>

        {/* Tagi i OPCJE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-white/5">
          {bgMode === 'themed' && (
            <div className="md:col-span-3 p-6 bg-orange-900/10 rounded-3xl border border-orange-900/20 shadow-inner">
              <label className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-4 block flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                Otoczenie Artefaktu
              </label>
              <div className="flex flex-wrap gap-2">
                {styleConfig.backgroundTags.map(tag => (
                  <button key={tag} onClick={() => setBgTag(bgTag === tag ? '' : tag)} className={`tag-button ${bgTag === tag ? 'active' : ''}`}>{tag}</button>
                ))}
              </div>
            </div>
          )}

          {(Object.entries(ITEM_TAGS[currentStyle as keyof typeof ITEM_TAGS] || ITEM_TAGS.diablo)).map(([category, values]) => (
            <div key={category} className="p-6 bg-black-40-themed rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  {category === 'type' ? '⚔️ Rodzaj' : category === 'material' ? '💎 Materiał' : '✨ Rzadkość'}
                </label>
                {selectedTags[category] && <span className="text-[8px] font-black text-orange-500 animate-pulse">WYBRANO</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {values.map(val => (
                  <button key={val} onClick={() => toggleTag(category, val)} className={`tag-button ${selectedTags[category] === val ? 'active' : ''}`}>{val}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* PROMPT */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Dodatkowe Runy (Opis)</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Np. płonące ostrze, czaszka w rękojeści..." className="custom-textarea" />
          <PromptDisplay label="Pełny Manifest Kuźni" text={getFullPrompt()} colorClass="text-orange-900" />
        </div>

        <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full !py-6 text-base">⚒️ WYKUJ PRZEDMIOT</DiabloButton>
      </div>

      {/* SEKCJA WYNIKÓW */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 text-[10px] font-black text-stone-700 uppercase tracking-[0.4em]">
          <div className="flex-1 h-px bg-white/5"></div>
          Zapisane Artefakty
          <div className="flex-1 h-px bg-white/5"></div>
        </div>

        {results.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-stone-800 rounded-[3rem]">
            <span className="text-6xl mb-4">⚒️</span>
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Kuźnia czeka na pierwsze uderzenie</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((res) => (
              <div key={res.id} className="result-card group">
                <div className="p-4 flex justify-between items-center bg-black-20-themed border-b border-white/5">
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{res.type}</span>
                  <button onClick={() => setResults(prev => prev.filter(r => r.id !== res.id))} className="text-stone-600 hover:text-red-500 transition-colors" data-tooltip="Usuń trwale z historii">✕</button>
                </div>

                <div className="relative aspect-square checkerboard-grid m-6 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-black/40">
                  <img src={res.url} className={`w-full h-full object-contain p-6 transition-all duration-700 ${res.isRemovingBg ? 'scale-90 opacity-40 blur-md' : 'group-hover:scale-110'}`} alt="Generated item" />
                  {res.isRemovingBg && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-10 h-10 border-4 border-orange-500/10 border-t-orange-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0 space-y-3">
                  <div className="flex items-center justify-between bg-black-40-themed rounded-xl p-2 border border-white/5">
                    <span className="text-[9px] font-black text-stone-600 uppercase ml-2 tracking-widest">Krawędzie</span>
                    <div className="flex gap-2">
                      <button onClick={() => modifyEdge(res.id, 1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-orange-500 hover:border-orange-500 transition-all font-black" data-tooltip="Zwężaj kontur (popraw wycięcie)">-</button>
                      <button onClick={() => modifyEdge(res.id, -1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-emerald-500 hover:border-emerald-500 transition-all font-black text-[10px]" data-tooltip="Przywróć oryginał">↺</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => downloadImage(res.url, `item_${res.id}.png`)} className="col-span-2 py-3 rounded-xl bg-orange-600/10 border border-orange-600/20 text-[10px] font-black uppercase text-orange-400 hover:bg-orange-600/20 transition-all" data-tooltip="Zapisz artefakt na dysku">Pobierz PNG</button>
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
