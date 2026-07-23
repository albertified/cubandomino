export type BoardThemeId = 'havana' | 'wood' | 'malecon' | 'tropicana' | 'capitolio';
export type FichaThemeId = 'havana' | 'wood' | 'malecon' | 'tropicana' | 'capitolio';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  tagline: string;
  frameBorder: string;
  feltBg: string;
  accentColor: string;
  previewColor: string;
  svgPattern: string;
}

export interface FichaTheme {
  id: FichaThemeId;
  name: string;
  tagline: string;
  tileBgClass: string;
  pipColor: string;
  spinnerGradient: string;
  highlightBorder: string;
  playableRing: string;
  previewBg: string;
  previewPip: string;
}

export interface MatchedThemePreset {
  id: string;
  name: string;
  boardId: BoardThemeId;
  fichaId: FichaThemeId;
  icon: string;
  description: string;
}

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  havana: {
    id: 'havana',
    name: 'Havana Social Club',
    tagline: 'Classic Emerald Felt & Dark Mahogany Frame',
    frameBorder: '#32170d',
    feltBg: 'radial-gradient(circle at center, #244f45, #0f241f)',
    accentColor: '#006876',
    previewColor: '#1a3c34',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l40 40-40 40L0 40z' fill='%23ffffff' fill-opacity='.08' fill-rule='evenodd'/%3E%3C/svg%3E")`,
  },
  wood: {
    id: 'wood',
    name: 'Bodeguita Cedar',
    tagline: 'Warm Aged Cuban Wood & Amber Lounge',
    frameBorder: '#4a210d',
    feltBg: 'radial-gradient(circle at center, #6b3e1b, #2b1406)',
    accentColor: '#fe7328',
    previewColor: '#4a260f',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23fbbf24' fill-opacity='.06'/%3E%3C/svg%3E")`,
  },
  malecon: {
    id: 'malecon',
    name: 'Midnight Malecón',
    tagline: 'Deep Ocean Blue Felt & Platinum Trim',
    frameBorder: '#0f172a',
    feltBg: 'radial-gradient(circle at center, #1e3a8a, #0b132b)',
    accentColor: '#38bdf8',
    previewColor: '#1e3a8a',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 25 20, 50 10 T 100 10' fill='none' stroke='%2338bdf8' stroke-width='1' stroke-opacity='.12'/%3E%3C/svg%3E")`,
  },
  tropicana: {
    id: 'tropicana',
    name: 'Tropicana Velvet',
    tagline: 'Luxury Jet Velvet & Gold Cabaret Trim',
    frameBorder: '#27272a',
    feltBg: 'radial-gradient(circle at center, #27272a, #09090b)',
    accentColor: '#eab308',
    previewColor: '#18181b',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M20 0L40 20L20 40L0 20z' fill='%23fde047' fill-opacity='.07'/%3E%3C/svg%3E")`,
  },
  capitolio: {
    id: 'capitolio',
    name: 'Capitolio Crimson',
    tagline: 'Royal Burgundy Felt & Antique Brass',
    frameBorder: '#311018',
    feltBg: 'radial-gradient(circle at center, #581c25, #23080e)',
    accentColor: '#f43f5e',
    previewColor: '#4c1d24',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0l32 32-32 32L0 32z' fill='%23fb7185' fill-opacity='.08'/%3E%3C/svg%3E")`,
  },
};

