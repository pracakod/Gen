
import React, { useState } from 'react';

interface PromptDisplayProps {
    label: string;
    text: string;
    colorClass?: string;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ label, text, colorClass = "text-stone-500" }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                setCopied(true);
            } else {
                throw new Error('Clipboard API not available');
            }
        } catch (err) {
            // Fallback for older browsers or insecure contexts
            const textArea = document.createElement("textarea");
            textArea.value = text;

            // Ensure it's not visible but part of DOM
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    setCopied(true);
                } else {
                    console.error('Fallback copy failed.');
                }
            } catch (e) {
                console.error('Fallback copy error:', e);
            }

            document.body.removeChild(textArea);
        }

        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-stone-950 p-3 border border-stone-800 relative group min-h-[50px]">
            <p className={`text-[8px] font-serif uppercase mb-1 ${label.includes('Kobiet') ? 'text-pink-500' : label.includes('Mężczyzn') ? 'text-blue-500' : 'text-amber-600'}`}>
                {label}:
            </p>
            <p className={`text-[10px] italic leading-tight pr-8 break-words ${colorClass}`}>
                "{text}"
            </p>

            <button
                onClick={copyToClipboard}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors ${copied ? 'text-green-500' : 'text-stone-700 hover:text-amber-500'}`}
                title="Kopiuj Prompt"
            >
                {copied ? (
                    <span className="text-[8px] font-bold uppercase animate-fade-in">Skopiowano!</span>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                )}
            </button>
        </div>
    );
};
