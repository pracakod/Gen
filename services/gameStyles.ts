// services/gameStyles.ts

export type GameStyle = 'diablo' | 'cyberpunk' | 'pixelart';

export interface StyleConfig {
    id: GameStyle;
    name: string;
    icon: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        bg: string;
    };
    artStyle: string;
    lighting: string;
    environment: string;
    negative: string;
    lorePersona: string;
    headerTitle: string;
    tagline: string;
}

export const GAME_STYLES: Record<GameStyle, StyleConfig> = {
    diablo: {
        id: 'diablo',
        name: 'Dark Fantasy',
        icon: '⚔️',
        colors: {
            primary: 'red-800',
            secondary: 'stone-800',
            accent: 'amber-700',
            bg: 'sanctuary-900'
        },
        artStyle: "Diablo 4 concept art style, dark fantasy, gothic horror, oil painting texture, blizzard entertainment style, masterpiece, best quality, 8k resolution, cinematic lighting, volumetric fog, detailed textures",
        lighting: "dramatic chiaroscuro lighting, dark ominous atmosphere, rim lighting, gloom, shadows",
        environment: "dark dungeon background, cathedral ruins, sanctuary world atmosphere",
        negative: "bad anatomy, blurry, low quality, cartoon, anime, bright colors, happy, cute, text, watermark, signature, ugly face, deformed hands",
        lorePersona: `Jesteś Deckardem Cainem, ostatnim z Horadrimów, uczonym i strażnikiem wiedzy w świecie Sanktuarium (Diablo).
Używaj archaicznego, tajemniczego i nieco podniosłego języka. Odwołuj się do Wiecznego Konfliktu.`,
        headerTitle: 'Kuźnia Sanktuarium',
        tagline: 'Twórz. Walcz. Zwyciężaj.'
    },

    cyberpunk: {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        icon: '🌃',
        colors: {
            primary: 'cyan-500',
            secondary: 'purple-900',
            accent: 'pink-500',
            bg: 'gray-950'
        },
        artStyle: "Cyberpunk 2077 concept art style, neon noir, sci-fi dystopia, digital art, chrome and neon, masterpiece, best quality, 8k resolution, holographic effects, rain reflections, night city atmosphere",
        lighting: "neon glow lighting, pink and cyan neons, wet reflections, volumetric light rays, cybernetic enhancement glow",
        environment: "night city megabuildings, rain-soaked streets, holographic advertisements, dystopian urban landscape",
        negative: "bad anatomy, blurry, low quality, medieval, fantasy, nature, trees, daylight, happy, cute, text, watermark, signature",
        lorePersona: `Jesteś V, legendą Night City. Twój język to uliczny slang przyszłości, pełen cybernetycznego żargonu.
Mów o korporacjach, implantach, netrunnerach i życiu na krawędzi w megamieście.`,
        headerTitle: 'Night City Forge',
        tagline: 'Chrome. Neon. Legenda.'
    },

    pixelart: {
        id: 'pixelart',
        name: 'Pixel Art',
        icon: '👾',
        colors: {
            primary: 'emerald-500',
            secondary: 'slate-800',
            accent: 'yellow-400',
            bg: 'slate-950'
        },
        artStyle: "16-bit pixel art style, retro game aesthetic, SNES era graphics, limited color palette, crisp pixels, no anti-aliasing, sprite sheet style, nostalgic gaming, masterpiece pixel work",
        lighting: "flat shading, 2-3 tone shading, classic RPG lighting, simple shadows, vibrant colors",
        environment: "retro game dungeon, 16-bit world map, JRPG style backgrounds, tile-based environment",
        negative: "3D, realistic, photorealistic, smooth gradients, high resolution details, anti-aliasing, blurry, complex lighting",
        lorePersona: `Jesteś narratorem klasycznej gry 16-bitowej. Twój język to proste, nostalgiczne opisy w stylu retro RPG.
Używaj krótkich, dynamicznych zdań jak w starych grach z SNES i Mega Drive.`,
        headerTitle: 'Pixel Forge',
        tagline: '16-bit. Retro. Epicko.'
    }
};

export const getStyleColors = (style: GameStyle) => {
    const config = GAME_STYLES[style];
    return {
        primary: config.colors.primary,
        secondary: config.colors.secondary,
        accent: config.colors.accent,
        gradient: style === 'diablo'
            ? 'from-black via-red-900 to-black'
            : style === 'cyberpunk'
                ? 'from-purple-900 via-cyan-500 to-pink-500'
                : 'from-slate-900 via-emerald-500 to-yellow-400'
    };
};
