import React, { useState } from 'react';
import { createToken, erodeImage, removeBackground, downloadImage } from '../services/imageProcessing';
import { enhanceUserPrompt } from '../services/prompts';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { useStyle } from '../contexts/StyleContext';

const HERO_TAGS = {
  diablo: {
    race: ['Człowiek', 'Nieumarły', 'Demon', 'Anioł', 'Upadły'],
    class: ['Wojownik', 'Mag', 'Łucznik', 'Paladyn', 'Nekromanta', 'Druid'],
    trait: ['Płonący', 'Mroźny', 'Złoty', 'Skażony', 'Eteryczny'],
    render: ['Concept Art', 'Blender 3D', 'Splash Art', 'ZBrush Sculpt'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  cyberpunk: {
    race: ['Człowiek', 'Cyborg', 'Android', 'Syntetyk', 'Haker'],
    class: ['Netrunner', 'Solo', 'Techie', 'Fixer', 'Mercenary'],
    trait: ['Neonowy', 'Chromowany', 'Zglitchowany', 'Militarny', 'Wirtualny'],
    render: ['In-Game Tool', 'Blender 3D', 'Cinematic', 'Voxel'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  pixelart: {
    race: ['Człowiek', 'Elf', 'Krasnolud', 'Ork', 'Szkielet'],
    class: ['Rycerz', 'Czarodziej', 'Złodziej', 'Kapłan', 'Ranger'],
    trait: ['8-bitowy', 'Legendarny', 'Ognisty', 'Leśny', 'Przeklęty'],
    render: ['Sprite Sheet', 'Blender 3D', 'Retro Render', 'HD-2D'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  }
};

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

  const [selectedTags, setSelectedTags] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(settingsKey);
    return saved ? JSON.parse(saved).selectedTags ?? {} : {};
  });

  // Save settings to local storage
  React.useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify({ autoRemoveBg, genMale, genFemale, model, selectedTags }));
  }, [autoRemoveBg, genMale, genFemale, model, selectedTags, settingsKey]);

  const toggleTag = (category: string, value: string) => {
    setSelectedTags(prev => ({
      ...prev,
      [category]: prev[category] === value ? '' : value
    }));
  };

  // Reload data when style changes
  React.useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setResults(saved ? JSON.parse(saved) : []);
  }, [currentStyle]);

  const getFullPromptForGender = (gender: 'Male' | 'Female') => {
    const parts = [];
    if (selectedTags.race) parts.push(selectedTags.race);
    if (selectedTags.class) parts.push(selectedTags.class);
    if (selectedTags.trait) parts.push(selectedTags.trait);

    let renderStyle = styleConfig.artStyle;
    if (selectedTags.render === 'Blender 3D') {
      renderStyle = "3D character model rendered in Blender, Octane Render, Cycles engine, high poly, highly detailed PBR textures, game character preview, professional studio lighting, clear silhouette";
    } else if (selectedTags.render) {
      parts.push(selectedTags.render);
    }

    let poseDesc = "heroic standing pose";
    if (selectedTags.pose === 'Bojowa') poseDesc = "dynamic action battle pose, ready for combat";
    if (selectedTags.pose === 'A-Pose') poseDesc = "A-pose stance, arms slightly away from sides";
    if (selectedTags.pose === 'T-Pose') poseDesc = "T-pose stance, arms strictly horizontal at sides";
    if (selectedTags.pose === 'Z Profilu') poseDesc = "side profile view, standing sideways";
    if (selectedTags.pose === 'Z tyłu') poseDesc = "back view, facing away from camera";
    if (selectedTags.pose === 'W biegu') poseDesc = "dynamic running pose, mid-stride";
    if (selectedTags.pose === 'Atak mieczem') poseDesc = "dynamic sword swinging attack pose";
    if (selectedTags.pose === 'Rzucanie czaru') poseDesc = "spellcasting pose, magic energy in hands";
    if (selectedTags.pose === 'Siedząca') poseDesc = "sitting down pose";
    if (selectedTags.pose === 'Kucająca') poseDesc = "crouching low pose";
    if (selectedTags.pose === 'Medytacja') poseDesc = "meditating pose, floating slightly or sitting lotus";
    if (selectedTags.pose === 'Power Stance') poseDesc = "powerful heroic power stance, legs wide, looking intimidating";
    if (selectedTags.pose === 'Portret') poseDesc = "portrait view, upper body and head, looking at camera";
    if (selectedTags.pose === 'Popiersie') poseDesc = "bust view, head and shoulders only, detailed face";
    if (selectedTags.pose === 'Neutralna') poseDesc = "relaxed standing pose, arms at sides";

    if (prompt) parts.push(prompt);

    const baseText = parts.length > 0 ? parts.join(', ') : '[opis]';
    const enhancedUserText = enhanceUserPrompt(baseText, 'character');

    let fitInFrame = `full body shot, ${poseDesc}, entire character must be fully visible and contained within the frame, not cut off, head and feet must be visible, centered composition`;
    if (selectedTags.pose === 'Portret' || selectedTags.pose === 'Popiersie') {
      fitInFrame = `${poseDesc}, centered, framed properly, high detail`;
    }
    const cleanEdges = "clean sharp edges, NO FOG, NO PARTICLES, NO BLOOM, NO SMOKE, NO VOLUMETRIC LIGHTING, high contrast between character and background";

    if (autoRemoveBg) {
      return `${enhancedUserText}, ${renderStyle}, gender ${gender}, ${fitInFrame}, ${cleanEdges}, looking at camera, ${styleConfig.lighting}, on pure white background, isolated on white, cut out, no shadows on background, NO TEXT, ${styleConfig.negative}`;
    }

    return `${enhancedUserText}, ${renderStyle}, gender ${gender}, ${fitInFrame}, ${cleanEdges}, looking at camera, ${styleConfig.lighting}, ${styleConfig.environment}, on solid pure neon green background #00FF00, flat color background, no shadows on background, NO TEXT, NO GREEN CLOTHING`;
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

        <div className="space-y-4 mb-6">
          {Object.entries(HERO_TAGS[currentStyle as keyof typeof HERO_TAGS]).map(([category, values]) => (
            <div key={category}>
              <label className="text-stone-500 text-[9px] uppercase mb-1 block">
                {category === 'race' ? 'Rasa' : category === 'class' ? 'Klasa' : category === 'trait' ? 'Atrybut' : category === 'pose' ? 'Poza' : 'Styl Renderu'}
              </label>
              <div className="flex flex-wrap gap-1">
                {values.map(val => (
                  <button
                    key={val}
                    onClick={() => toggleTag(category, val)}
                    className={`px-2 py-0.5 text-[10px] border transition-all ${selectedTags[category] === val
                      ? 'bg-red-900/40 border-red-600 text-red-200'
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
          className="w-full bg-black border border-stone-800 p-4 text-stone-200 mb-6 outline-none focus:border-red-900 min-h-[80px]"
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
                  onClick={() => downloadImage(res.url, `sanctuary_avatar_${res.id}.png`)}
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
