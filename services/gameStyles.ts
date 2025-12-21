// services/gameStyles.ts

export type GameStyle = 'diablo' | 'cyberpunk' | 'pixelart' | 'gta' | 'fortnite' | 'hades' | 'tibia' | 'cuphead';

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
    tabLabels: {
        characters: string;
        items: string;
        monsters: string;
        locations: string;
        lore: string;
        mounts: string;
        pets: string;
    };
    placeholders: {
        lore: string;
    };
    buttons: {
        lore: string;
        generate: string;
    };
    backgroundTags: string[];
}

export const GAME_STYLES: Record<GameStyle, StyleConfig> = {
    diablo: {
        id: 'diablo',
        name: 'Dark Fantasy (Diablo)',
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
        tagline: 'Twórz. Walcz. Zwyciężaj.',
        tabLabels: {
            characters: 'Bohaterowie',
            items: 'Przedmioty',
            monsters: 'Potwory',
            locations: 'Lokacje',
            lore: 'Kroniki',
            mounts: 'Wierzchowce',
            pets: 'Towarzysze'
        },
        placeholders: { lore: 'np. Upadły Anioł Inarius...' },
        buttons: { lore: 'Spisz Kronikę', generate: 'Przyzwij' },
        backgroundTags: ['Katedra Tristram', 'Piekielna Otchłań', 'Mroczny Las', 'Pustynne Piaski', 'Lodowe Szczyty', 'Zrujnowana Świątynia', 'Twierdza Pandemonium']
    },

    cyberpunk: {
        id: 'cyberpunk',
        name: 'Cyberpunk (2077)',
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
        tagline: 'Chrome. Neon. Legenda.',
        tabLabels: {
            characters: 'Soliści',
            items: 'Cyberware',
            monsters: 'Wrogowie',
            locations: 'Dzielnice',
            lore: 'Dane',
            mounts: 'Pojazdy',
            pets: 'Drony'
        },
        placeholders: { lore: 'np. Megakorporacja Arasaka...' },
        buttons: { lore: 'Pobierz Dane', generate: 'Zainstaluj' },
        backgroundTags: ['Neonowa Ulica', 'Dach Wieżowca', 'Klub Afterlife', 'Podziemia Megabudynku', 'Laboratorium Medtech', 'Pustkowia Badlands', 'Hakerska Melina']
    },

    pixelart: {
        id: 'pixelart',
        name: 'Pixel Art (Retro)',
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
        tagline: '16-bit. Retro. Epicko.',
        tabLabels: {
            characters: 'Pixel Bohater',
            items: 'Ekwipunek',
            monsters: 'Bestie',
            locations: 'Mapy',
            lore: 'Legendy',
            mounts: 'Wierzchowce',
            pets: 'Pety'
        },
        placeholders: { lore: 'np. Legenda o zaginionym pikselu...' },
        buttons: { lore: 'Zapisz Quest', generate: 'Wykuj' },
        backgroundTags: ['Zielona Polana', 'Zamek w Chmurach', 'Jaskinia Lawy', 'Magiczny Las', 'Pikselowe Miasto', 'Lochy 8-bit', 'Podwodny Świat']
    },

    gta: {
        id: 'gta',
        name: 'Crime City (GTA)',
        icon: '🚗',
        colors: {
            primary: 'orange-500',
            secondary: 'blue-900',
            accent: 'yellow-300',
            bg: 'zinc-900'
        },
        artStyle: "GTA 5 loading screen art style, digital vector illustration, cel shaded, bold black outlines, high contrast, saturated colors, professional comic art, Rockstar Games aesthetic",
        lighting: "harsh sunlight, vibrant sunset colors, dramatic long shadows, golden hour",
        environment: "urban city sprawl, palm trees, luxury cars, sunny beach or dark alleyways",
        negative: "photorealistic, 3D render, fuzzy, blurry, messy lines, classical painting, medieval, magic",
        lorePersona: `Jesteś informatorem z podziemia Crime City. Twoja mowa jest konkretna, cyniczna i pełna żargonu przestępczego.
Mów o skokach, forsowaniu i szacunku na dzielni.`,
        headerTitle: 'Underground Forge',
        tagline: 'Kasa. Respekt. Władza.',
        tabLabels: {
            characters: 'Gangsterzy',
            items: 'Akcesoria',
            monsters: 'Służby',
            locations: 'Miejscówki',
            lore: 'Kartoteki',
            mounts: 'Auta',
            pets: 'Psy'
        },
        placeholders: { lore: 'np. Napad na centralny bank...' },
        buttons: { lore: 'Sprawdź Kartotekę', generate: 'Kup' },
        backgroundTags: ['Plaża Santa Maria', 'Centrum Los Santos', 'Willa w Vinewood', 'Podziemny Garaż', 'Molo o Zachodzie', 'Dzielnica Ghetto', 'Opuszczone Lotnisko']
    },

    fortnite: {
        id: 'fortnite',
        name: 'Battle Royale (Fortnite)',
        icon: '🛡️',
        colors: {
            primary: 'blue-500',
            secondary: 'purple-600',
            accent: 'yellow-400',
            bg: 'indigo-950'
        },
        artStyle: "Stylized 3D character design, Fortnite style, vibrant colorful palette, clean smooth surfaces, heroic proportions, high-quality Unreal Engine 5 render, expressive stylized features, battle royale aesthetic",
        lighting: "bright bouncy lighting, saturated colors, glowing energy effects, clean shadows",
        environment: "colorful grassy island, futuristic bases, floating islands, cartoonish landscapes",
        negative: "dark, scary, gritty, realistic, photorealistic, dirty, rusty, gore, blood, black and white",
        lorePersona: `Jesteś dowódcą operacji Battle Royale. Twój język jest entuzjastyczny, pełen energii i motywacji do walki.
Mów o zrzutach, budowaniu tarczy i zwycięskim tańcu!`,
        headerTitle: 'Heroic Forge',
        tagline: 'Skacz. Buduj. Wygrywaj.',
        tabLabels: {
            characters: 'Skiny',
            items: 'Loot',
            monsters: 'Stwory',
            locations: 'Mapy POI',
            lore: 'Notatki',
            mounts: 'Pojazdy',
            pets: 'Plecaki'
        },
        placeholders: { lore: 'np. Tajemnica fioletowej kostki...' },
        buttons: { lore: 'Odkryj Notatki', generate: 'Zdropuj' },
        backgroundTags: ['Wykrzywione Wieże', 'Soczysta Dżungla', 'Lodowe Jezioro', 'Pustynny Kanion', 'Latająca Wyspa', 'Neonowa Arena', 'Tropikalna Plaża']
    },

    hades: {
        id: 'hades',
        name: 'Divine Underworld (Hades)',
        icon: '🔥',
        colors: {
            primary: 'red-600',
            secondary: 'orange-900',
            accent: 'yellow-500',
            bg: 'neutral-950'
        },
        artStyle: "Hades game art style, Supergiant Games aesthetic, stylized painterly textures, brush stroke details, high contrast shadows, intricate patterns, mythological themes, sharp angular lines, divine glow",
        lighting: "ethereal magical glow, high contrast lighting, warm embers vs cold spectral light",
        environment: "mythological underworld, greek architecture, flowing magma or spectral mist",
        negative: "3D, photorealistic, realistic proportions, blurry, soft, pastel colors, cute, happy",
        lorePersona: `Jesteś sędzią dusz w podziemnym królestwie. Twoja mowa jest poetycka, pełna patosu i odniesień do antycznej Grecji.
Mów o przeznaczeniu, bóstwach i wiecznym cyklu walki.`,
        headerTitle: 'Divine Forge',
        tagline: 'Krew. Ciemność. Mit.',
        tabLabels: {
            characters: 'Bóstwa',
            items: 'Dary',
            monsters: 'Cienie',
            locations: 'Tartar',
            lore: 'Mity',
            mounts: 'Rydwany',
            pets: 'Asystenci'
        },
        placeholders: { lore: 'np. Wyczyn Heraklesa w zaświatach...' },
        buttons: { lore: 'Poznaj Mit', generate: 'Objaw' },
        backgroundTags: ['Dom Hadesa', 'Pola Asfodelu', 'Tartar', 'Elizjum', 'Świątynia Styksu', 'Królestwo Chaosu', 'Basen Nocy']
    },

    tibia: {
        id: 'tibia',
        name: 'Classic RPG (Tibia)',
        icon: '🕯️',
        colors: {
            primary: 'stone-600',
            secondary: 'green-900',
            accent: 'emerald-400',
            bg: 'stone-950'
        },
        artStyle: "Classic 2D isometric RPG style, old-school pixel-like textures, Tibia aesthetic, top-down perspective, simple but detailed sprites, vibrant but dangerous world, nostalgic fantasy art",
        lighting: "2D tile-based lighting, limited light radius, classic fantasy atmosphere",
        environment: "stone dungeons, lush pixel forests, old medieval towns, dragon lairs",
        negative: "3D, modern graphics, photorealistic, high resolution, soft shadows, anime",
        lorePersona: `Jesteś starym strażnikiem miejskim z osady Thais. Twój język jest prosty, ostrzegający przed niebezpieczeństwami.
Mów o wyprawach po rzadkie runy, polowaniu na smoki i handlu w depo.`,
        headerTitle: 'Oldschool Forge',
        tagline: 'Mana. Runy. Przygoda.',
        tabLabels: {
            characters: 'Profesje',
            items: 'Rarytasy',
            monsters: 'Bestie',
            locations: 'Respy',
            lore: 'Questy',
            mounts: 'Mounty',
            pets: 'Chowańce'
        },
        placeholders: { lore: 'np. Legenda o Golden Helmet...' },
        buttons: { lore: 'Spisz Questa', generate: 'Zlootuj' },
        backgroundTags: ['Rynek Thais', 'Wieże Edron', 'Bagna Venore', 'Kopalnie Kazordoon', 'Pustynia Darashia', 'Dżungla Tiquandy', 'Piekielne Czeluście']
    },

    cuphead: {
        id: 'cuphead',
        name: 'Rubber Hose (Cuphead)',
        icon: '☕',
        colors: {
            primary: 'red-600',
            secondary: 'stone-800',
            accent: 'blue-600',
            bg: 'stone-950'
        },
        artStyle: "1930s rubber hose animation style, hand-drawn cellulose animation, Cuphead game aesthetic, grainy vintage film texture, watercolor backgrounds, surreal character designs, pie-cut eyes, sepia and vintage colors",
        lighting: "flat 2D animation lighting, subtle paper texture overlay, vintage cinematic feel, low saturation",
        environment: "watercolor surreal landscapes, carnivals, retro stage designs",
        negative: "3D, digital, clean, modern, high tech, realistic, serious, dark, photorealistic, vibrant bright colors, 4k, digital render",
        lorePersona: `Jesteś konferansjerem z lat 30-tych. Twoja mowa jest barwna, pełna entuzjazzmu i staromodnych zwrotów.
Mów o wielkim show, hazardzie z diabłem i szalonej przygodzie!`,
        headerTitle: 'Vintage Forge',
        tagline: 'Show. Swing. Przebój.',
        tabLabels: {
            characters: 'Kreskówki',
            items: 'Bonusy',
            monsters: 'Bossowie',
            locations: 'Sceny',
            lore: 'Skrypty',
            mounts: 'Wehikuły',
            pets: 'Pomocnicy'
        },
        placeholders: { lore: 'np. Fortepian który ożył w nocy...' },
        buttons: { lore: 'Napisz Skrypt', generate: 'Narysuj' },
        backgroundTags: ['Wyspa Inkwell', 'Ogród Root Pack', 'Klub Ribby i Croaks', 'Piramida Dżina', 'Cukierkowy Zamek', 'Piekło Inkwell', 'Kasyno King Dice']
    }
};

export const getStyleColors = (style: GameStyle) => {
    const config = GAME_STYLES[style] || GAME_STYLES['diablo'];

    let gradient = 'from-black via-red-900 to-black';
    if (style === 'cyberpunk') gradient = 'from-purple-900 via-cyan-500 to-pink-500';
    if (style === 'pixelart') gradient = 'from-slate-900 via-emerald-500 to-yellow-400';
    if (style === 'gta') gradient = 'from-orange-600 via-blue-900 to-black';
    if (style === 'fortnite') gradient = 'from-blue-500 via-purple-600 to-indigo-900';
    if (style === 'hades') gradient = 'from-red-900 via-orange-900 to-black';
    if (style === 'tibia') gradient = 'from-stone-900 via-green-900 to-black';
    if (style === 'cuphead') gradient = 'from-red-900 via-stone-800 to-blue-900';

    return {
        ...config.colors,
        gradient
    };
};
