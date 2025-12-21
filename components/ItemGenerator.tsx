import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground, erodeImage, createToken } from '../services/imageProcessing';

// ...

interface Result {
  id: string;
  url: string;
  type: string;
  status: 'loading' | 'success' | 'error';
  modelUsed?: string;
  isRemovingBg?: boolean;
  originalUrl?: string;
}


export const ItemGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [itemType, setItemType] = useState('Weapon');
  const [loading, setLoading] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(false);
  const [model, setModel] = useState('free-pollinations');

  // Load from local storage
  const [results, setResults] = useState<Result[]>(() => {
    const saved = localStorage.getItem('sanctuary_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [error, setError] = useState<string | null>(null);

  // Save to local storage
  React.useEffect(() => {
    localStorage.setItem('sanctuary_items', JSON.stringify(results));
  }, [results]);

  const getFullPrompt = () => {
    if (autoRemoveBg) {
      return `Diablo 4 item, ${itemType}, ${prompt || '[opis]'}, dark fantasy, realistic, detailed, masterpiece, best quality, ultra detailed, 8k, on pure white background, isolated on white, cut out, empty background, NO TEXT`;
    }
    return `Diablo 4 item, ${itemType}, ${prompt || '[opis]'}, dark fantasy, realistic, detailed, masterpiece, best quality, ultra detailed, 8k, on solid pure neon green background #00FF00, NO TEXT`;
  };

  const processRemoveBg = async (imageUrl: string) => {
    return removeBackground(imageUrl, autoRemoveBg ? 'white' : 'green');
  };

  const modifyEdge = async (id: string, amount: number) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: true } : r));
    const item = results.find(r => r.id === id);
    if (!item) return;

    if (amount === -1) {
      if (item.originalUrl) {
        setResults(prev => prev.map(r => r.id === id ? { ...r, url: item.originalUrl!, isRemovingBg: false } : r));
      } else {
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    const fullPrompt = getFullPrompt();

    try {
      const { url, modelUsed } = await generateAvatar(fullPrompt, model);
      setResults(prev => [{
        id: Math.random().toString(36),
        url,
        type: itemType,
        status: 'success',
        modelUsed,
        originalUrl: url
      }, ...prev]);
    } catch (err) {
      setError("Nie udało się wykuć przedmiotu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="bg-stone-900/90 p-6 border-2 border-stone-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <label className="font-diablo text-amber-600 text-[10px] uppercase">Runiczna Kuźnia</label>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoTransparent"
                checked={autoRemoveBg}
                onChange={(e) => setAutoRemoveBg(e.target.checked)}
                className="accent-amber-600 cursor-pointer"
              />
              <label htmlFor="autoTransparent" className="text-amber-600 text-[9px] uppercase font-serif cursor-pointer hover:text-amber-500">
                Przezroczyste Tło
              </label>
            </div>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none"
            >
              <option value="Weapon">Broń</option>
              <option value="Armor">Pancerz</option>
              <option value="Amulet">Amulet</option>
              <option value="Ring">Pierścień</option>
              <option value="Artifact">Artefakt</option>
            </select>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none">
              <option value="free-pollinations">🌀 Moc Pustki (Free)</option>
              <option value="gemini-2.5-flash-image">⚡ Gemini Flash</option>
            </select>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="np. Ostrze z obsydianu płonące niebieskim ogniem..."
          className="w-full bg-black border border-stone-800 p-4 text-stone-200 mb-6 outline-none focus:border-amber-900 min-h-[100px]"
        />

        <div className="mb-6">
          <PromptDisplay label="Pełny Prompt" text={getFullPrompt()} colorClass="text-amber-700" />
        </div>

        {error && <p className="text-red-600 text-[10px] mb-4 text-center uppercase font-serif">{error}</p>}

        <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full">Wykuj Przedmiot</DiabloButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((res) => (
          <div key={res.id} className="bg-black/40 p-3 border border-stone-900">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-diablo text-stone-500 uppercase text-[10px]">{res.type}</h4>
              <span className="text-[8px] text-stone-700 uppercase font-serif">{res.modelUsed || 'Moc Pustki (Free)'}</span>
            </div>
            <div className="relative aspect-square border border-stone-800 overflow-hidden bg-black bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqheqGw7mMYEiaHGwFAA7QxGL0CVF1AAAAABJRU5ErkJggg==)]">
              <img
                src={res.url}
                className={`w-full h-full object-contain transition-opacity ${res.isRemovingBg ? 'opacity-30' : 'opacity-100'}`}
              />
              {res.isRemovingBg && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <div className="flex justify-between items-center bg-stone-900/50 p-1 border border-stone-800">
                <span className="text-[8px] text-stone-500 uppercase font-serif">Krawędź</span>
                <div className="flex gap-1">
                  <button onClick={() => modifyEdge(res.id, 1)} className="bg-black text-amber-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-amber-600 disabled:opacity-50" disabled={res.isRemovingBg} title="Dotnij (Zmniejsz)">-</button>
                  <button onClick={() => modifyEdge(res.id, -1)} className="bg-black text-emerald-600 w-5 h-5 flex items-center justify-center text-[12px] border border-stone-700 hover:border-emerald-600 disabled:opacity-50" disabled={res.isRemovingBg || !res.originalUrl} title="Cofnij (Reset)">↺</button>
                </div>
              </div>

              <div className="flex gap-1">
                <button onClick={() => removeBg(res.id)} disabled={res.isRemovingBg} className="bg-stone-900 text-stone-500 text-[8px] uppercase p-2 border border-stone-800 hover:text-white flex-1 transition-colors disabled:opacity-50">Wytnij</button>
                <button
                  onClick={() => makeToken(res.id)}
                  disabled={res.isRemovingBg}
                  className="bg-stone-900 text-amber-500 text-[8px] uppercase p-2 border border-stone-800 hover:text-amber-300 flex-1 transition-colors disabled:opacity-50"
                  title="Stwórz Token VTT"
                >
                  Token
                </button>
                <a href={res.url} download={`sanctuary_item_${res.id}.png`} className="block flex-1 text-center bg-stone-900 text-stone-500 text-[8px] uppercase p-2 hover:bg-stone-800 border border-stone-800">Pobierz</a>
              </div>
              <button
                onClick={() => setResults(prev => prev.filter(r => r.id !== res.id))}
                className="w-full bg-red-900/20 text-red-500 text-[8px] uppercase p-1 border border-red-900/50 hover:bg-red-900/40"
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
