export type BoardThemeId = 
  | 'havana' 
  | 'wood' 
  | 'malecon' 
  | 'tropicana' 
  | 'capitolio' 
  | 'varadero' 
  | 'trinidad' 
  | 'pinar' 
  | 'cayo_coco' 
  | 'santiago' 
  | 'matanzas' 
  | 'cienfuegos';

export type FichaThemeId = 
  | 'havana' 
  | 'wood' 
  | 'malecon' 
  | 'tropicana' 
  | 'capitolio' 
  | 'varadero' 
  | 'trinidad' 
  | 'pinar' 
  | 'cayo_coco' 
  | 'santiago' 
  | 'matanzas' 
  | 'cienfuegos';

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
    name: 'Classic Mahogany Wood',
    tagline: 'Warm Aged Mahogany Wood & Amber Lounge',
    frameBorder: '#4a210d',
    feltBg: 'radial-gradient(circle at center, #6b3e1b, #2b1406)',
    accentColor: '#fe7328',
    previewColor: '#4a260f',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23fbbf24' fill-opacity='.06'/%3E%3C/svg%3E")`,
  },
  malecon: {
    id: 'malecon',
    name: 'Ocean Blue Velvet',
    tagline: 'Deep Ocean Blue Felt & Platinum Trim',
    frameBorder: '#0f172a',
    feltBg: 'radial-gradient(circle at center, #1e3a8a, #0b132b)',
    accentColor: '#38bdf8',
    previewColor: '#1e3a8a',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 25 20, 50 10 T 100 10' fill='none' stroke='%2338bdf8' stroke-width='1' stroke-opacity='.12'/%3E%3C/svg%3E")`,
  },
  tropicana: {
    id: 'tropicana',
    name: 'Midnight Onyx Velvet',
    tagline: 'Luxury Jet Velvet & Gold Cabaret Trim',
    frameBorder: '#27272a',
    feltBg: 'radial-gradient(circle at center, #27272a, #09090b)',
    accentColor: '#eab308',
    previewColor: '#18181b',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M20 0L40 20L20 40L0 20z' fill='%23fde047' fill-opacity='.07'/%3E%3C/svg%3E")`,
  },
  capitolio: {
    id: 'capitolio',
    name: 'Royal Crimson Velvet',
    tagline: 'Royal Burgundy Felt & Antique Brass',
    frameBorder: '#311018',
    feltBg: 'radial-gradient(circle at center, #581c25, #23080e)',
    accentColor: '#f43f5e',
    previewColor: '#4c1d24',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M32 0l32 32-32 32L0 32z' fill='%23fb7185' fill-opacity='.08'/%3E%3C/svg%3E")`,
  },
  varadero: {
    id: 'varadero',
    name: 'Caribbean Turquoise',
    tagline: 'Vibrant Coastal Teal & Driftwood Gold',
    frameBorder: '#0f383e',
    feltBg: 'radial-gradient(circle at center, #005f73, #082d33)',
    accentColor: '#2dd4bf',
    previewColor: '#005f73',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 Q 15 15, 30 30 T 60 30' fill='none' stroke='%232dd4bf' stroke-width='1.5' stroke-opacity='.15'/%3E%3C/svg%3E")`,
  },
  trinidad: {
    id: 'trinidad',
    name: 'Terracotta Clay',
    tagline: 'Terracotta Clay Felt & Bronze Motif',
    frameBorder: '#32120b',
    feltBg: 'radial-gradient(circle at center, #8b3a2b, #3d150e)',
    accentColor: '#fb923c',
    previewColor: '#8b3a2b',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='10' y='10' width='30' height='30' fill='none' stroke='%23fb923c' stroke-width='1' stroke-opacity='.15' transform='rotate(45 25 25)'/%3E%3C/svg%3E")`,
  },
  pinar: {
    id: 'pinar',
    name: 'Tobacco Olive Leaf',
    tagline: 'Aged Tobacco Leaf Olive & Golden Brass Frame',
    frameBorder: '#1f2916',
    feltBg: 'radial-gradient(circle at center, #3a4d28, #182410)',
    accentColor: '#a3e635',
    previewColor: '#3a4d28',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 C45 20, 45 40, 30 55 C15 40, 15 20, 30 5 Z' fill='none' stroke='%23a3e635' stroke-width='1' stroke-opacity='.12'/%3E%3C/svg%3E")`,
  },
  cayo_coco: {
    id: 'cayo_coco',
    name: 'Twilight Violet Velvet',
    tagline: 'Imperial Violet Velvet & Sunset Coral Trim',
    frameBorder: '#1b0c33',
    feltBg: 'radial-gradient(circle at center, #3b1f66, #120726)',
    accentColor: '#c084fc',
    previewColor: '#3b1f66',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='30' fill='none' stroke='%23c084fc' stroke-width='1' stroke-opacity='.12' stroke-dasharray='4 4'/%3E%3C/svg%3E")`,
  },
  santiago: {
    id: 'santiago',
    name: 'Copper Amber Sunburst',
    tagline: 'Warm Copper Amber & Obsidian Black Wood',
    frameBorder: '#270802',
    feltBg: 'radial-gradient(circle at center, #9a3412, #451205)',
    accentColor: '#f97316',
    previewColor: '#9a3412',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 L40 40 M40 0 L0 40' stroke='%23f97316' stroke-width='1' stroke-opacity='.1'/%3E%3C/svg%3E")`,
  },
  matanzas: {
    id: 'matanzas',
    name: 'Platinum Slate Marble',
    tagline: 'Polished Silver Slate & Stainless Steel',
    frameBorder: '#1e293b',
    feltBg: 'radial-gradient(circle at center, #334155, #0f172a)',
    accentColor: '#cbd5e1',
    previewColor: '#334155',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 25 0, 50 50 T 100 50' fill='none' stroke='%23f1f5f9' stroke-width='1' stroke-opacity='.12'/%3E%3C/svg%3E")`,
  },
  cienfuegos: {
    id: 'cienfuegos',
    name: 'Royal Sapphire Navy',
    tagline: 'Majestic Royal Navy Velvet & Polished Brass',
    frameBorder: '#0c1a30',
    feltBg: 'radial-gradient(circle at center, #1e40af, #091a42)',
    accentColor: '#60a5fa',
    previewColor: '#1e40af',
    svgPattern: `url("data:image/svg+xml,%3Csvg width='70' height='70' viewBox='0 0 70 70' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='35,5 65,35 35,65 5,35' fill='none' stroke='%2360a5fa' stroke-width='1' stroke-opacity='.14'/%3E%3C/svg%3E")`,
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
    name: 'Dark Rosewood & Crisp White',
    tagline: 'Rich Mahogany Wood with Bright White Pips',
    tileBgClass: 'bg-gradient-to-br from-[#3b1511] to-[#240b08] text-[#ffffff] border-[#612c24] shadow-[0_6px_16px_rgba(0,0,0,0.55)]',
    pipColor: '#ffffff',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #eab308, #451a03)',
    highlightBorder: 'border-[#f43f5e] ring-2 ring-[#f43f5e] shadow-[0_8px_20px_rgba(244,63,94,0.45)]',
    playableRing: 'border-[#be123c] hover:brightness-110 cursor-pointer ring-2 ring-[#be123c] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(190,18,60,0.35)]',
    previewBg: '#240b08',
    previewPip: '#ffffff',
  },
  varadero: {
    id: 'varadero',
    name: 'Seafoam Ivory & Teal Pips',
    tagline: 'Fresh Seafoam Ivory with Deep Coastal Teal Pips',
    tileBgClass: 'bg-gradient-to-br from-[#ffffff] to-[#e6f4f1] text-[#005f73] border-[#99f6e4] shadow-[0_6px_14px_rgba(0,95,115,0.35)]',
    pipColor: '#005f73',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #2dd4bf, #0f766e)',
    highlightBorder: 'border-[#2dd4bf] ring-2 ring-[#2dd4bf] shadow-[0_8px_20px_rgba(45,212,191,0.4)]',
    playableRing: 'border-[#0d9488] hover:bg-[#f0fdfa] cursor-pointer ring-2 ring-[#0d9488] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(13,148,136,0.35)]',
    previewBg: '#e6f4f1',
    previewPip: '#005f73',
  },
  trinidad: {
    id: 'trinidad',
    name: 'Parchment Cream & Rust',
    tagline: 'Old Parchment Cream with Clay Terracotta Pips',
    tileBgClass: 'bg-gradient-to-br from-[#fffaf0] to-[#f4e4d0] text-[#8b3a2b] border-[#e2c4a8] shadow-[0_6px_14px_rgba(139,58,43,0.35)]',
    pipColor: '#8b3a2b',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #fb923c, #9a3412)',
    highlightBorder: 'border-[#fb923c] ring-2 ring-[#fb923c] shadow-[0_8px_20px_rgba(251,146,60,0.4)]',
    playableRing: 'border-[#ea580c] hover:brightness-105 cursor-pointer ring-2 ring-[#ea580c] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(234,88,12,0.35)]',
    previewBg: '#f4e4d0',
    previewPip: '#8b3a2b',
  },
  pinar: {
    id: 'pinar',
    name: 'Aged Bone & Forest Pips',
    tagline: 'Classic Aged Bone with Tobacco Forest Green Pips',
    tileBgClass: 'bg-gradient-to-br from-[#f7f4e9] to-[#dfd7be] text-[#223315] border-[#b3aa8e] shadow-[0_6px_14px_rgba(34,51,21,0.35)]',
    pipColor: '#223315',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #a3e635, #3f6212)',
    highlightBorder: 'border-[#a3e635] ring-2 ring-[#a3e635] shadow-[0_8px_20px_rgba(163,230,53,0.4)]',
    playableRing: 'border-[#65a30d] hover:brightness-105 cursor-pointer ring-2 ring-[#65a30d] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(101,163,13,0.35)]',
    previewBg: '#dfd7be',
    previewPip: '#223315',
  },
  cayo_coco: {
    id: 'cayo_coco',
    name: 'Sunset Pearl & Violet Pips',
    tagline: 'Soft Pink-Pearl White with Deep Purple Pips',
    tileBgClass: 'bg-gradient-to-br from-[#ffffff] to-[#f3e8ff] text-[#4c1d95] border-[#d8b4fe] shadow-[0_6px_14px_rgba(76,29,149,0.35)]',
    pipColor: '#4c1d95',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #c084fc, #6b21a8)',
    highlightBorder: 'border-[#c084fc] ring-2 ring-[#c084fc] shadow-[0_8px_20px_rgba(192,132,252,0.4)]',
    playableRing: 'border-[#9333ea] hover:bg-[#faf5ff] cursor-pointer ring-2 ring-[#9333ea] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(147,51,234,0.35)]',
    previewBg: '#f3e8ff',
    previewPip: '#4c1d95',
  },
  santiago: {
    id: 'santiago',
    name: 'Obsidian & Radiant Coral',
    tagline: 'Deep Matte Black Tile with Radiant Coral Pips',
    tileBgClass: 'bg-gradient-to-br from-[#262220] to-[#141211] text-[#fb923c] border-[#4a3429] shadow-[0_6px_16px_rgba(0,0,0,0.6)]',
    pipColor: '#fb923c',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #f97316, #7c2d12)',
    highlightBorder: 'border-[#f97316] ring-2 ring-[#f97316] shadow-[0_8px_20px_rgba(249,115,22,0.5)]',
    playableRing: 'border-[#ea580c] hover:brightness-125 cursor-pointer ring-2 ring-[#ea580c] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(234,88,12,0.4)]',
    previewBg: '#141211',
    previewPip: '#fb923c',
  },
  matanzas: {
    id: 'matanzas',
    name: 'Platinum Slate & Silver Pips',
    tagline: 'Polished Metallic Slate with Pure White Silver Pips',
    tileBgClass: 'bg-gradient-to-br from-[#f8fafc] to-[#cbd5e1] text-[#0f172a] border-[#94a3b8] shadow-[0_6px_14px_rgba(15,23,42,0.35)]',
    pipColor: '#0f172a',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #e2e8f0, #475569)',
    highlightBorder: 'border-[#94a3b8] ring-2 ring-[#94a3b8] shadow-[0_8px_20px_rgba(148,163,184,0.4)]',
    playableRing: 'border-[#475569] hover:bg-[#f1f5f9] cursor-pointer ring-2 ring-[#475569] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(71,85,105,0.35)]',
    previewBg: '#cbd5e1',
    previewPip: '#0f172a',
  },
  cienfuegos: {
    id: 'cienfuegos',
    name: 'Ivory Gold & Sapphire Pips',
    tagline: 'Pure Ivory White with Sapphire Blue Pips & Gold Clavito',
    tileBgClass: 'bg-gradient-to-br from-[#ffffff] to-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe] shadow-[0_6px_14px_rgba(29,78,216,0.35)]',
    pipColor: '#1d4ed8',
    spinnerGradient: 'radial-gradient(circle at 35% 35%, #eab308, #854d0e)',
    highlightBorder: 'border-[#60a5fa] ring-2 ring-[#60a5fa] shadow-[0_8px_20px_rgba(96,165,250,0.4)]',
    playableRing: 'border-[#2563eb] hover:bg-[#f0f9ff] cursor-pointer ring-2 ring-[#2563eb] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(37,99,235,0.35)]',
    previewBg: '#eff6ff',
    previewPip: '#1d4ed8',
  },
};

