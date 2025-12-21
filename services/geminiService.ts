
import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = 'gemini-2.5-flash-image';

/**
 * Czyści prompt do absolutnego minimum dla darmowych modeli, 
 * co zapobiega błędom "404" i "Black Image" na serwerach zewnętrznych.
 */
const cleanPromptForFreeModel = (prompt: string): string => {
  // Usuwamy techniczne parametry i zostawiamy tylko esencję wizualną
  const coreTerms = prompt
    .replace(/BACKGROUND MUST BE SOLID PURE NEON GREEN #00FF00/gi, '')
    .replace(/Diablo 4 concept art/gi, 'dark fantasy art')
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 2 && t.length < 30)
    .slice(0, 4); // Tylko 4 kluczowe słowa

  return coreTerms.join(', ') + ', solid neon green background #00FF00, flat color, no shadows';
};

/**
 * Darmowe źródło: Pollinations.ai (Działa globalnie, w tym w Europie)
 */
export const getFreeImageUrl = (prompt: string): string => {
  const seed = Math.floor(Math.random() * 1000000);
  const clean = encodeURIComponent(cleanPromptForFreeModel(prompt));
  // Dodajemy parametr &nologo i &model=flux dla stabilności
  return `https://image.pollinations.ai/prompt/${clean}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true&model=flux`;
};

/**
 * Główna funkcja generująca obrazy
 */
export interface GeneratedImage {
  url: string;
  modelUsed: string;
}

export const generateAvatar = async (prompt: string, model: string = DEFAULT_MODEL): Promise<GeneratedImage> => {
  if (model === 'free-pollinations') {
    return { url: getFreeImageUrl(prompt), modelUsed: 'Moc Pustki (Free)' };
  }

  // Zawsze tworzymy nową instancję przed użyciem (wymóg bezpieczeństwa)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    // Specjalna obsługa dla modelu Imagen (jeśli dostępny)
    if (model.includes('imagen')) {
      const response = await ai.models.generateImages({
        model: model,
        prompt: prompt,
        config: { numberOfImages: 1, aspectRatio: '1:1' },
      });
      const base64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (base64) return { url: `data:image/png;base64,${base64}`, modelUsed: 'Imagen' };
    }

    // Standardowe generowanie Gemini (Flash/Pro)
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return {
          url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          modelUsed: 'Gemini Flash'
        };
      }
    }

    throw new Error("Gemini nie zwróciło danych obrazu.");
  } catch (error) {
    console.warn("Gemini Error (Region/Quota), przełączam na fallback:", error);
    return { url: getFreeImageUrl(prompt), modelUsed: 'Moc Pustki (Free)' };
  }
};

export const editAvatar = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const match = base64Image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) throw new Error("Format nieobsługiwany.");

  const mimeType = match[1];
  const data = match[2];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ inlineData: { data, mimeType } }, { text: prompt }],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Błąd edycji.");
  } catch (error) {
    throw error;
  }
};

export async function* generateLoreStream(prompt: string, model: string, systemInstruction: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: prompt,
      config: { systemInstruction, temperature: 0.8 },
    });
    for await (const chunk of responseStream) {
      if (chunk.text) yield chunk.text;
    }
  } catch (error: any) {
    yield `[Kroniki niedostępne: ${error.message}]`;
  }
}
