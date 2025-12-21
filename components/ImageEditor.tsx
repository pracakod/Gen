import React, { useState, useRef } from 'react';
import { DiabloButton } from './DiabloButton';
import { editAvatar } from '../services/geminiService';
import { GeneratedImage } from '../types';
import { ModelSelector, AIModel, useModelSelection } from './ModelSelector';

export const ImageEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedModel, setSelectedModel } = useModelSelection('gemini-2.0-flash');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim() || !selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const imageUrl = await editAvatar(selectedFile, prompt);
      setResult({
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt
      });
    } catch (err) {
      setError("Transmutacja nie powiodła się. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Sekcja wgrywania */}
      <div className="bg-black/40 p-6 border border-stone-800 backdrop-blur-sm relative">
        <label className="block font-serif text-amber-500 mb-4 text-lg uppercase tracking-wider text-center">
          📷 Wgraj Obraz do Edycji
        </label>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-700 hover:border-red-800 bg-stone-950/50 cursor-pointer p-8 flex flex-col items-center justify-center transition-colors min-h-[200px]"
        >
          {selectedFile ? (
            <div className="relative w-full max-w-xs aspect-square">
              <img src={selectedFile} alt="Oryginał" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white font-serif uppercase">Zmień obraz</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-stone-500">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p className="font-serif">Kliknij, aby wybrać plik</p>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {/* Sekcja promptu */}
      {selectedFile && (
        <div className="bg-black/40 p-6 border border-stone-800 backdrop-blur-sm relative animate-slide-up">
          <label className="block font-serif text-amber-500 mb-2 text-lg uppercase tracking-wider">
            ✨ Polecenie Edycji
          </label>
          <p className="text-stone-500 text-sm mb-3">
            Np. "Usuń tło i zastąp ognistym lochem", "Dodaj świecący miecz", "Zrób zbroję złotą"
          </p>

          {/* Wybór modelu */}
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            showImageModels={true}
          />

          <div className="flex gap-4 flex-col sm:flex-row">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Opisz jak chcesz zmienić ten obraz..."
              className="flex-1 bg-stone-950/90 border border-stone-700 text-stone-200 p-4 focus:border-red-700 focus:ring-1 focus:ring-red-900 outline-none transition-all min-h-[80px] font-sans resize-none"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <DiabloButton onClick={handleEdit} isLoading={loading} disabled={!prompt.trim()}>
              🔮 Transmutuj
            </DiabloButton>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 text-red-400 font-serif text-center">
          {error}
        </div>
      )}

      {/* Porównanie wyników */}
      {result && selectedFile && (
        <div className="flex flex-col items-center gap-6 mt-4">
          <h3 className="font-diablo text-2xl text-amber-500 text-center">✅ Transmutacja Zakończona</h3>

          <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-stretch">
            {/* Przed */}
            <div className="flex-1 max-w-md relative p-1 border border-stone-800 bg-stone-900">
              <span className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-xs text-stone-400 uppercase font-serif z-10">Oryginał</span>
              <img src={selectedFile} alt="Oryginał" className="w-full h-full object-cover opacity-60" />
            </div>

            {/* Strzałka */}
            <div className="flex items-center justify-center text-amber-600">
              <svg className="w-8 h-8 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>

            {/* Po */}
            <div className="flex-1 max-w-md relative p-1 bg-gradient-to-b from-amber-700 via-red-900 to-black shadow-2xl shadow-red-900/20">
              <span className="absolute top-2 left-2 bg-black/70 px-2 py-1 text-xs text-amber-500 uppercase font-serif z-10 border border-amber-900/50">Przekuty</span>
              <img src={result.url} alt="Wynik" className="w-full h-full object-cover" />
              {/* Narożniki */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t border-l border-amber-500"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t border-r border-amber-500"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b border-l border-amber-500"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b border-r border-amber-500"></div>
            </div>
          </div>

          <a
            href={result.url}
            download={`edytowany-obraz-${result.id}.png`}
            className="text-stone-500 hover:text-amber-500 text-sm font-serif uppercase tracking-widest mt-2 border-b border-transparent hover:border-amber-500 transition-colors"
          >
            📥 Pobierz Wynik
          </a>
        </div>
      )}
    </div>
  );
};
