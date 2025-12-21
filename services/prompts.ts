// services/prompts.ts

/**
 * DECKARD CAIN PERSONA
 * Główny prompt systemowy dla generatora tekstu (Lore).
 */
export const SYSTEM_LORE_MASTER = `
Jesteś Deckardem Cainem, ostatnim z Horadrimów, uczonym i strażnikiem wiedzy w świecie Sanktuarium (Diablo).
Twoim zadaniem jest opisywanie świata, postaci, przedmiotów i potworów w stylu mrocznego fantasy.

ZASADY:
1. Używaj archaicznego, tajemniczego i nieco podniosłego języka (jak w starych księgach).
2. Odwołuj się do Wiecznego Konfliktu (High Heavens vs Burning Hells).
3. Wspominaj o geografii Sanktuarium (Khanduras, Kehjistan, Arreat, Scosglen) tam gdzie to pasuje.
4. Bądź zwięzły, ale treściwy (max 3-4 zdania), chyba że użytkownik prosi o więcej.
5. Jeśli temat jest niejasny, wymyśl mroczną historię pasującą do uniwersum.
6. Zawsze odpowiadaj po POLSKU.

PRZYKŁAD STYLU:
"Zostań na chwilę i posłuchaj... Ten miecz, choć zardzewiały, nosi na sobie znamię Kuźni Piekieł. Pamięta czasy, gdy demoniczne hordy Azmodana zalewały Równiny Rozpaczy. Strzeż się, wędrowcze, bowiem taka moc zawsze domaga się ofiary z krwi."
`;

/**
 * IMAGE GENERATION STYLES
 * Style wizualne, które są doklejane do promptów graficznych.
 */
export const ART_STYLES = {
    // Baza - mroczny styl Diablo 4
    DARK_FANTASY: "Diablo 4 concept art style, dark fantasy, gothic horror, oil painting texture, blizzard entertainment style, masterpiece, best quality, 8k resolution, cinematic lighting, volumetric fog, detailed textures",

    // Oświetlenie
    LIGHTING: "dramatic chiaroscuro lighting, dark ominous atmosphere, rim lighting, gloom, shadows",

    // Tło (gdy nie jest usuwane)
    ENVIRONMENT: "dark dungeon background, cathedral ruins, sanctuary world atmosphere",

    // Wykluczenia (Negative Prompt - wbudowany w opis, bo API Gemini nie zawsze ma pole negative)
    NEGATIVE: "bad anatomy, blurry, low quality, cartoon, anime, bright colors, happy, cute, text, watermark, signature, ugly face, deformed hands"
};

/**
 * HELPER: Rozszerza prosty wpis użytkownika o bogaty opis
 */
export const enhanceUserPrompt = (input: string, type: 'character' | 'item' | 'monster'): string => {
    const cleanInput = input.trim();

    // Mapping prostych słów na bogate opisy
    if (type === 'character') {
        if (cleanInput.match(/barbarzyńca|barbarian/i)) return `${cleanInput}, muscular warrior from Mount Arreat, heavy fur armor, scars, ancient face paint, snowy atmosphere`;
        if (cleanInput.match(/nekromanta|necromancer/i)) return `${cleanInput}, pale skin, rathma priest, bone armor, skulls, green spectral essence, mist`;
        if (cleanInput.match(/czarodziej|sorcerer|mage/i)) return `${cleanInput}, kejanistan robes, elemental energy, arcane runes, glowing eyes, magic staff`;
        if (cleanInput.match(/łotr|rogue|assassin/i)) return `${cleanInput}, hooded figure, leather armor, daggers, shadows, sisters of the sightless eye`;
        if (cleanInput.match(/druid/i)) return `${cleanInput}, scosglen shapeshifter, nature ornaments, wooden staff, animal pelts, storm ambiance`;
    }

    return cleanInput;
}
