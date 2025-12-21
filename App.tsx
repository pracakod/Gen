
import React, { useState } from 'react';
import { AvatarGenerator } from './components/AvatarGenerator';
import { ItemGenerator } from './components/ItemGenerator';

import { LocationGenerator } from './components/LocationGenerator';
import { MonsterGenerator } from './components/MonsterGenerator';
import { LoreGenerator } from './components/LoreGenerator';
import { Laboratory } from './components/Laboratory';
import { BackgroundRemover } from './components/BackgroundRemover';
import { MountGenerator } from './components/MountGenerator';
import { PetGenerator } from './components/PetGenerator';
import { IconMaker } from './components/IconMaker';

type Tab = 'characters' | 'items' | 'monsters' | 'mounts' | 'pets' | 'locations' | 'lore' | 'icon-maker' | 'cleaner' | 'lab';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('characters');

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'characters': return 'Przyzwij Nowego Bohatera';
      case 'items': return 'Wykuj Legendarny Przedmiot';
      case 'monsters': return 'Otwórz Wrota Piekieł';
      case 'mounts': return 'Stajnie Sanktuarium';
      case 'pets': return 'Mroczni Towarzysze';
      case 'locations': return 'Architektura Grozy';
      case 'lore': return 'Kroniki Sanktuarium';
      case 'icon-maker': return 'Warsztat Ikon UI';
      case 'lab': return 'Laboratorium Hybrydowe';
      case 'cleaner': return 'Oczyszczalnia Artefaktów';
    }
  };

  const getHeaderDesc = () => {
    switch (activeTab) {
      case 'characters': return 'Opisz swojego czempiona. Kuźnia zmaterializuje go z pustki.';
      case 'items': return 'Opisz broń, pancerz lub artefakt. Zostanie wykuty w zielonym blasku.';
      case 'monsters': return 'Stwórz demony i bestie do Twojej armii ciemności.';
      case 'mounts': return 'Przyzwij wierzchowca, który poniesie Cię przez krainy grozy.';
      case 'pets': return 'Stwórz chowańca lub zwierzę, które będzie Ci towarzyszyć w boju.';
      case 'locations': return 'Projektuj mroczne lochy i katedry jako tła do gry.';
      case 'lore': return 'Generuj opisy, biografie i statystyki dla swoich znalezisk.';
      case 'icon-maker': return 'Zmień zdjęcie w gotową ikonę z tłem i ramką.';
      case 'lab': return 'Łącz artefakty na warstwach bez pomocy magii AI.';
      case 'cleaner': return 'Usuń zieloną skazę tła z dowolnego artefaktu.';
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

  return (
    <div className="min-h-screen w-full bg-sanctuary-900 bg-diablo-pattern text-stone-200 overflow-x-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-black via-red-900 to-black"></div>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <header className="text-center mb-8 md:mb-10 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent -z-10"></div>
          <h1 className="font-diablo text-4xl md:text-7xl text-stone-100 tracking-tighter blood-text mb-2">
            Kuźnia <span className="text-red-800">Sanktuarium</span>
          </h1>
          <p className="font-serif text-amber-700/80 uppercase tracking-[0.2em] text-xs md:text-base">
            Twórz. Walcz. Zwyciężaj.
          </p>
        </header>

        <nav className="flex flex-wrap justify-center mb-8 gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {navButton('characters', 'Bohaterowie', 'bg-red-900/40 text-red-100')}
          {navButton('items', 'Ekwipunek', 'bg-amber-900/40 text-amber-100')}
          {navButton('monsters', 'Potwory', 'bg-purple-900/40 text-purple-100')}
          {navButton('locations', 'Lokacje', 'bg-stone-800 text-stone-100')}
          {navButton('lore', 'Kroniki', 'bg-yellow-900/40 text-yellow-100')}
          {navButton('icon-maker', 'Warsztat Ikon', 'bg-amber-700/40 text-amber-100')}
          {navButton('mounts', 'Wierzchowce', 'bg-orange-900/40 text-orange-100')}
          {navButton('pets', 'Towarzysze', 'bg-teal-900/40 text-teal-100')}
          {navButton('cleaner', 'Oczyszczalnia', 'bg-blue-900/40 text-blue-100')}
          {navButton('lab', 'Laboratorium', 'bg-green-900/40 text-green-100')}
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
            {activeTab === 'icon-maker' && <IconMaker />}
            {activeTab === 'lab' && <Laboratory />}
            {activeTab === 'cleaner' && <BackgroundRemover />}
          </section>
        </div>
      </main>

      <footer className="text-center py-8 text-stone-700 text-[10px] font-serif border-t border-stone-900 mt-12 bg-black">
        <p>Zasilane przez protokół Gemini 3 • Wyrocznia Sanktuarium</p>
      </footer>
    </div>
  );
};

export default App;
