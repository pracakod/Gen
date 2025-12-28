import React, { useState } from 'react';
import { useStyle } from './contexts/StyleContext';
import { getStyleColors } from './services/gameStyles';
import { StyleSelector } from './components/StyleSelector';
import { ThemeToggle } from './components/ThemeToggle';
import { AvatarGenerator } from './components/AvatarGenerator';
import { ItemGenerator } from './components/ItemGenerator';
import { LocationGenerator } from './components/LocationGenerator';
import { MonsterGenerator } from './components/MonsterGenerator';
import { LoreGenerator } from './components/LoreGenerator';
import { MountGenerator } from './components/MountGenerator';
import { PetGenerator } from './components/PetGenerator';
import { PhotoShop } from './components/PhotoShop';

type Tab = 'characters' | 'items' | 'monsters' | 'mounts' | 'pets' | 'locations' | 'lore';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('characters');
  const [showPhotoShop, setShowPhotoShop] = useState(false);
  const { styleConfig, currentStyle, themeMode } = useStyle();

  const isLight = themeMode === 'light';

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
    }
  };

  const getGradientClass = () => {
    return getStyleColors(currentStyle).gradient;
  };

  const getBgClass = () => {
    if (isLight) return 'bg-[#f8f9fa] text-slate-900';
    if (currentStyle === 'diablo') return 'bg-black bg-diablo-pattern text-stone-200';
    return `bg-black text-stone-200`;
  };

  const navButton = (id: Tab, label: string) => {
    const isActive = activeTab === id;
    const accentColor = getStyleColors(currentStyle).accent;

    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`
          group relative px-5 py-3 transition-all duration-300 flex flex-col items-center gap-1
          ${isActive
            ? (isLight ? 'text-slate-950 font-black' : 'text-white')
            : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-stone-600 hover:text-stone-400')}
        `}
      >
        <span className={`font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:translate-y-[-2px]'}`}>
          {label}
        </span>
        <div className={`h-1 rounded-full transition-all duration-500 ${isActive ? `w-6 bg-${accentColor} shadow-[0_0_10px_rgba(245,158,11,0.5)]` : 'w-0 bg-stone-800'}`} />
      </button>
    );
  };

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${getBgClass()} overflow-x-hidden`}>
      <div className={`h-1 w-full bg-gradient-to-r ${getGradientClass()}`}></div>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-12">
        {/* NAGŁÓWEK / STYLIZACJA */}
        <header className="relative flex flex-col items-center gap-8">
          <div className={`flex justify-between items-center gap-6 border-b ${isLight ? 'border-black/5' : 'border-white/5'} pb-8 min-h-[80px] w-full`}>
            <div className="flex-1" /> {/* Spacer */}
            <StyleSelector />
            <div className="flex-1 flex justify-end">
              <ThemeToggle />
            </div>
          </div>

          {/* PRZYCISK PHOTOSZOPY */}
          <button
            onClick={() => setShowPhotoShop(!showPhotoShop)}
            className={`
              group relative px-8 py-3 rounded-2xl border transition-all duration-500
              ${showPhotoShop
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                : (isLight
                  ? 'bg-white border-slate-200 text-slate-500 hover:border-amber-500/30 hover:text-slate-800 shadow-sm'
                  : 'bg-black/20 border-white/5 text-stone-500 hover:border-amber-500/30 hover:text-stone-300')}
            `}
          >
            <div className={`absolute inset-0 bg-gradient-to-tr from-amber-600/10 via-orange-600/10 to-yellow-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl`} />
            <div className="relative flex items-center gap-3">
              <span className={`text-lg transition-transform duration-500 ${showPhotoShop ? 'scale-125 rotate-12' : 'group-hover:rotate-12'}`}>🎨</span>
              <span className="font-black uppercase tracking-[0.4em] text-[11px]">{showPhotoShop ? 'POWRÓT DO KUŹNI' : 'OTWÓRZ PHOTOSZOPĘ'}</span>
            </div>
          </button>
        </header>

        {/* TRYB PHOTOSZOPY */}
        {showPhotoShop && (
          <div className="animate-fade-in-down space-y-6">
            <div className={`${isLight ? 'bg-white shadow-xl border-slate-100' : 'bg-stone-950/40 border-amber-500/20'} backdrop-blur-2xl rounded-[3rem] border p-2 overflow-hidden relative transition-all duration-500`}>
              {!isLight && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />}
              <PhotoShop />
            </div>
          </div>
        )}

        {/* GENERATORY */}
        {!showPhotoShop && (
          <div className="animate-fade-in space-y-12">
            <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {navButton('characters', styleConfig.tabLabels.characters)}
              {navButton('items', styleConfig.tabLabels.items)}
              {navButton('monsters', styleConfig.tabLabels.monsters)}
              {navButton('locations', styleConfig.tabLabels.locations)}
              {navButton('lore', styleConfig.tabLabels.lore)}
              {navButton('mounts', styleConfig.tabLabels.mounts)}
              {navButton('pets', styleConfig.tabLabels.pets)}
            </nav>

            <div className={`min-h-[600px] ${isLight ? 'bg-white shadow-2xl border-slate-100' : 'bg-black/20 border-white/5'} rounded-[3rem] border p-8 relative overflow-hidden transition-all duration-500 shadow-2xl`}>
              {!isLight && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />}

              <section className="animate-fade-in relative z-10">
                <div className="text-center mb-12">
                  <h2 className={`font-diablo text-2xl md:text-3xl ${isLight ? 'text-slate-900' : 'text-white'} tracking-widest uppercase mb-3`}>
                    {getHeaderTitle()}
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    <div className={`h-px w-12 bg-gradient-to-r from-transparent ${isLight ? 'to-slate-200' : 'to-stone-800'}`} />
                    <p className={`${isLight ? 'text-slate-500' : 'text-stone-500'} text-[10px] md:text-xs font-black uppercase tracking-[0.3em]`}>
                      {getHeaderDesc()}
                    </p>
                    <div className={`h-px w-12 bg-gradient-to-l from-transparent ${isLight ? 'to-slate-200' : 'to-stone-800'}`} />
                  </div>
                </div>

                <div className={isLight ? 'light-content' : ''}>
                  {activeTab === 'characters' && <AvatarGenerator />}
                  {activeTab === 'items' && <ItemGenerator />}
                  {activeTab === 'monsters' && <MonsterGenerator />}
                  {activeTab === 'locations' && <LocationGenerator />}
                  {activeTab === 'lore' && <LoreGenerator />}
                  {activeTab === 'mounts' && <MountGenerator />}
                  {activeTab === 'pets' && <PetGenerator />}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-stone-700/50 text-[9px] font-bold uppercase tracking-[0.3em] mt-16 bg-black/5 border-t border-white/5">
        <p>Stworzone przez DareG TV</p>
      </footer>

      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .light-mode input, .light-mode textarea, .light-mode select {
          background-color: white !important;
          color: #1a1a1a !important;
          border-color: #e2e8f0 !important;
        }
        .light-mode button.bg-slate-800 {
          background-color: #1a1a1a !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
};

export default App;
