import React, { useState } from 'react';
import { useStyle } from './contexts/StyleContext';
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
    switch (activeTab) {
      case 'characters': return currentStyle === 'cyberpunk' ? 'Stwórz Soloistę' : currentStyle === 'pixelart' ? 'Stwórz Bohatera' : 'Przyzwij Nowego Bohatera';
      case 'items': return currentStyle === 'cyberpunk' ? 'Chrome & Hardware' : currentStyle === 'pixelart' ? 'Wykuj Przedmiot' : 'Wykuj Legendarny Przedmiot';
      case 'monsters': return currentStyle === 'cyberpunk' ? 'Cyberpsychozy' : currentStyle === 'pixelart' ? 'Bestie' : 'Otwórz Wrota Piekieł';
      case 'mounts': return currentStyle === 'cyberpunk' ? 'Pojazdy' : currentStyle === 'pixelart' ? 'Wierzchowce' : 'Stajnie Sanktuarium';
      case 'pets': return currentStyle === 'cyberpunk' ? 'Drony & Boty' : currentStyle === 'pixelart' ? 'Towarzysze' : 'Mroczni Towarzysze';
      case 'locations': return currentStyle === 'cyberpunk' ? 'Night City Dzielnice' : currentStyle === 'pixelart' ? 'Mapy' : 'Architektura Grozy';
      case 'lore': return currentStyle === 'cyberpunk' ? 'Dane z Sieci' : currentStyle === 'pixelart' ? 'Legendy' : 'Kroniki Sanktuarium';
      case 'sprites': return currentStyle === 'cyberpunk' ? 'Sprite Generator' : currentStyle === 'pixelart' ? 'Pixel Sprite' : 'Sprite Sheet';
      case 'photoshop': return '🎨 PhotoSzopa';
    }
  };

  const getHeaderDesc = () => {
    switch (activeTab) {
      case 'characters': return currentStyle === 'cyberpunk' ? 'Stwórz najemnika, netrunnera lub korpo-szczura.' : currentStyle === 'pixelart' ? 'Pikselowy bohater w stylu retro.' : 'Opisz swojego czempiona.';
      case 'items': return currentStyle === 'cyberpunk' ? 'Cybernetyka, broń i sprzęt high-tech.' : currentStyle === 'pixelart' ? 'Miecze, zbroje i artefakty 16-bit.' : 'Broń, pancerz lub artefakt.';
      case 'monsters': return currentStyle === 'cyberpunk' ? 'Cyberpsychole i zmutowane kreatury.' : currentStyle === 'pixelart' ? 'Pixelowe bosssy i wrogowie.' : 'Demony i bestie z otchłani.';
      case 'mounts': return currentStyle === 'cyberpunk' ? 'Motory, samochody, AV.' : currentStyle === 'pixelart' ? 'Konie, smoki, statki.' : 'Wierzchowce grozy.';
      case 'pets': return currentStyle === 'cyberpunk' ? 'Drony bojowe i towarzysze AI.' : currentStyle === 'pixelart' ? 'Pixel-art towarzysze.' : 'Chowańce i zwierzęta.';
      case 'locations': return currentStyle === 'cyberpunk' ? 'Neonowe ulice i megabudynki.' : currentStyle === 'pixelart' ? 'Mapy i tła gry.' : 'Lochy i katedry.';
      case 'lore': return currentStyle === 'cyberpunk' ? 'Historia z sieci i plotki.' : currentStyle === 'pixelart' ? 'Opisy w stylu retro.' : 'Opisy, biografie i statystyki.';
      case 'sprites': return 'Generuj sprite sheets z 8 kierunków do gier 2D.';
      case 'photoshop': return 'Narzędzia graficzne: ikony, usuwanie tła, edycja, warstwy.';
    }
  };

  const getGradientClass = () => {
    switch (currentStyle) {
      case 'cyberpunk': return 'from-purple-900 via-cyan-500 to-pink-500';
      case 'pixelart': return 'from-slate-900 via-emerald-500 to-yellow-400';
      default: return 'from-black via-red-900 to-black';
    }
  };

  const getBgClass = () => {
    switch (currentStyle) {
      case 'cyberpunk': return 'bg-gray-950';
      case 'pixelart': return 'bg-slate-950';
      default: return 'bg-sanctuary-900 bg-diablo-pattern';
    }
  };

  const getAccentColor = () => {
    switch (currentStyle) {
      case 'cyberpunk': return 'text-cyan-400';
      case 'pixelart': return 'text-emerald-400';
      default: return 'text-red-800';
    }
  };

  const navButton = (id: Tab, label: string, colorClass: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-3 md:px-5 py-2 font-serif uppercase tracking-widest text-[10px] md:text-xs border transition-all duration-300 ${activeTab === id ? `${colorClass} border-current opacity-100` : 'bg-black/40 border-stone-800 text-stone-500 hover:text-stone-300'} clip-path-slant shrink-0`}
    >
      {label}
    </button>
  );

  const getNavColors = () => {
    if (currentStyle === 'cyberpunk') {
      return {
        characters: 'bg-cyan-900/40 text-cyan-100',
        items: 'bg-pink-900/40 text-pink-100',
        monsters: 'bg-red-900/40 text-red-100',
        locations: 'bg-purple-900/40 text-purple-100',
        lore: 'bg-blue-900/40 text-blue-100',
        mounts: 'bg-orange-900/40 text-orange-100',
        pets: 'bg-green-900/40 text-green-100',
      };
    } else if (currentStyle === 'pixelart') {
      return {
        characters: 'bg-emerald-900/40 text-emerald-100',
        items: 'bg-yellow-900/40 text-yellow-100',
        monsters: 'bg-red-900/40 text-red-100',
        locations: 'bg-blue-900/40 text-blue-100',
        lore: 'bg-purple-900/40 text-purple-100',
        mounts: 'bg-orange-900/40 text-orange-100',
        pets: 'bg-teal-900/40 text-teal-100',
      };
    }
    return {
      characters: 'bg-red-900/40 text-red-100',
      items: 'bg-amber-900/40 text-amber-100',
      monsters: 'bg-purple-900/40 text-purple-100',
      locations: 'bg-stone-800 text-stone-100',
      lore: 'bg-yellow-900/40 text-yellow-100',
      mounts: 'bg-orange-900/40 text-orange-100',
      pets: 'bg-teal-900/40 text-teal-100',
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
          {navButton('characters', currentStyle === 'cyberpunk' ? 'Soliści' : 'Bohaterowie', navColors.characters)}
          {navButton('items', currentStyle === 'cyberpunk' ? 'Cyberware' : 'Ekwipunek', navColors.items)}
          {navButton('monsters', currentStyle === 'cyberpunk' ? 'Wrogowie' : 'Potwory', navColors.monsters)}
          {navButton('locations', currentStyle === 'cyberpunk' ? 'Dzielnice' : 'Lokacje', navColors.locations)}
          {navButton('lore', currentStyle === 'cyberpunk' ? 'Dane' : 'Kroniki', navColors.lore)}
          {navButton('mounts', currentStyle === 'cyberpunk' ? 'Pojazdy' : 'Wierzchowce', navColors.mounts)}
          {navButton('pets', currentStyle === 'cyberpunk' ? 'Drony' : 'Towarzysze', navColors.pets)}
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
