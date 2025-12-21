import React, { useState } from 'react';
import { createToken, erodeImage, removeBackground } from '../services/imageProcessing';
import { enhanceUserPrompt } from '../services/prompts';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { useStyle } from '../contexts/StyleContext';

interface Result {
  id: string;
  url: string;
  gender: string;
  isRemovingBg: boolean;
  status: 'loading' | 'success' | 'error';
  originalPrompt: string;
  fullFinalPrompt: string;
  modelUsed?: string;
  originalUrl?: string; // For Undo
}

export const AvatarGenerator: React.FC = () => {
  const { styleConfig, currentStyle } = useStyle();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('free-pollinations');
  const [loading, setLoading] = useState(false);

  // Storage key per style
  const storageKey = `sanctuary_avatars_${currentStyle}`;
  const settingsKey = `sanctuary_avatars_settings_${currentStyle}`;

  // Load from local storage (per style)
  const [results, setResults] = useState<Result[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [error, setError] = useState<string | null>(null);

  // Load settings from localStorage
  const [autoRemoveBg, setAutoRemoveBg] = useState(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved).autoRemoveBg ?? false : false;
  });

  const [genMale, setGenMale] = useState(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved).genMale ?? true : true;
  });

  const [genFemale, setGenFemale] = useState(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved).genFemale ?? true : true;
  });

  // Save results to local storage (per style)
  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(results));
  }, [results, storageKey]);

  // Save settings to local storage
  React.useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify({ autoRemoveBg, genMale, genFemale, model }));
  }, [autoRemoveBg, genMale, genFemale, model, settingsKey]);

  // Reload data when style changes
  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setResults(saved ? JSON.parse(saved) : []);
  }, [currentStyle]);

  const getFullPromptForGender = (gender: 'Male' | 'Female') => {
    const enhancedUserText = enhanceUserPrompt(prompt || '[opis]', 'character');

    if (autoRemoveBg) {
      return `${enhancedUserText}, gender ${gender}, full body character, looking at camera, ${styleConfig.artStyle}, ${styleConfig.lighting}, on pure white background, isolated on white, cut out, NO TEXT, ${styleConfig.negative}`;
    }

    return `${enhancedUserText}, gender ${gender}, full body character, looking at camera, ${styleConfig.artStyle}, ${styleConfig.lighting}, ${styleConfig.environment}, on solid pure neon green background #00FF00, flat lighting on background, NO TEXT, NO GREEN CLOTHING`;
  };

  const getPlaceholder = () => {
    if (currentStyle === 'cyberpunk') return 'np. Netrunner z implantami, haker w neonowej kurtce...';
    if (currentStyle === 'pixelart') return 'np. Rycerz z mieczem, mag z laską...';
    return 'np. Nekromanta w zbroi z kości...';
  };

  const getButtonText = () => {
    if (currentStyle === 'cyberpunk') return 'Uruchom Generator';
    if (currentStyle === 'pixelart') return 'Renderuj Sprite';
    return 'Otwórz Wrota';
  };

  const processRemoveBg = async (imageUrl: string): Promise<string> => {
    return removeBackground(imageUrl, autoRemoveBg ? 'white' : 'green');
  };

  const modifyEdge = async (id: string, amount: number) => {
    // amount > 0 = erode (shrink), amount -1 = RESET (Undo)
    setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
    const item = results.find(r => r.id === id);
    if (!item) return;

    if (amount === -1) {
      // UNDO LOGIC: Revert to originalUrl if available
      if (item.originalUrl) {
        setResults(prev => prev.map(r => r.id === id ? { ...r, url: item.originalUrl!, isRemovingBg: false } : r));
        // If we want to re-apply auto-remove after reset (if it was on), that's complex.
        // For now, "Undo" means revert to RAW image (with background).
        // If the user wants to strip background again, they can click "Wytnij Tło".
      } else {
        // No original stored (legacy items), nothing to do or just stop spinner
        setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
      }
      return;
    }

    try {
      const newUrl = await erodeImage(item.url, amount);
      setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false } : r));
    } catch (e) {
      console.error(e);
      setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
    }
  };


  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!genMale && !genFemale) {
      setError("Wybierz przynajmniej jedną płeć.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(prev => prev || []);

    try {
      const genders: ('Male' | 'Female')[] = [];
      if (genMale) genders.push('Male');
      if (genFemale) genders.push('Female');

      for (const g of genders) {
        const fullPrompt = getFullPromptForGender(g);
        const { url, modelUsed } = await generateAvatar(fullPrompt, model);

        let finalUrl = url;
        if (autoRemoveBg) {
          try {
            finalUrl = await processRemoveBg(url);
          } catch (e) {
            console.warn("Auto-remove failed", e);
          }
        }

        setResults(prev => [...prev, {
          id: Math.random().toString(36),
          url: finalUrl,
          gender: g === 'Male' ? 'Męski' : 'Żeński',
          isRemovingBg: false,
          status: 'success',
          originalPrompt: prompt,
          fullFinalPrompt: fullPrompt,
          modelUsed,
          originalUrl: url // Store original for Undo
        }]);
        if (model !== 'free-pollinations') await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err: any) {
      setError("Moc wyczerpana.");
    } finally {
      setLoading(false);
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

  const removeBg = async (id: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
    const item = results.find(r => r.id === id);
    if (!item) return;

    try {
      const newUrl = await processRemoveBg(item.url);
      setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false } : r));
    } catch (e) {
      setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl relative">
        <div className="flex justify-between items-center mb-4">
          <label className="font-diablo text-amber-600 text-[10px] uppercase">Formowanie Bytu</label>
          <div className="flex gap-4 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoTransparent"
                checked={autoRemoveBg}
                onChange={(e) => setAutoRemoveBg(e.target.checked)}
                className="accent-emerald-600 cursor-pointer"
              />
              <label htmlFor="autoTransparent" className="text-emerald-500 text-[9px] uppercase font-serif cursor-pointer hover:text-emerald-400">
                Przezroczyste Tło
              </label>
            </div>
            <div className="h-4 w-px bg-stone-700 mx-2"></div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="genMale"
                checked={genMale}
                onChange={(e) => setGenMale(e.target.checked)}
                className="accent-red-800"
              />
              <label htmlFor="genMale" className="text-stone-400 text-[9px] uppercase font-serif cursor-pointer">Mężczyzna</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="genFemale"
                checked={genFemale}
                onChange={(e) => setGenFemale(e.target.checked)}
                className="accent-red-800"
              />
              <label htmlFor="genFemale" className="text-stone-400 text-[9px] uppercase font-serif cursor-pointer">Kobieta</label>
            </div>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none ml-2">
              <option value="free-pollinations">Moc Pustki (Free)</option>
              <option value="gemini-2.5-flash-image">Gemini Flash</option>
            </select>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={getPlaceholder()}
          className="w-full bg-black border border-stone-800 p-4 text-stone-200 mb-6 outline-none focus:border-red-900 min-h-[100px]"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {genMale && (
            <PromptDisplay label="Dla Mężczyzny" text={getFullPromptForGender('Male')} />
          )}
          {genFemale && (
            <PromptDisplay label="Dla Kobiety" text={getFullPromptForGender('Female')} />
          )}
        </div>

        {error && <p className="text-red-600 text-[10px] mb-4 text-center uppercase font-serif">{error}</p>}

        <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full">{getButtonText()}</DiabloButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {results.map((res) => (
          <div key={res.id} className="bg-black/40 p-3 border border-stone-900 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h4 className="font-diablo text-stone-500 text-center uppercase text-[10px]">{res.gender}</h4>
              <span className="text-[9px] text-stone-700 uppercase font-serif">
                {/* @ts-ignore */}
                {res.modelUsed || 'Moc Pustki (Free)'}
              </span>
            </div>
            <div className="relative aspect-square border border-stone-800 overflow-hidden bg-black bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)]">
              <img src={res.url} className={`w-full h-full object-contain transition-opacity ${res.isRemovingBg ? 'opacity-30' : 'opacity-100'}`} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center bg-stone-900/50 p-1 border border-stone-800">
                <span className="text-[8px] text-stone-500 uppercase font-serif">Krawędź</span>
                <div className="flex gap-1">
                  <button onClick={() => modifyEdge(res.id, 1)} className="bg-black text-amber-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-amber-600 disabled:opacity-50" disabled={res.isRemovingBg} title="Dotnij (Zmniejsz)">-</button>
                  <button onClick={() => modifyEdge(res.id, -1)} className="bg-black text-emerald-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-emerald-600 disabled:opacity-50" disabled={res.isRemovingBg || !res.originalUrl} title="Cofnij (Reset)">↺</button>
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <button onClick={() => removeBg(res.id)} className="bg-stone-900 text-stone-500 text-[8px] uppercase p-1 border border-stone-800 hover:text-white flex-1 transition-colors">Wytnij Tło</button>
                <button
                  onClick={() => makeToken(res.id)}
                  disabled={res.isRemovingBg}
                  className="bg-stone-900 text-amber-500 text-[8px] uppercase p-1 border border-stone-800 hover:text-amber-300 flex-1 transition-colors disabled:opacity-50"
                  title="Stwórz Token VTT"
                >
                  Token
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(res.url);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `sanctuary_${res.id}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      console.error("Download failed", e);
                      window.open(res.url, '_blank');
                    }
                  }}
                  className="bg-black text-stone-600 text-[8px] uppercase p-1 border border-stone-800 hover:text-white flex-1 text-center"
                >
                  Zapisz
                </button>
                <button
                  onClick={() => setResults(prev => prev.filter(r => r.id !== res.id))}
                  className="bg-red-900/20 text-red-500 text-[8px] uppercase p-1 border border-red-900/50 hover:bg-red-900/40 px-2"
                >
                  X
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