export const MATCHED_PRESETS: MatchedThemePreset[] = [
  {
    id: 'havana',
    name: 'Havana Social Club',
    boardId: 'havana',
    fichaId: 'havana',
    icon: '🌴',
    description: 'Traditional green felt board & vintage ivory dominoes with copper clavitos.',
  },
  {
    id: 'wood',
    name: 'Classic Mahogany Wood',
    boardId: 'wood',
    fichaId: 'wood',
    icon: '🪵',
    description: 'Aged mahogany wood table & warm amber gold dominoes with espresso pips.',
  },
  {
    id: 'varadero',
    name: 'Caribbean Turquoise',
    boardId: 'varadero',
    fichaId: 'varadero',
    icon: '🏖️',
    description: 'Vibrant coastal turquoise felt table & seafoam ivory dominoes with teal pips.',
  },
  {
    id: 'malecon',
    name: 'Ocean Blue Velvet',
    boardId: 'malecon',
    fichaId: 'malecon',
    icon: '🌊',
    description: 'Deep ocean blue velvet felt & polished frost white dominoes with navy pips.',
  },
  {
    id: 'trinidad',
    name: 'Terracotta Clay',
    boardId: 'trinidad',
    fichaId: 'trinidad',
    icon: '🏛️',
    description: 'Warm terracotta clay felt with geometric motif & parchment cream dominoes.',
  },
  {
    id: 'tropicana',
    name: 'Midnight Onyx Velvet',
    boardId: 'tropicana',
    fichaId: 'tropicana',
    icon: '✨',
    description: 'Luxury jet velvet table & high-contrast onyx black dominoes with gold pips.',
  },
  {
    id: 'pinar',
    name: 'Tobacco Olive Leaf',
    boardId: 'pinar',
    fichaId: 'pinar',
    icon: '🍂',
    description: 'Aged tobacco leaf olive felt table & vintage bone dominoes with forest green pips.',
  },
  {
    id: 'capitolio',
    name: 'Royal Crimson Velvet',
    boardId: 'capitolio',
    fichaId: 'capitolio',
    icon: '👑',
    description: 'Burgundy crimson velvet table & polished dark rosewood dominoes with white pips.',
  },
  {
    id: 'cayo_coco',
    name: 'Twilight Violet Velvet',
    boardId: 'cayo_coco',
    fichaId: 'cayo_coco',
    icon: '🌅',
    description: 'Imperial violet velvet felt table & sunset pearl dominoes with amethyst pips.',
  },
  {
    id: 'santiago',
    name: 'Copper Amber Sunburst',
    boardId: 'santiago',
    fichaId: 'santiago',
    icon: '☀️',
    description: 'Warm copper amber felt table & obsidian black dominoes with radiant coral pips.',
  },
  {
    id: 'matanzas',
    name: 'Platinum Slate Marble',
    boardId: 'matanzas',
    fichaId: 'matanzas',
    icon: '⚓',
    description: 'Polished platinum slate stone table & metallic silver slate dominoes.',
  },
  {
    id: 'cienfuegos',
    name: 'Royal Sapphire Navy',
    boardId: 'cienfuegos',
    fichaId: 'cienfuegos',
    icon: '💎',
    description: 'Royal sapphire navy velvet felt & pure ivory dominoes with blue pips and gold clavito.',
  },
];

