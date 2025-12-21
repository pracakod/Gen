// components/ModelSelector.tsx

import React from 'react';

export type AIModel = 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'imagen-3';

interface ModelSelectorProps {
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
    showImageModels?: boolean;
}

const TEXT_MODELS: { id: AIModel; label: string; desc: string }[] = [
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Najszybszy' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Najdokładniejszy' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Zbalansowany' },
];

const IMAGE_MODELS: { id: AIModel; label: string; desc: string }[] = [
    { id: 'imagen-3', label: 'Imagen 3', desc: 'Generowanie obrazów' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Multimodal' },
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    selectedModel,
    onModelChange,
    showImageModels = false
}) => {
    const models = showImageModels ? IMAGE_MODELS : TEXT_MODELS;

    return (
        <div className="bg-black/40 border border-stone-800 rounded p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-stone-500 text-[9px] uppercase font-serif">🤖 Model AI</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {models.map(model => (
                    <button
                        key={model.id}
                        onClick={() => onModelChange(model.id)}
                        className={`
                            px-3 py-2 text-[10px] border rounded transition-all
                            ${selectedModel === model.id
                                ? 'border-cyan-500 bg-cyan-900/20 text-cyan-100'
                                : 'border-stone-700 bg-black text-stone-500 hover:text-stone-300'
                            }
                        `}
                    >
                        <div className="font-bold">{model.label}</div>
                        <div className="text-[8px] opacity-70">{model.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Hook do przechowywania wybranego modelu
export const useModelSelection = (defaultModel: AIModel = 'gemini-2.0-flash') => {
    const [selectedModel, setSelectedModel] = React.useState<AIModel>(defaultModel);
    return { selectedModel, setSelectedModel };
};
