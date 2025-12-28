import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';
import { generateAvatar } from '../services/geminiService';
import { PromptDisplay } from './PromptDisplay';
import { removeBackground as processRemoveBg, erodeImage, createToken, downloadImage } from '../services/imageProcessing';
import { useStyle } from '../contexts/StyleContext';

const HERO_TAGS = {
  diablo: {
    race: ['Barbarzyńca', 'Nekromanta', 'Czarodziejka', 'Łotr', 'Druid', 'Anioł', 'Demon'],
    class: ['Wojownik', 'Mag', 'Zabójca', 'Strażnik', 'Berserker'],
    trait: ['Zniszczony', 'Mroczny', 'Epicki', 'Starożytny', 'Skażony'],
    render: ['Concept Art', 'Blender 3D', 'Splash Art', 'ZBrush Sculpt', 'In-Game Tool', 'Cinematic'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  cyberpunk: {
    race: ['Solo', 'Netrunner', 'Techie', 'Corporate', 'Nomad', 'Android', 'Cyborg'],
    class: ['Żołnierz', 'Ninja', 'Budowniczy', 'Specjalista', 'Legenda'],
    trait: ['Smerfny', 'Neonowy', 'Epicki', 'Zabawny', 'Technologiczny'],
    render: ['UE5 Render', 'Stylized 3D', 'Vibrant Art', 'In-Game Skin'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  hades: {
    race: ['Bóstwo', 'Duch', 'Potępieniec', 'Cierń', 'Nimfa'],
    class: ['Wojownik', 'Posłaniec', 'Strażnik', 'Buntownik', 'Wyrocznia'],
    trait: ['Boski Glow', 'Płonący Tusz', 'Zagrożenie', 'Eteryczny', 'Złoty'],
    render: ['Painterly', 'Brush Strokes', 'Hades Style', 'High Contrast'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  tibia: {
    race: ['Człowiek', 'Ork', 'Minotaur', 'Dwarf', 'Elf'],
    class: ['Knight', 'Paladin', 'Sorcerer', 'Druid', 'Elite Knight'],
    trait: ['Nostalgiczny', 'Pikselowy', 'Mityczny', 'Runy', 'Złoty Set'],
    render: ['Sprite', 'Isometric Art', 'Top-Down Retro', 'Bitmap'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  cuphead: {
    race: ['Przedmiot', 'Zwierzak', 'Postać ludzka', 'Stwór', 'Kreskówka'],
    class: ['Awanturnik', 'Boss', 'Sidekick', 'Bohater', 'Kanciarz'],
    trait: ['Retro Film', 'Gumowe Ręce', 'Akvarelowy', 'Surrealistyczny', 'Wesoły'],
    render: ['Cel Animation', '1930s Drawing', 'Vintage Art', 'Hand-drawn'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  pixelart: {
    race: ['Bohater', 'Mag', 'Łucznik', 'Rycerz', 'Dwarf', 'Elf', 'Orc'],
    class: ['Warrior', 'Mage', 'Ranger', 'Paladin'],
    trait: ['Retro', 'Pikselowy', 'Złoty', 'Mityczny'],
    render: ['Sprite', 'Isometric Art', 'Top-Down Retro', 'Bitmap'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  gta: {
    race: ['Gangster', 'Boss', 'Dealer', 'Agent', 'Uliczny Wojownik'],
    class: ['Solo', 'Crew Member', 'Hustler', 'Legend'],
    trait: ['Pieniądze', 'Złoto', 'Tatuaże', 'Okulary', 'Luksus'],
    render: ['GTA Style', 'Vector Art', 'Digital Paint', 'Illustration'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  },
  fortnite: {
    race: ['Skin', 'Hero', 'Commander', 'Raider', 'Outlander'],
    class: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'],
    trait: ['Vibrant', 'Neon', 'Cartoon', 'Heroic', 'Glitch'],
    render: ['UE5 Render', 'Stylized 3D', 'Vibrant Art', 'In-Game Skin'],
    pose: ['Neutralna', 'Bojowa', 'Power Stance', 'Portret', 'Popiersie', 'A-Pose', 'T-Pose', 'Z Profilu', 'Z tyłu', 'W biegu', 'Atak mieczem', 'Rzucanie czaru', 'Siedząca', 'Kucająca', 'Medytacja']
  }
};

const RENDER_DESCRIPTIONS: Record<string, string> = {
  'Concept Art': 'Szkicowy, artystyczny styl projektowy z widocznymi pociągnięciami pędzla.',
  'Blender 3D': 'Realistyczny model 3D o wysokiej jakości z teksturami PBR i profesjonalnym oświetleniem.',
  'Splash Art': 'Dynamiczna, epicka ilustracja o kinowej jakości, jak w profesjonalnych grach RPG.',
  'ZBrush Sculpt': 'Szczegółowa rzeźba cyfrowa z wyraźną anatomią i drobnymi detalami materiałów.',
  'In-Game Tool': 'Wygląd bezpośrednio z edytora gry, pokazujący bohatera w środowisku silnika graficznego.',
  'Cinematic': 'Najwyższa filmowa jakość obrazu z precyzyjnym oświetleniem i głębią ostrości.',
  'Voxel': 'Styl zbudowany z małych sześcianów, przypominający Minecrafta lub nowoczesne gry voxelowe.',
  'Sprite Sheet': 'Arkusz klatek animacji postaci gotowy do wycięcia i użycia w silniku 2D.',
  'Retro Render': 'Stylizowany render przypominający grafikę z wczesnych lat 2000.',
  'HD-2D': 'Połączenie nowoczesnych efektów świetlnych i 3D z klasycznym pixel artem.',
  'Vector Art': 'Czyste linie i płaskie kolory typowe dla ilustracji wektorowych i logo.',
  'GTA Style': 'Stylistyka plakatów i artworków znana z gier Rockstar Games.',
  'Digital Paint': 'Ilustracja cyfrowa imitująca tradycyjne malarstwo olejne lub akrylowe.',
  'Illustration': 'Klasyczny styl rysunkowy z wyraźnym konturem i cieniowaniem.',
  'UE5 Render': 'Bardzo nowoczesny wygląd wykorzystujący technologie Nanite i Lumen z Unreal Engine 5.',
  'Stylized 3D': 'Uproszczony, kreskówkowy styl 3D z żywymi kolorami i miękkim cieniowaniem.',
  'Vibrant Art': 'Sztuka o nasyconych kolorach i wysokim kontraście wizualnym.',
  'In-Game Skin': 'Prezentacja bohatera jako przedmiotu modyfikującego wygląd w grze.',
  'Painterly': 'Styl artystyczny skupiony na teksturze pędzla i artystycznym nieładzie.',
  'Brush Strokes': 'Eksperymentalny styl z wyraźnie zaznaczonymi śladami narzędzi malarskich.',
  'Hades Style': 'Unikalna stylistyka z gry Hades: czarne kontury, mocny kontrast i boski blask.',
  'High Contrast': 'Obraz o bardzo mocnych cieniach i jasnych światłach, bez półtonów.',
  'Sprite': 'Pojedynczy obrazek postaci 2D typowy dla gier izometrycznych i platformówek.',
  'Isometric Art': 'Widok z rzutu izometrycznego, najpopularniejszy w klasycznych RPG.',
  'Top-Down Retro': 'Klasyczny widok z góry w stylu retro, z wyraźną siatką pikseli i ograniczoną paletą barw.',
  'Bitmap': 'Surowy, nostalgiczny styl cyfrowy przypominający czasy Commodore lub Amigi.',
  'Cel Animation': 'Styl tradycyjnej animacji rysunkowej z lat 90.',
  '1930s Drawing': 'Styl starych kreskówek z lat 30. (jak wczesny Disney lub Cuphead).',
  'Vintage Art': 'Obraz stylizowany na stary, pożółkły papier lub zużytą kliszę filmową.',
  'Hand-drawn': 'Styl imitujący rysunek odręczny wykonany ołówkiem lub tuszem.'
};

const BG_MODE_DESCRIPTIONS: Record<string, string> = {
  'transparent': 'Usuwa tło, pozostawiając samą postać na przezroczystości.',
  'green': 'Postać na jednolitym zielonym tle do późniejszej obróbki.',
  'themed': 'Postać w wybranym otoczeniu dla pełnego klimatu.'
};

const POSE_DESCRIPTIONS: Record<string, string> = {
  'Neutralna': 'Swobodna, naturalna postawa postaci stojącej przodem.',
  'Bojowa': 'Dynamiczna poza gotowości do walki.',
  'Power Stance': 'Potężna postawa emanująca siłą.',
  'Portret': 'Kadrowanie od pasa w górę, skupione na twarzy.',
  'Popiersie': 'Bliskie ujęcie samej głowy i ramion.',
  'A-Pose': 'Klasyczna poza projektowa w kształcie litery A.',
  'T-Pose': 'Ramiona rozłożone poziomo, poza techniczna.',
  'Z Profilu': 'Postać zwrócona bokiem do widza.',
  'Z tyłu': 'Widok na plecy bohatera.',
  'W biegu': 'Dynamiczne ujęcie w trakcie ruchu.',
  'Atak mieczem': 'Akcja zamachu bronią białą.',
  'Rzucanie czaru': 'Mistyczna poza z energią magiczną.',
  'Siedząca': 'Postać odpoczywająca na ziemi.',
  'Kucająca': 'Niska poza, skradanie się.',
  'Medytacja': 'Postać w locie lub siedząca w spokoju.'
};

const RACE_DESCRIPTIONS: Record<string, string> = {
  'Barbarzyńca': 'Silny wojownik z północy, specjalista od walki w zwarciu.',
  'Nekromanta': 'Władca śmierci, przywołujący sługi zza grobu.',
  'Czarodziejka': 'Mistrzyni żywiołów, władająca ogniem i lodem.',
  'Łotr': 'Szybki i przebiegły mistrz kamuflażu oraz sztyletów.',
  'Druid': 'Zmiennokształtny opiekun natury, władający mocą ziemi.',
  'Anioł': 'Boska istota o nieskazitelnej aurze i potężnych skrzydłach.',
  'Demon': 'Mroczny byt z otchłani, emanujący niszczycielską energią.',
  'Solo': 'Najemnik nowej ery, skupiony na brutalnej sile i technologii.',
  'Netrunner': 'Geniusz sieci, potrafiący włamać się do każdego systemu.',
  'Techie': 'Mistrz urządzeń i modyfikacji sprzętowych.',
  'Corporate': 'Wysoko postawiony agent korporacji, zawsze nienagannie ubrany.',
  'Nomad': 'Wędrowiec bezdroży, wolny duch i doskonały kierowca.',
  'Android': 'Sztuczna inteligencja w ludzkim ciele.',
  'Cyborg': 'Połączenie człowieka z zaawansowaną maszynerią.',
  'Bóstwo': 'Istota o boskiej mocy pochodząca z Olimpu.',
  'Duch': 'Eteryczny byt błąkający się po krainie cieni.',
  'Potępieniec': 'Dusza skazana na wieczne potępienie w podziemiach.',
  'Cierń': 'Agresywna flora lub fauna o kolczastym wyglądzie.',
  'Nimfa': 'Piękna i niebezpieczna istota związana z wodą lub lasem.',
  'Człowiek': 'Najliczniejsza rasa, wszechstronna i ambitna.',
  'Ork': 'Silna i brutalna rasa wojowników o zielonej skórze.',
  'Minotaur': 'Pół-człowiek, pół-byk, o ogromnej sile fizycznej.',
  'Dwarf': 'Wytrzymały krasnolud, doskonały rzemieślnik i górnik.',
  'Elf': 'Długowieczna istota o smukłej sylwetce i magicznych zdolnościach.',
  'Przedmiot': 'Ożywiony obiekt o magicznych właściwościach.',
  'Zwierzak': 'Zwierzęcy bohater o ludzkich cechach.',
  'Postać ludzka': 'Klasyczny bohater w kreskówkowym wydaniu.',
  'Stwór': 'Fantastyczna bestia o unikalnej fizjologii.',
  'Kreskówka': 'Bohater o silnie przerysowanych i dynamicznych kształtach.'
};

const CLASS_DESCRIPTIONS: Record<string, string> = {
  'Wojownik': 'Podstawowa klasa skupiona na walce i obronie.',
  'Mag': 'Użytkownik zakazanej wiedzy i potężnych zaklęć.',
  'Zabójca': 'Specjalista od eliminacji celów z zaskoczenia.',
  'Strażnik': 'Nieustępliwy obrońca, mur nie do przebicia.',
  'Berserker': 'Wojownik wpadający w szał bojowy, ignorujący ból.',
  'Żołnierz': 'Zdyscyplinowany profesjonalista z nowoczesnym arsenałem.',
  'Ninja': 'Cichy zabójca z przyszłości, mistrz katan.',
  'Budowniczy': 'Inżynier tworzący fortyfikacje i maszyny.',
  'Specjalista': 'Ekspert w wąskiej dziedzinie technologicznej.',
  'Legenda': 'Postać o statusie mitycznym, budząca powszechny szacunek.',
  'Posłaniec': 'Szybka postać dostarczająca wieści między sferami.',
  'Buntownik': 'Walczący przeciwko narzuconemu porządkowi.',
  'Wyrocznia': 'Osoba widząca przyszłość i przeznaczenie.',
  'Knight': 'Szlachetny rycerz o potężnym pancerzu.',
  'Paladin': 'Święty wojownik łączący siłę z magią światła.',
  'Sorcerer': 'Czarownik czerpiący moc bezpośrednio z otchłani.',
  'Druid (Tibia)': 'Mistrz natury i uzdrawiania w świecie Tibii.',
  'Elite Knight': 'Najpotężniejsza forma rycerza, lider na polu bitwy.',
  'Awanturnik': 'Bohater szukający guza w każdym zakamarku.',
  'Boss': 'Potężny przeciwnik o unikalnych umiejętnościach.',
  'Sidekick': 'Pomocnik głównego bohatera, zawsze wierny i gotowy.',
  'Bohater (Cuphead)': 'Klasyczna pozytywna postać z animacji.',
  'Kanciarz': 'Postać o śliskim charakterze, zawsze spadająca na cztery łapy.'
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
  originalUrl?: string;
}

export const AvatarGenerator: React.FC = () => {
  const { styleConfig, currentStyle } = useStyle();

  const storageKey = `sanctuary_avatars_${currentStyle}`;
  const settingsKey = `sanctuary_avatars_settings_${currentStyle}`;

  const [prompt, setPrompt] = useState(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      return saved ? JSON.parse(saved).prompt || '' : '';
    } catch { return ''; }
  });

  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState<Result[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [bgMode, setBgMode] = useState<'transparent' | 'green' | 'themed'>(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (!saved) return 'transparent';
      return JSON.parse(saved).bgMode || 'transparent';
    } catch { return 'transparent'; }
  });

  const [bgTag, setBgTag] = useState(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (!saved) return '';
      return JSON.parse(saved).bgTag || '';
    } catch { return ''; }
  });

  const [model, setModel] = useState(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (!saved) return 'free-pollinations';
      return JSON.parse(saved).model || 'free-pollinations';
    } catch { return 'free-pollinations'; }
  });

  const [genMale, setGenMale] = useState(true);
  const [genFemale, setGenFemale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTags, setSelectedTags] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (!saved) return {};
      return JSON.parse(saved).selectedTags || {};
    } catch { return {}; }
  });

  React.useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(results));
  }, [results, storageKey]);

  React.useEffect(() => {
    localStorage.setItem(settingsKey, JSON.stringify({
      bgMode,
      bgTag,
      model,
      selectedTags,
      prompt // Teraz prompt jest zapisywany
    }));
  }, [bgMode, bgTag, model, selectedTags, prompt, settingsKey]);

  // Efekt synchronizacji przy zmianie stylu
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

  const toggleTag = (category: string, value: string) => {
    setSelectedTags(prev => ({
      ...prev,
      [category]: prev[category] === value ? '' : value
    }));
  };

  const getFullPrompt = (gender: string) => {
    const parts = [gender];
    Object.values(selectedTags).forEach(v => v && parts.push(v));
    if (prompt) parts.push(prompt);

    const bgStr = bgMode === 'transparent' ? 'transparent background, isolated subject' :
      bgMode === 'green' ? 'on neon green background #00FF00' :
        (bgTag || 'themed background');

    return `${parts.join(', ')}, centered, full body shot, masterpiece, best quality, 8k, ${bgStr}, no text, ${styleConfig.artStyle}, ${styleConfig.negative}`;
  };

  const handleGenerate = async () => {
    if (!prompt && Object.keys(selectedTags).length === 0) return;
    const gendersToGen = [];
    if (genMale) gendersToGen.push('Male');
    if (genFemale) gendersToGen.push('Female');
    if (gendersToGen.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      for (const g of gendersToGen) {
        const fullPrompt = getFullPrompt(g);
        const { url, modelUsed } = await generateAvatar(fullPrompt, model);
        let finalUrl = url;
        if (bgMode === 'transparent') {
          finalUrl = await processRemoveBg(url, 'white');
        }
        setResults(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          url: finalUrl,
          gender: g === 'Male' ? 'Męski' : 'Żeński',
          isRemovingBg: false,
          status: 'success',
          originalPrompt: prompt,
          fullFinalPrompt: fullPrompt,
          modelUsed,
          originalUrl: url
        }, ...prev]);
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
      const newUrl = await processRemoveBg(item.url, 'white');
      setResults(prev => prev.map(r => r.id === id ? { ...r, url: newUrl, isRemovingBg: false } : r));
    } catch (e) {
      setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
    }
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
      setResults(prev => prev.map(r => r.id === id ? { ...r, isRemovingBg: false } : r));
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto p-4 transition-colors duration-500">
      {/* GŁÓWNY PANEL GENERATORA */}
      <div className="premium-glass p-8 rounded-[2.5rem] space-y-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <label className="text-stone-500 text-[12px] font-black uppercase tracking-[0.3em]">Ustawienia Postaci</label>

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
                  className={`relative px-4 py-2 text-[10px]font-black uppercase rounded-lg transition-all ${bgMode === mode.id ? 'bg-red-900/40 text-red-200' : 'text-stone-600 hover:text-stone-400'}`}
                  data-tooltip={BG_MODE_DESCRIPTIONS[mode.id]}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-white/10 mx-1 hidden md:block"></div>

            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" data-tooltip="Generuj postać męską">
                <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${genMale ? 'bg-red-600 border-red-600' : 'border-stone-700'}`}>
                  {genMale && <span className="text-white text-[10px]">✓</span>}
                </div>
                <input type="checkbox" checked={genMale} onChange={e => setGenMale(e.target.checked)} className="hidden" />
                <span className={`text-[9px]font-black tracking-widest ${genMale ? 'text-white' : 'text-stone-600'}`}>M</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" data-tooltip="Generuj postać żeńską">
                <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${genFemale ? 'bg-red-600 border-red-600' : 'border-stone-700'}`}>
                  {genFemale && <span className="text-white text-[10px]">✓</span>}
                </div>
                <input type="checkbox" checked={genFemale} onChange={e => setGenFemale(e.target.checked)} className="hidden" />
                <span className={`text-[9px]font-black tracking-widest ${genFemale ? 'text-white' : 'text-stone-600'}`}>K</span>
              </label>
            </div>

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-black-40-themed border border-white/5 text-stone-500 text-[10px] font-black p-2 rounded-xl outline-none cursor-pointer hover:text-stone-300 transition-colors"
              data-tooltip="Zmień model AI"
            >
              <option value="free-pollinations">MOC PUSTKI</option>
              <option value="gemini-2.5-flash-image">GEMINI FLASH</option>
            </select>
          </div>
        </div>

        {/* Kategorie Tagów */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-white/5">
          {bgMode === 'themed' && (
            <div className="lg:col-span-3 p-6 bg-red-900/10 rounded-3xl border border-red-900/20 shadow-inner">
              <label className="text-[10px] font-black text-red-700 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                Skażenie Otoczenia
              </label>
              <div className="flex flex-wrap gap-2">
                {styleConfig.backgroundTags.map(tag => (
                  <button key={tag} onClick={() => setBgTag(bgTag === tag ? '' : tag)} className={`tag-button ${bgTag === tag ? 'active' : ''}`}>{tag}</button>
                ))}
              </div>
            </div>
          )}

          {Object.entries(HERO_TAGS[currentStyle as keyof typeof HERO_TAGS] || HERO_TAGS.diablo).map(([category, values]) => (
            <div
              key={category}
              className={`p-6 bg-black-40-themed rounded-[2rem]border border-white/5 hover: border-white/10 transition-all space-y-4 shadow-sm ${category === 'pose' ? 'lg:col-span-2' : ''}`}
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em]">
                  {category === 'race' ? '🧬 Rasa' :
                    category === 'class' ? '🛡️ Klasa' :
                      category === 'trait' ? '✨ Atrybut' :
                        category === 'pose' ? '🧘 Poza' : '🎨 Styl'}
                </label>
                {selectedTags[category] && (
                  <span className="text-[9px] font-bold text-red-500/80 animate-pulse uppercase tracking-widest">Wybrano</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {values.map(val => (
                  <button
                    key={val}
                    onClick={() => toggleTag(category, val)}
                    className={`tag-button ${selectedTags[category] === val ? 'active' : ''}`}
                    data-tooltip={
                      category === 'render' ? RENDER_DESCRIPTIONS[val] :
                        category === 'pose' ? POSE_DESCRIPTIONS[val] :
                          category === 'race' ? RACE_DESCRIPTIONS[val] :
                            category === 'class' ? CLASS_DESCRIPTIONS[val] : undefined
                    }
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Szepty w Otchłani (Własny Opis)</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="custom-textarea"
            placeholder="Opisz swojego bohatera, jego wygląd, zbroję, moc..."
          />
          <PromptDisplay label="Zapis Przeznaczenia" text={getFullPrompt(genMale ? 'Male' : 'Female')} colorClass="text-red-900" />
        </div>

        <DiabloButton
          onClick={handleGenerate}
          isLoading={loading}
          className="w-full !py-6 text-base !bg-red-900/20 !border-red-600/40 !text-red-400 group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            🔥 KUJ BOHATERA
          </span>
        </DiabloButton>

        {error && <p className="text-red-500 text-center text-xs font-black animate-bounce">{error}</p>}
      </div>

      {/* WYNIKI */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 text-[10px] font-black text-stone-700 uppercase tracking-[0.5em]">
          <div className="flex-1 h-px bg-white/5"></div>
          Galeria Przeznaczenia
          <div className="flex-1 h-px bg-white/5"></div>
        </div>

        {results.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-10 border-2 border-dashed border-stone-800 rounded-[3rem]">
            <span className="text-6xl mb-4">⚔️</span>
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Pustka czeka na Twoją wizję</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
            {results.map((res) => (
              <div key={res.id} className="result-card group">
                <div className="p-4 flex justify-between items-center bg-black-20-themed border-b border-white/5">
                  <div className="flex gap-2 items-center">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{res.gender}</span>
                    <span className="text-stone-700">/</span>
                    <span className="text-[8px] text-stone-500 font-bold uppercase">{res.modelUsed?.split('-')[0] || 'AI'}</span>
                  </div>
                  <button onClick={() => setResults(prev => prev.filter(r => r.id !== res.id))} className="text-stone-600 hover:text-red-500 transition-colors" data-tooltip="Usuń z galerii">✕</button>
                </div>

                <div className="relative aspect-square m-6 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl bg-black/40 checkerboard-grid">
                  <img
                    src={res.url}
                    alt="Bohater"
                    className={`w-full h-full object-contain p-4 transition-all duration-700 ${res.isRemovingBg ? 'scale-90 opacity-40 blur-md' : 'group-hover:scale-105'}`}
                  />
                  {res.isRemovingBg && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                      <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                <div className="p-6 pt-0 space-y-3">
                  <div className="flex items-center justify-between bg-black-40-themed rounded-xl p-2 border border-white/5">
                    <span className="text-[9px] font-black text-stone-600 uppercase ml-2 tracking-widest">Krawędzie</span>
                    <div className="flex gap-2">
                      <button onClick={() => modifyEdge(res.id, 1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-red-500 hover:border-red-500 transition-all font-black" data-tooltip="Zwężaj kontur">-</button>
                      <button onClick={() => modifyEdge(res.id, -1)} className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-800 text-emerald-500 hover:border-emerald-500 transition-all font-black text-[10px]" data-tooltip="Cofnij zmiany">↺</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => downloadImage(res.url, `hero_${res.id}.png`)} className="col-span-2 py-3 rounded-xl bg-red-600/10 border border-red-600/20 text-[10px] font-black uppercase text-red-400 hover:bg-red-600/20 transition-all" data-tooltip="Zapisz na dysku">Pobierz PNG</button>
                    <button onClick={() => makeToken(res.id)} className="py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[9px] font-black uppercase hover:bg-white/5 transition-all text-white/50" data-tooltip="Stwórz żeton VTT">Token</button>
                    <button onClick={() => removeBg(res.id)} className="py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[9px] font-black uppercase hover:bg-white/5 transition-all text-white/50" data-tooltip="Ponów wycinanie">Wytnij</button>
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
