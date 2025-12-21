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
    type: ['Pistolet', 'Uzi', 'Torba z Kasą', 'Zegarek', 'Kluczyki', 'Telefon'],
    material: ['Stal', 'Złoto', 'Skóra', 'Carbon'],
    rarity: ['Tani', 'Standard', 'Premium', 'Luksusowy']
  },
  fortnite: {
    type: ['Kilof', 'Plecak', 'Lotnia', 'Karabin', 'Trap', 'Llama'],
    material: ['Metal', 'Cegła', 'Drewno', 'Energy'],
    rarity: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']
  },
  hades: {
    type: ['Miecz', 'Włócznia', 'Łuk', 'Tarcza', 'Nektar'],
    material: ['Adamentyn', 'Krew Tytanów', 'Cień', 'Złoto'],
    rarity: ['Boon', 'Upgrade', 'Artifact', 'Treasury']
  },
  tibia: {
    type: ['Sword', 'Mace', 'Axe', 'Shield', 'Rune', 'Backpack'],
    material: ['Bronze', 'Vampire', 'Demon', 'Golden'],
    rarity: ['Quest Item', 'Rare', 'Very Rare', 'Impossible']
  },
  cuphead: {
    type: ['Napój', 'Rękawica', 'Pocisk', 'Puchar', 'Moneta'],
    material: ['Papier', 'Atrament', 'Szkło', 'Farba'],
    rarity: ['Simple', 'Regular', 'Grade A', 'Perfect S']
  }
};

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
  const { styleConfig, currentStyle } = useStyle();
  const [prompt, setPrompt] = useState('');
  const [itemType, setItemType] = useState('Weapon');
  const [loading, setLoading] = useState(false);

  // Storage key per style
  const storageKey = `sanctuary_items_${currentStyle}`;
  const settingsKey = `sanctuary_items_settings_${currentStyle}`;

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

  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved).model ?? 'free-pollinations' : 'free-pollinations';
  });

  const [selectedTags, setSelectedTags] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved).selectedTags ?? {} : {};
  });

  const toggleTag = (category: string, value: string) => {
    setSelectedTags(prev => ({
      ...prev,
      [category]: prev[category] === value ? '' : value
    }));
  };

  // Load from local storage (per style)
  const [results, setResults] = useState<Result[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  const [error, setError] = useState<string | null>(null);

  // Save to local storage (per style)
  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(results));
  }, [results, storageKey]);


  // Save settings
  React.useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify({ bgMode, bgTag, model, selectedTags }));
  }, [bgMode, bgTag, model, selectedTags, settingsKey]);

  // Reload when style changes
  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setResults(saved ? JSON.parse(saved) : []);
  }, [currentStyle]);

  const getItemPrefix = () => {
    if (currentStyle === 'cyberpunk') return 'Cyberpunk 2077 item, futuristic';
    if (currentStyle === 'pixelart') return '16-bit pixel art game item, retro';
    return 'Diablo 4 item';
  };

  const getFullPrompt = () => {
    const parts = [getItemPrefix()];
    if (selectedTags.type) parts.push(selectedTags.type);
    if (selectedTags.material) parts.push(selectedTags.material);
    if (selectedTags.rarity) parts.push(selectedTags.rarity);
    if (prompt) parts.push(prompt);

    const baseText = parts.join(', ');
    const fitInFrame = "single item, object COMPLETELY INSIDE the frame, centered, zoomed out slightly to ensure nothing is cut off, generous padding around the object";
    const cleanEdges = "clean sharp edges, NO FOG, NO PARTICLES, NO BLOOM, NO SMOKE, NO VOLUMETRIC LIGHTING, high contrast between object and background";

    if (bgMode === 'transparent') {
      return `${baseText}, ${styleConfig.artStyle}, ${styleConfig.lighting}, ${fitInFrame}, ${cleanEdges}, transparent background, no background, isolated subject, PNG with alpha channel, cut out, empty background, no shadows, NO TEXT, ${styleConfig.negative}`;
    } else if (bgMode === 'green') {
      return `${baseText}, ${styleConfig.artStyle}, ${styleConfig.lighting}, ${fitInFrame}, ${cleanEdges}, on solid pure neon green background #00FF00, flat color background, no shadows on background, NO TEXT, ${styleConfig.negative}`;
    }

    const bgDesc = bgTag ? `${bgTag} background, ${styleConfig.environment}` : styleConfig.environment;
    return `${baseText}, ${styleConfig.artStyle}, ${styleConfig.lighting}, ${bgDesc}, ${fitInFrame}, ${cleanEdges}, NO TEXT, ${styleConfig.negative}`;
  };

  const getPlaceholder = () => {
    return `${styleConfig.placeholders.lore.replace('...', '')} dla ${styleConfig.tabLabels.items.toLowerCase()}...`;
  };

  const getButtonText = () => {
    return `${styleConfig.buttons.generate} ${styleConfig.tabLabels.items}`;
  };

  const processRemoveBg = async (imageUrl: string) => {
    return removeBackground(imageUrl, bgMode === 'transparent' ? 'white' : 'green');
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
      let finalUrl = url;
      if (bgMode === 'transparent') {
        try {
          finalUrl = await processRemoveBg(url);
        } catch (e) {
          console.error("BG Removal failed:", e);
        }
      }
      setResults(prev => [{
        id: Math.random().toString(36),
        url: finalUrl,
        type: selectedTags.type || 'Item',
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
            <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-black text-stone-300 text-[10px] p-2 border border-stone-800 outline-none">
              <option value="free-pollinations">🌀 Moc Pustki (Free)</option>
              <option value="gemini-2.5-flash-image">⚡ Gemini Flash</option>
            </select>
          </div>
        </div>

        {bgMode === 'themed' && (
          <div className="mt-4 mb-6 p-4 bg-black/40 border border-amber-900/30 rounded animate-fade-in">
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

        <div className="space-y-4 mb-6">
          {Object.entries(ITEM_TAGS[currentStyle as keyof typeof ITEM_TAGS]).map(([category, values]) => (
            <div key={category}>
              <label className="text-stone-500 text-[9px] uppercase mb-1 block">
                {category === 'type' ? 'Typ' : category === 'material' ? 'Materiał' : 'Rzadkość'}
              </label>
              <div className="flex flex-wrap gap-1">
                {values.map(val => (
                  <button
                    key={val}
                    onClick={() => toggleTag(category, val)}
                    className={`px-2 py-0.5 text-[10px] border transition-all ${selectedTags[category] === val
                      ? 'bg-amber-900/40 border-amber-600 text-amber-200'
                      : 'bg-black border-stone-800 text-stone-500 hover:border-stone-600'
                      }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={getPlaceholder()}
          className="w-full bg-black border border-stone-800 p-4 text-stone-200 mb-6 outline-none focus:border-amber-900 min-h-[100px]"
        />

        <div className="mb-6">
          <PromptDisplay label="Pełny Prompt" text={getFullPrompt()} colorClass="text-amber-700" />
        </div>

        {error && <p className="text-red-600 text-[10px] mb-4 text-center uppercase font-serif">{error}</p>}

        <DiabloButton onClick={handleGenerate} isLoading={loading} className="w-full">{getButtonText()}</DiabloButton>
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
                <DiabloButton
                  onClick={() => makeToken(res.id)}
                  isLoading={res.isRemovingBg}
                  className="bg-stone-900 border-stone-800 text-amber-500 text-[8px] uppercase p-1 h-auto flex-1 transition-colors min-h-0 py-1"
                  title="Stwórz Token VTT"
                >
                  Token
                </DiabloButton>
                <button
                  onClick={() => downloadImage(res.url, `sanctuary_item_${res.id}.png`)}
                  className="flex-1 text-center bg-stone-900 text-stone-500 text-[8px] uppercase p-2 hover:bg-stone-800 border border-stone-800"
                >
                  Pobierz
                </button>
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
