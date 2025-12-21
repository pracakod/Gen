import React, { useState } from 'react';
import { useStyle } from './contexts/StyleContext';
import { getStyleColors } from './services/gameStyles';
import { StyleSelector } from './components/StyleSelector';
import { AvatarGenerator } from './components/AvatarGenerator';
import { ItemGenerator } from './components/ItemGenerator';
import { LocationGenerator } from './components/LocationGenerator';
import { MonsterGenerator } from './components/MonsterGenerator';
import { LoreGenerator } from './components/LoreGenerator';
import { MountGenerator } from './components/MountGenerator';
import { PetGenerator } from './components/PetGenerator';
import { PhotoShop } from './components/PhotoShop';
import { SpriteGenerator } from './components/SpriteGenerator';

type Tab = 'characters' | 'items' | 'monsters' | 'mounts' | 'pets' | 'locations' | 'lore' | 'sprites' | 'photoshop';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('characters');
  const { styleConfig, currentStyle } = useStyle();

  const getHeaderTitle = () => {
    const labels = styleConfig.tabLabels;
    switch (activeTab) {
      case 'characters': return `Kreacja: ${labels.characters}`;
      case 'items': return `Arsenał: ${labels.items}`;
      case 'monsters': return `Bestiariusz: ${labels.monsters}`;
      case 'locations': return `Sceneria: ${labels.locations}`;
      case 'lore': return `Archiwum: ${labels.lore}`;
      case 'mounts': return `Transport: ${labels.mounts}`;
      case 'pets': return `Towarzysze: ${labels.pets}`;
      case 'sprites': return 'Generator Sprite Sheets';
      case 'photoshop': return '🎨 PhotoSzopa';
    }
  };

  const getHeaderDesc = () => {
    const labels = styleConfig.tabLabels;
    switch (activeTab) {
      case 'characters': return `Zaprojektuj unikalny wygląd i cechy dla ${labels.characters.toLowerCase()}.`;
      case 'items': return `Wykuj potężny sprzęt i ${labels.items.toLowerCase()} dla swoich bohaterów.`;
      case 'monsters': return `Przywołaj groźne ${labels.monsters.toLowerCase()} do swojego świata gry.`;
      case 'locations': return `Stwórz tła i ${labels.locations.toLowerCase()} budujące klimat przygody.`;
      case 'lore': return `Spisz historię, ${labels.lore.toLowerCase()} i sekrety swojego uniwersum.`;
      case 'mounts': return `Zapewnij transport wybierając najlepsze ${labels.mounts.toLowerCase()}.`;
      case 'pets': return `Dodaj charakteru poprzez ${labels.pets.toLowerCase()} towarzyszące postaciom.`;
      case 'sprites': return 'Generuj gotowe arkusze animacji z 8 kierunków do gier 2D.';
      case 'photoshop': return 'Narzędzia do edycji: usuwanie tła, tworzenie tokenów VTT i warstw.';
    }
  };

  const getGradientClass = () => {
    return getStyleColors(currentStyle).gradient;
  };

  const getBgClass = () => {
    if (currentStyle === 'diablo') return 'bg-sanctuary-900 bg-diablo-pattern';
    return `bg-${getStyleColors(currentStyle).bg}`;
  };

  const getAccentColor = () => {
    return `text-${getStyleColors(currentStyle).accent}`;
  };

  const navButton = (id: Tab, label: string, colorClass: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 md:px-5 py-2 font-serif uppercase tracking-widest text-[10px] md:text-xs border transition-all duration-300 ${activeTab === id ? `${colorClass} border-current opacity-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]` : 'bg-black/40 border-stone-800 text-stone-500 hover:text-stone-300'} clip-path-slant shrink-0`}
    >
      {label}
    </button>
  );

  const getNavColors = () => {
    const colors = getStyleColors(currentStyle);
    const accent = colors.accent.replace('text-', '').replace('bg-', '');
    const primary = colors.primary.replace('text-', '').replace('bg-', '');
    const secondary = colors.secondary.replace('text-', '').replace('bg-', '');

    return {
      characters: `bg-${primary}/60 text-white shadow-lg shadow-${primary}/20`,
      items: `bg-${accent}/60 text-white shadow-lg shadow-${accent}/20`,
      monsters: `bg-${secondary}/60 text-white shadow-lg shadow-${secondary}/20`,
      locations: `bg-stone-700 text-white`,
      lore: `bg-${primary}/40 text-white`,
      mounts: `bg-${accent}/40 text-white`,
      pets: `bg-${secondary}/40 text-white`,
    };
  };

  const navColors = getNavColors();

  return (
    <div className={`min-h-screen w-full ${getBgClass()} text-stone-200 overflow-x-hidden`}>
      <div className={`h-1 w-full bg-gradient-to-r ${getGradientClass()}`}></div>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <header className="text-center mb-8 md:mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent -z-10"></div>
          <h1 className="font-diablo text-4xl md:text-7xl text-stone-100 tracking-tighter blood-text mb-2">
            {styleConfig.headerTitle.split(' ')[0]} <span className={getAccentColor()}>{styleConfig.headerTitle.split(' ').slice(1).join(' ') || 'Forge'}</span>
          </h1>
          <p className="font-serif text-amber-700/80 uppercase tracking-[0.2em] text-xs md:text-base mb-4">
            {styleConfig.tagline}
          </p>

          <StyleSelector />
        </header>

        <nav className="flex flex-wrap justify-center mb-8 gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {navButton('characters', styleConfig.tabLabels.characters, navColors.characters)}
          {navButton('items', styleConfig.tabLabels.items, navColors.items)}
          {navButton('monsters', styleConfig.tabLabels.monsters, navColors.monsters)}
          {navButton('locations', styleConfig.tabLabels.locations, navColors.locations)}
          {navButton('lore', styleConfig.tabLabels.lore, navColors.lore)}
          {navButton('mounts', styleConfig.tabLabels.mounts, navColors.mounts)}
          {navButton('pets', styleConfig.tabLabels.pets, navColors.pets)}
          {navButton('sprites', '🎮 Sprites', 'bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 text-emerald-100')}
          {navButton('photoshop', '📷 PhotoSzopa', 'bg-gradient-to-r from-amber-900/40 to-orange-900/40 text-amber-100')}
        </nav>

        <div className="min-h-[600px] bg-black/20 p-1">
          <section className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="font-serif text-xl md:text-2xl text-stone-300 mb-2">
                {getHeaderTitle()}
              </h2>
              <p className="text-stone-500 text-xs md:text-sm max-w-lg mx-auto">
                {getHeaderDesc()}
              </p>
            </div>

            {activeTab === 'characters' && <AvatarGenerator />}
            {activeTab === 'items' && <ItemGenerator />}
            {activeTab === 'monsters' && <MonsterGenerator />}
            {activeTab === 'locations' && <LocationGenerator />}
            {activeTab === 'lore' && <LoreGenerator />}
            {activeTab === 'mounts' && <MountGenerator />}
            {activeTab === 'pets' && <PetGenerator />}
            {activeTab === 'sprites' && <SpriteGenerator />}
            {activeTab === 'photoshop' && <PhotoShop />}
          </section>
        </div>
      </main>

      <footer className="text-center py-8 text-stone-700 text-[10px] font-serif border-t border-stone-900 mt-12 bg-black">
        <p>Zasilane przez protokół Gemini 3 • {styleConfig.headerTitle}</p>
      </footer>
    </div>
  );
};

export default App;
