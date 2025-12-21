
import React, { useState } from 'react';
import { DiabloButton } from './DiabloButton';

export const Laboratory: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in border-2 border-stone-800 bg-stone-900/50">
            <h2 className="font-diablo text-2xl text-green-700 mb-4">Laboratorium w budowie</h2>
            <p className="font-serif text-stone-500 mb-8 max-w-md">
                Gnomy wciąż pracują nad aparaturą do łączenia artefaktów.
                Wróć później, Wędrowcze.
            </p>
            <div className="opacity-50 grayscale">
                <img src="https://image.pollinations.ai/prompt/alchemy%20lab%20diablo%20style%20dark?width=300&height=300&nologo=true" className="w-48 h-48 object-cover border border-stone-800 rounded-full" />
            </div>
        </div>
    );
};