export const FICHA_THEMES: Record<FichaThemeId, FichaTheme> = {
  havana: {
    id: 'havana',
    name: 'Vintage Ivory Bone',
    tagline: 'Traditional Cream Ivory with Brass Clavito',
    tileBgClass: 'bg-[#fff9eb] text-[#1d1c13] border-[#d5c3bd] shadow-[0_6px_14px_rgba(0,0,0,0.35)]',
    pipColor: '#32170d',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #fe7328, #3b1200)',
    highlightBorder: 'border-[#fe7328] ring-2 ring-[#fe7328] shadow-[0_8px_20px_rgba(254,115,40,0.35)]',
    playableRing: 'border-[#006876] hover:bg-[#fffdf7] cursor-pointer ring-2 ring-[#006876] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(0,104,118,0.3)]',
    previewBg: '#fff9eb',
    previewPip: '#32170d',
  },
  wood: {
    id: 'wood',
    name: 'Amber Gold & Espresso',
    tagline: 'Warm Antique Gold with Espresso Pips',
    tileBgClass: 'bg-gradient-to-br from-[#fff3db] to-[#f2d9a7] text-[#241306] border-[#c4a26e] shadow-[0_6px_14px_rgba(0,0,0,0.4)]',
    pipColor: '#2b1406',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #fbbf24, #78470a)',
    highlightBorder: 'border-[#fbbf24] ring-2 ring-[#fbbf24] shadow-[0_8px_20px_rgba(251,191,36,0.4)]',
    playableRing: 'border-[#d97706] hover:brightness-105 cursor-pointer ring-2 ring-[#d97706] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(217,119,6,0.35)]',
    previewBg: '#f2d9a7',
    previewPip: '#2b1406',
  },
  malecon: {
    id: 'malecon',
    name: 'Icy Pearl & Navy Pips',
    tagline: 'Polished Frost White with Oceanic Blue Pips',
    tileBgClass: 'bg-gradient-to-br from-[#ffffff] to-[#e0f2fe] text-[#0f172a] border-[#93c5fd] shadow-[0_6px_14px_rgba(15,23,42,0.4)]',
    pipColor: '#1e3a8a',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #e2e8f0, #334155)',
    highlightBorder: 'border-[#38bdf8] ring-2 ring-[#38bdf8] shadow-[0_8px_20px_rgba(56,189,248,0.4)]',
    playableRing: 'border-[#2563eb] hover:bg-[#f0f9ff] cursor-pointer ring-2 ring-[#2563eb] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(37,99,235,0.35)]',
    previewBg: '#e0f2fe',
    previewPip: '#1e3a8a',
  },
  tropicana: {
    id: 'tropicana',
    name: 'Jet Black Onyx & Gold',
    tagline: 'Sleek Black Tile with Metallic Gold Pips',
    tileBgClass: 'bg-gradient-to-br from-[#1e1e24] to-[#121215] text-[#fde047] border-[#423d24] shadow-[0_6px_16px_rgba(0,0,0,0.6)]',
    pipColor: '#fde047',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #fde047, #854d0e)',
    highlightBorder: 'border-[#eab308] ring-2 ring-[#eab308] shadow-[0_8px_20px_rgba(234,179,8,0.5)]',
    playableRing: 'border-[#ca8a04] hover:brightness-125 cursor-pointer ring-2 ring-[#ca8a04] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(202,138,4,0.4)]',
    previewBg: '#121215',
    previewPip: '#fde047',
  },
  capitolio: {
    id: 'capitolio',
    name: 'Cuban Rosewood & Crisp White',
    tagline: 'Rich Mahogany Wood with Bright White Pips',
    tileBgClass: 'bg-gradient-to-br from-[#3b1511] to-[#240b08] text-[#ffffff] border-[#612c24] shadow-[0_6px_16px_rgba(0,0,0,0.55)]',
    pipColor: '#ffffff',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #eab308, #451a03)',
    highlightBorder: 'border-[#f43f5e] ring-2 ring-[#f43f5e] shadow-[0_8px_20px_rgba(244,63,94,0.45)]',
    playableRing: 'border-[#be123c] hover:brightness-110 cursor-pointer ring-2 ring-[#be123c] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(190,18,60,0.35)]',
    previewBg: '#240b08',
    previewPip: '#ffffff',
  },
};

export const MATCHED_PRESETS: MatchedThemePreset[] = [
  {
    id: 'havana',
    name: 'Havana Social Club',
    boardId: 'havana',
    fichaId: 'havana',
    icon: '🌴',
    description: 'Traditional Cuban green felt board & vintage ivory dominoes with copper clavitos.',
  },
  {
    id: 'wood',
    name: 'Bodeguita Cedar',
    boardId: 'wood',
    fichaId: 'wood',
    icon: '🪵',
    description: 'Aged Cuban cedar wood table & warm amber gold dominoes with espresso pips.',
  },
  {
    id: 'malecon',
    name: 'Midnight Malecón',
    boardId: 'malecon',
    fichaId: 'malecon',
    icon: '🌊',
    description: 'Deep ocean blue velvet felt & polished frost white dominoes with navy pips.',
  },
  {
    id: 'tropicana',
    name: 'Tropicana Cabaret',
    boardId: 'tropicana',
    fichaId: 'tropicana',
    icon: '✨',
    description: 'Luxury jet velvet table & high-contrast onyx black dominoes with gold pips.',
  },
  {
    id: 'capitolio',
    name: 'Capitolio Royal',
    boardId: 'capitolio',
    fichaId: 'capitolio',
    icon: '🏛️',
    description: 'Burgundy crimson velvet table & polished Cuban rosewood dominoes with white pips.',
  },
];
