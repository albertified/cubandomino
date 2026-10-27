import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, Award, BookOpen, Target, Sparkles, CheckCircle2, 
  XCircle, ArrowRight, RotateCcw, HelpCircle, ChevronRight, 
  Brain, ShieldCheck, Zap, AlertTriangle, Play, Check, 
  Clock, Flame, Star, Trophy, BookMarked, Eye, ListFilter,
  ArrowLeft
} from 'lucide-react';
import { Domino } from '../types';
import { FichaThemeId } from '../utils/themes';
import { DominoTile } from './DominoTile';
import { safeStorage } from '../utils/storage';

export interface TrainingProgress {
  completedPuzzles: string[]; // puzzle IDs
  categoryScores: { [category: string]: { correct: number; total: number } };
  totalScore: number;
  streak: number;
  bestStreak: number;
  lastTrainedAt?: number;
}

export interface TrainingPuzzle {
  id: string;
  category: 'opening' | 'partner' | 'pass_tracking' | 'tempo_apretar' | 'cuadra' | 'trancado';
  title: string;
  subtitle: string;
  difficulty: 'beginner' | 'intermediate' | 'master';
  scenarioContext: string;
  partnerInfo?: string;
  opponentInfo?: string;
  boardState: Domino[]; // active board chain
  openEnds: [number, number]; // [leftEnd, rightEnd] (empty if opening)
  playerHand: Domino[];
  optimalMove: {
    tile: Domino;
    side?: 'left' | 'right';
    rationale: string;
    cubanPrinciple: string;
  };
  acceptableMoves?: {
    tile: Domino;
    side?: 'left' | 'right';
    score: number;
    explanation: string;
  }[];
  blunderMoves: {
    tile: Domino;
    side?: 'left' | 'right';
    blunderReason: string;
  }[];
}

const TRAINING_MODULES: {
  id: 'opening' | 'partner' | 'pass_tracking' | 'tempo_apretar' | 'cuadra' | 'trancado';
  name: string;
  cubanName: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    id: 'opening',
    name: 'The Opening Lead',
    cubanName: 'La Salida',
    description: 'Learn when to lead heavy doubles with companion strength vs dominant mixed tiles to signal your hand.',
    icon: '🎯',
    color: '#fe7328'
  },
  {
    id: 'partner',
    name: 'Backing Your Partner',
    cubanName: 'Respetar la Salida',
    description: 'Master the golden rule of never eating your partner\'s lead (comerse la salida) and keeping active suits alive.',
    icon: '🤝',
    color: '#8debfd'
  },
  {
    id: 'pass_tracking',
    name: 'Information & Pass Tracking',
    cubanName: 'El Pase & Conteo',
    description: 'Deduce hidden hands from knocked turns, hesitations (la pensada), and suit ledgers across all 55 tiles.',
    icon: '🧠',
    color: '#a78bfa'
  },
  {
    id: 'tempo_apretar',
    name: 'Tempo & Forcing Passes',
    cubanName: 'Apretar & Salir del Ahogo',
    description: 'Starve opponent turns by looping into known weaknesses while dumping heavy point liabilities early.',
    icon: '⚡',
    color: '#34d399'
  },
  {
    id: 'cuadra',
    name: 'Double-Block / Monopoly',
    cubanName: 'La Cuadra & La Virada',
    description: 'Know when squaring both ends declares an unstoppable suit monopoly vs committing a self-destructive trap.',
    icon: '⬛',
    color: '#f43f5e'
  },
  {
    id: 'trancado',
    name: 'Closing the Game',
    cubanName: 'La Traba & El Trancado',
    description: 'Calculate team pip totals to execute precision locks that guarantee victory points for your team.',
    icon: '🔒',
    color: '#fbbf24'
  }
];

export const PUZZLE_DATABASE: TrainingPuzzle[] = [
  // 1. OPENING (La Salida)
  {
    id: 'op_1',
    category: 'opening',
    title: 'The Supported Double Lead',
    subtitle: 'Choosing the right opening double with companion strength (La Suya)',
    difficulty: 'beginner',
    scenarioContext: 'You have won the right to start the first round. Your hand contains [9,9], [8,8], and multiple 9-companions. Which tile should you play to open the table?',
    boardState: [],
    openEnds: [0, 0],
    playerHand: [
      [9, 9], [9, 6], [9, 3], [9, 1], [8, 8], [8, 2], [7, 4], [5, 1], [3, 2], [0, 0]
    ],
    optimalMove: {
      tile: [9, 9],
      rationale: 'Opening [9,9] with 3 companion 9s ([9,6], [9,3], [9,1]) gives you a 4-tile suit monopoly. In Cuban dominoes, opening your strongest long double signals to your partner to keep the 9s alive throughout the match.',
      cubanPrinciple: 'La Salida con Doble & La Suya'
    },
    blunderMoves: [
      {
        tile: [8, 8],
        blunderReason: 'Opening [8,8] only has one companion [8,2]. You sacrifice a 4-tile suit dominance in 9s to lead a weak double that opponents can quickly choke.'
      },
      {
        tile: [0, 0],
        blunderReason: 'Leading [0,0] with zero companion tiles gives up initiative and invites opponents to dump heavy tiles while leaving you defensive.'
      },
      {
        tile: [9, 6],
        blunderReason: 'Playing a mixed tile when holding the long double [9,9] wastes the opportunity to establish clear suit command and misleads your partner.'
      }
    ]
  },
  {
    id: 'op_2',
    category: 'opening',
    title: 'The Mixed Tile Lead (Ficha Mixta)',
    subtitle: 'Opening without doubles: Signaling strength in the higher number',
    difficulty: 'intermediate',
    scenarioContext: 'You won the right to start, but you hold zero doubles in your 10 tiles. According to traditional Cuban signaling, which tile best leads your team\'s attack?',
    boardState: [],
    openEnds: [0, 0],
    playerHand: [
      [9, 8], [9, 7], [9, 4], [9, 0], [7, 5], [7, 2], [6, 3], [5, 2], [4, 1], [3, 0]
    ],
    optimalMove: {
      tile: [9, 8],
      rationale: 'In Cuban Doble Nueve, leading a mixed tile signals dominant strength in the higher number (9). Playing [9,8] establishes your 4-tile strength in 9s while simultaneously offloading 17 heavy pip points.',
      cubanPrinciple: 'La Salida con Ficha Mixta & Salir del Ahogo'
    },
    blunderMoves: [
      {
        tile: [3, 0],
        blunderReason: 'Leading [3,0] signals low-pip strength where you hold weak distribution, failing to inform your partner of your dominant 4-tile 9s line.'
      },
      {
        tile: [7, 5],
        blunderReason: 'Leading [7,5] abandons your 4-tile suit in 9s and signals 7s as your primary attack, leaving your heavy 9s vulnerable.'
      }
    ]
  },
  {
    id: 'op_3',
    category: 'opening',
    title: 'The Unsupported Double Dilemma',
    subtitle: 'Identifying when a heavy double is a liability rather than a lead',
    difficulty: 'master',
    scenarioContext: 'You hold a lone [9,9] with ZERO companion 9s, but you hold four 7s ([7,7], [7,6], [7,3], [7,1]). Which opening play gives your team the highest mathematical win rate?',
    boardState: [],
    openEnds: [0, 0],
    playerHand: [
      [9, 9], [7, 7], [7, 6], [7, 3], [7, 1], [6, 2], [5, 4], [4, 2], [3, 0], [1, 0]
    ],
    optimalMove: {
      tile: [7, 7],
      rationale: 'Leading a naked [9,9] with no companion 9s is an amateur trap—opponents will choke 9s and leave your partner confused. Opening [7,7] with 3 companion 7s establishes genuine suit command ("la suya") and gives your team sustained offensive tempo.',
      cubanPrinciple: 'Dominancia Real de Palo (La Suya > Doble Huérfana)'
    },
    blunderMoves: [
      {
        tile: [9, 9],
        blunderReason: 'Playing a naked [9,9] with zero companions is called an "orphan double". Your partner will fight to keep 9s open while you can never support them, exhausting your partner\'s hand.'
      }
    ]
  },

  // 2. PARTNER COORDINATION (Respetar la Salida)
  {
    id: 'pt_1',
    category: 'partner',
    title: 'The Sacred Lead (No Te Comas la Salida)',
    subtitle: 'Protecting your partner\'s opening suit on your first response turn',
    difficulty: 'beginner',
    scenarioContext: 'Your partner (Seat 2) opened the round with [9,9]. Right Opponent played [9,5] on the right end. The board now has [9] on the Left and [5] on the Right. You hold [9,2] and [5,4]. Which move do you make?',
    partnerInfo: 'Partner opened with [9,9] (Signaling 9s are their primary suit)',
    opponentInfo: 'Right opponent played [9,5] on the right side',
    boardState: [[9, 9], [9, 5]],
    openEnds: [9, 5],
    playerHand: [
      [9, 2], [5, 4], [8, 3], [7, 1], [6, 0], [4, 2], [3, 1], [2, 0]
    ],
    optimalMove: {
      tile: [5, 4],
      side: 'right',
      rationale: 'Playing [5,4] on the right preserves the [9] open on the left for your partner! Playing [9,2] on the left would "eat" your partner\'s lead ("comerse la salida"), which is considered the worst tactical blunder in Cuban dominoes when an alternate play is available.',
      cubanPrinciple: 'Respetar la Salida del Compañero'
    },
    blunderMoves: [
      {
        tile: [9, 2],
        side: 'left',
        blunderReason: 'You played over the left [9], choking the very suit your partner opened with! This leaves no open 9 for your partner to continue their offensive run.'
      }
    ]
  },
  {
    id: 'pt_2',
    category: 'partner',
    title: 'Re-Opening Partner\'s Lead',
    subtitle: 'Using a mixed tile to restore your partner\'s active suit',
    difficulty: 'intermediate',
    scenarioContext: 'Partner opened with [8,6] (signaling strength in 8s). Left opponent covered the 6 with [6,2]. The board now has [8] on the Left and [2] on the Right. You hold [2,8] and [2,1]. Which tile should you play on the right end?',
    partnerInfo: 'Partner opened with [8,6] (Signaling 8s as primary attack)',
    opponentInfo: 'Left Opponent covered 6 with [6,2]',
    boardState: [[8, 6], [6, 2]],
    openEnds: [8, 2],
    playerHand: [
      [2, 8], [2, 1], [7, 4], [5, 3], [5, 0], [4, 0], [0, 0]
    ],
    optimalMove: {
      tile: [2, 8],
      side: 'right',
      rationale: 'Playing [2,8] on the right end creates a double-8 situation ([8] on Left, [8] on Right)! This completely restores your partner\'s lead, assuring that whoever plays next, your partner will have an active 8 to play on.',
      cubanPrinciple: 'Reabrir el Palo del Compañero'
    },
    blunderMoves: [
      {
        tile: [2, 8],
        side: 'left',
        blunderReason: 'Playing [2,8] on the left covers the partner\'s 8 and squares on 2s. Play [2,8] on the right to restore your partner\'s 8!'
      },
      {
        tile: [2, 1],
        side: 'right',
        blunderReason: 'Playing [2,1] leaves [1] open on the right and misses the chance to return the board to your partner\'s dominant 8 suit.'
      }
    ]
  },

  // 3. INFORMATION THEORY & PASS TRACKING (El Pase & Conteo)
  {
    id: 'ps_1',
    category: 'pass_tracking',
    title: 'The Absolute Elimination',
    subtitle: 'Logging missing suits when an opponent knocks on the table',
    difficulty: 'beginner',
    scenarioContext: 'Right Opponent passed (knocked) when the open ends were [7] and [4]. It is now your turn. The board currently stands at [7] on Left and [6] on Right. You hold [7,3] and [6,4]. Which move guarantees that Right Opponent passes again on their next turn?',
    opponentInfo: 'Right Opponent knocked on [7] and [4] (Holds ZERO 7s and ZERO 4s)',
    boardState: [[7, 2], [2, 5], [5, 6]],
    openEnds: [7, 6],
    playerHand: [
      [7, 3], [6, 4], [8, 1], [5, 0], [3, 2], [1, 1]
    ],
    optimalMove: {
      tile: [6, 4],
      side: 'right',
      rationale: 'Right opponent is confirmed to hold ZERO 7s and ZERO 4s! By playing [6,4] on the right end, the board now has [7] on Left and [4] on Right. Since Right Opponent has neither suit, they are 100% guaranteed to pass their next turn again!',
      cubanPrinciple: 'Apretar al Contrario por Pase Seguro'
    },
    blunderMoves: [
      {
        tile: [7, 3],
        side: 'left',
        blunderReason: 'Playing [7,3] leaves [3] and [6] open. Right opponent only knocked on 7 and 4, so they may easily hold a 3 or 6, letting them back into the game.'
      }
    ]
  },
  {
    id: 'ps_2',
    category: 'pass_tracking',
    title: 'Suit Ledger: The 10-Tile Count',
    subtitle: 'Deducing where the last hidden tile resides in Doble Nueve',
    difficulty: 'master',
    scenarioContext: 'You are counting 6s. There are 10 tiles of 6 in total (0-6 to 9-6). 7 tiles with 6 are visible on the board. You hold [6,6] and [6,2] (2 tiles). Exactly ONE tile of 6 remains unplayed ([6,1]). Partner passed on 1 earlier. Who holds the [6,1]?',
    boardState: [[6, 9], [9, 8], [8, 6], [6, 5], [5, 4], [4, 6], [6, 3], [3, 0], [0, 6]],
    openEnds: [6, 6],
    partnerInfo: 'Partner passed on [1] in round 2',
    playerHand: [
      [6, 6], [6, 2], [8, 7], [4, 0]
    ],
    optimalMove: {
      tile: [6, 6],
      rationale: '7 visible on board + 2 in your hand = 9 tiles of 6 accounted for. The only remaining 6 is [6,1]. Because your partner has zero 1s (confirmed from their earlier pass), the [6,1] MUST be in the hands of the opposing team or in the locked 15-tile pool. You can safely play [6,6] knowing the exact distribution.',
      cubanPrinciple: 'El Conteo Exhaustivo de Palo (10 Fichas por Número)'
    },
    blunderMoves: [
      {
        tile: [6, 2],
        blunderReason: 'Playing [6,2] leaves [2] exposed and holds onto the heavy [6,6] double (12 pts) when you could safely offload the double.'
      }
    ]
  },

  // 4. TEMPO & APRETAR (Apretar & Salir del Ahogo)
  {
    id: 'tp_1',
    category: 'tempo_apretar',
    title: 'Unloading Heavy Doubles (Salir del Ahogo)',
    subtitle: 'Getting rid of dangerous high pips before the game tightens',
    difficulty: 'beginner',
    scenarioContext: 'The board has [8] on the Left and [5] on the Right. You have [8,8] (16 pts) and [8,1] (9 pts). Opponents are playing rapidly and the game is nearing a block. Which 8 should you play?',
    boardState: [[8, 4], [4, 3], [3, 5]],
    openEnds: [8, 5],
    playerHand: [
      [8, 8], [8, 1], [7, 2], [6, 0], [2, 1]
    ],
    optimalMove: {
      tile: [8, 8],
      side: 'left',
      rationale: 'High doubles like [8,8] and [9,9] are fatal liabilities if the round is locked (trancado). Unloading heavy doubles early ("salir del ahogo") removes 16 risk points from your hand while keeping your flexible [8,1] for later.',
      cubanPrinciple: 'Salir del Ahogo con Dobles Pesadas'
    },
    blunderMoves: [
      {
        tile: [8, 1],
        side: 'left',
        blunderReason: 'Holding onto [8,8] traps 16 points in your hand. If opponents close the game or domino soon, your team will suffer heavy point penalties.'
      }
    ]
  },

  // 5. THE CUADRA (La Cuadra & La Virada)
  {
    id: 'cd_1',
    category: 'cuadra',
    title: 'The Masterful Double-Square (La Cuadra Ganadora)',
    subtitle: 'When squaring both ends declares an unstoppable suit monopoly',
    difficulty: 'intermediate',
    scenarioContext: 'The board has [7] on Left and [5] on Right. You hold [5,7], [7,6], [7,2], and [7,0]. You hold 4 of the remaining 7s. Which play executes the legendary Cuban Cuadra?',
    boardState: [[7, 4], [4, 1], [1, 5]],
    openEnds: [7, 5],
    playerHand: [
      [5, 7], [7, 6], [7, 2], [7, 0], [3, 2]
    ],
    optimalMove: {
      tile: [5, 7],
      side: 'right',
      rationale: 'Playing [5,7] on the right makes both open ends [7]! Because you hold 3 other 7s in your hand ([7,6], [7,2], [7,0]), you own an absolute suit monopoly. No matter who plays or passes, you will command every subsequent turn!',
      cubanPrinciple: 'La Cuadra con Monopolio de Palo'
    },
    blunderMoves: [
      {
        tile: [5, 7],
        side: 'left',
        blunderReason: 'Playing [5,7] on the left squares the board on 5s! You only have one other 5, while holding three 7s. Play on the right to square on 7s where you hold dominant suit control.'
      },
      {
        tile: [7, 6],
        side: 'left',
        blunderReason: 'Playing [7,6] leaves [6] and [5] open, letting opponents maintain tempo and failing to exploit your dominant 7s monopoly.'
      }
    ]
  },
  {
    id: 'cd_2',
    category: 'cuadra',
    title: 'The Suicidal Blind Square (La Cuadra Ciega)',
    subtitle: 'Recognizing when squaring the board without suit support is fatal',
    difficulty: 'master',
    scenarioContext: 'The board has [9] on Left and [4] on Right. You hold [4,9] as your ONLY remaining 9. You have zero other 9s. Should you play [4,9] on the right to square the 9s?',
    boardState: [[9, 3], [3, 2], [2, 4]],
    openEnds: [9, 4],
    playerHand: [
      [4, 9], [4, 6], [4, 1], [6, 2], [3, 1]
    ],
    optimalMove: {
      tile: [4, 6],
      side: 'right',
      rationale: 'Playing [4,9] to square the 9s when you hold ZERO other 9s is a suicidal "blind square" ("cuadra ciega"). You will immediately lock yourself out and gift the opponents total board control. Playing [4,6] protects your hand and keeps your 4s active.',
      cubanPrinciple: 'Evitar la Cuadra Ciega sin Palo'
    },
    blunderMoves: [
      {
        tile: [4, 9],
        side: 'right',
        blunderReason: 'You squared the board on 9s while holding ZERO other 9s! You gave up all flexibility and gave opponents an open invitation to run the table.'
      }
    ]
  },

  // 6. CLOSING THE GAME / TRANCADO (La Traba & El Trancado)
  {
    id: 'tr_1',
    category: 'trancado',
    title: 'The Winning Calculated Lock',
    subtitle: 'Knowing when to lock the game based on low hand pip sum',
    difficulty: 'intermediate',
    scenarioContext: 'Open ends are [3] and [3]. You hold [3,0] and [0,1] (Total: 4 pips). The 3s are exhausted across the board. Playing [3,0] will cause an immediate trancado (lock). Should you lock the game?',
    boardState: [[3, 8], [8, 5], [5, 3]],
    openEnds: [3, 3],
    playerHand: [
      [3, 0], [0, 1]
    ],
    optimalMove: {
      tile: [3, 0],
      rationale: 'Playing [3,0] locks the game while leaving you with only [0,1] (1 single pip!). Under Cuban rules, the player with the lowest single hand wins the trancado for their team. With only 1 pip remaining, your team is virtually guaranteed to win the lock and take all opposing points!',
      cubanPrinciple: 'El Trancado Seguro por Mano Baja'
    },
    blunderMoves: []
  }
];

// Strictly validate that all puzzles have zero duplicate dominoes across board and player hand
const validatePuzzleIntegrity = () => {
  PUZZLE_DATABASE.forEach(puzzle => {
    const tileKey = (t: Domino) => `${Math.min(t[0], t[1])}-${Math.max(t[0], t[1])}`;
    const seenTiles = new Set<string>();

    puzzle.boardState.forEach(tile => {
      const key = tileKey(tile);
      if (seenTiles.has(key)) {
        console.error(`[DominoTrainingAcademy] Duplicate tile ${key} in boardState for puzzle ${puzzle.id}`);
      }
      seenTiles.add(key);
    });

    puzzle.playerHand.forEach(tile => {
      const key = tileKey(tile);
      if (seenTiles.has(key)) {
        console.error(`[DominoTrainingAcademy] Duplicate tile ${key} between board and hand in puzzle ${puzzle.id}`);
      }
      seenTiles.add(key);
    });
  });
};
validatePuzzleIntegrity();

export const CUBAN_GLOSSARY: { term: string; pronunciation: string; definition: string; tip: string }[] = [
  {
    term: 'La Salida',
    pronunciation: 'lah sah-LEE-dah',
    definition: 'The opening lead of a round. In Doble Nueve, the team starting the round chooses who plays first.',
    tip: 'Opening with a double signals heavy suit control. Opening with a mixed tile signals higher-pip strength.'
  },
  {
    term: 'Respetar la Salida',
    pronunciation: 'rres-peh-TAR lah sah-LEE-dah',
    definition: 'The golden etiquette between partners: never play over (choke) your partner’s opening suit if you have another legal move.',
    tip: 'Always play on the other end to keep your partner’s primary weapon open.'
  },
  {
    term: 'Comerse la Salida',
    pronunciation: 'coh-MEHR-seh lah sah-LEE-dah',
    definition: 'Covering your partner\'s opening lead. The cardinal sin of Cuban dominoes unless forced by having no other play.',
    tip: 'If you must eat the lead, your partner knows you are completely dry in that suit or in an emergency pivot.'
  },
  {
    term: 'La Cuadra',
    pronunciation: 'lah KWAH-drah',
    definition: 'Playing a tile that makes both open ends of the board the exact same number.',
    tip: 'Only square the board if you hold 2+ companion tiles or know both opponents are locked out of that suit.'
  },
  {
    term: 'La Virada',
    pronunciation: 'lah vee-RAH-dah',
    definition: 'A turnaround play that flips the active suit on the table to your own dominant line when partner\'s suit is exhausted.',
    tip: 'Signals to your partner that you are taking over the offensive command.'
  },
  {
    term: 'El Pase / El Toque',
    pronunciation: 'el PAH-seh / el TOH-keh',
    definition: 'Knocking on the table when you have no legal moves matching either open end.',
    tip: 'An instant information goldmine: everyone at the table knows you hold zero tiles matching both open ends.'
  },
  {
    term: 'A Quemarropa (Instant Play)',
    pronunciation: 'ah keh-mah-RROH-pah',
    definition: 'Playing immediately with zero hesitation, signaling to the table that you hold only ONE legal tile for that end.',
    tip: 'Fast play confirms you have zero alternative choices in that suit.'
  },
  {
    term: 'La Pensada (The Pause)',
    pronunciation: 'lah pehn-SAH-dah',
    definition: 'Taking a deliberate 2-3 second pause before playing to signal that you hold multiple valid options for that end.',
    tip: 'Tells your partner you have depth and flexibility in that number.'
  },
  {
    term: 'La Suya',
    pronunciation: 'lah SOO-yah',
    definition: 'Your dominant suit—the number where you hold 4 or more tiles out of the 10 available in Doble Nueve.',
    tip: 'Dominating "la suya" allows you to control the tempo and force opponent passes.'
  },
  {
    term: 'Salir del Ahogo',
    pronunciation: 'sah-LEER del ah-OH-goh',
    definition: 'Dumping heavy double tiles (9-9, 8-8, 7-7) early in the match to prevent high point penalties if the round locks.',
    tip: 'Never sit on heavy doubles when safe opportunities to play them arise.'
  },
  {
    term: 'La Traba / El Trancado',
    pronunciation: 'lah TRAH-bah / el trahn-KAH-doh',
    definition: 'When the game is completely blocked and no player on the table has a valid move.',
    tip: 'The team with the single lowest player hand wins all pips remaining in opponents\' hands!'
  }
];

interface DominoTrainingAcademyProps {
  onBack: () => void;
  fichaTheme?: FichaThemeId;
  onPlayClack?: () => void;
  onPlayWin?: () => void;
}

export const DominoTrainingAcademy: React.FC<DominoTrainingAcademyProps> = ({
  onBack,
  fichaTheme = 'havana',
  onPlayClack,
  onPlayWin
}) => {
  const [activeTab, setActiveTab] = useState<'drills' | 'glossary'>('drills');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePuzzleIndex, setActivePuzzleIndex] = useState<number>(0);
  const [selectedTileIdx, setSelectedTileIdx] = useState<number | null>(null);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [principleText, setPrincipleText] = useState<string>('');

  // Persistent Progress
  const [progress, setProgress] = useState<TrainingProgress>(() => {
    const saved = safeStorage.getItem('cuban_dominoes_training_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            completedPuzzles: Array.isArray(parsed.completedPuzzles) ? parsed.completedPuzzles : [],
            categoryScores: parsed.categoryScores && typeof parsed.categoryScores === 'object' ? parsed.categoryScores : {},
            totalScore: typeof parsed.totalScore === 'number' ? parsed.totalScore : 0,
            streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
            bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0,
            lastTrainedAt: typeof parsed.lastTrainedAt === 'number' ? parsed.lastTrainedAt : Date.now()
          };
        }
      } catch (e) {
        console.warn('Failed parsing training progress', e);
      }
    }
    return {
      completedPuzzles: [],
      categoryScores: {},
      totalScore: 0,
      streak: 0,
      bestStreak: 0,
      lastTrainedAt: Date.now()
    };
  });

  const saveProgress = (newProgress: TrainingProgress) => {
    setProgress(newProgress);
    safeStorage.setItem('cuban_dominoes_training_progress', JSON.stringify(newProgress));
  };

  const filteredPuzzles = useMemo(() => {
    if (selectedCategory === 'all') return PUZZLE_DATABASE;
    return PUZZLE_DATABASE.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const currentPuzzle = filteredPuzzles[activePuzzleIndex] || filteredPuzzles[0];

  // Reset puzzle selection state when switching puzzles
  useEffect(() => {
    setSelectedTileIdx(null);
    setSelectedSide(null);
    setShowResult(false);
    setFeedbackText('');
    setPrincipleText('');
  }, [activePuzzleIndex, selectedCategory]);

  const handleSelectTile = (idx: number) => {
    if (showResult) return;
    if (onPlayClack) onPlayClack();
    setSelectedTileIdx(idx);
    
    // If opening or both ends match or only one end possible, auto set side
    if (currentPuzzle.boardState.length === 0) {
      setSelectedSide(null);
    } else {
      const tile = currentPuzzle.playerHand[idx];
      const leftVal = currentPuzzle.openEnds[0];
      const rightVal = currentPuzzle.openEnds[1];
      const canLeft = tile[0] === leftVal || tile[1] === leftVal;
      const canRight = tile[0] === rightVal || tile[1] === rightVal;
      
      if (leftVal === rightVal) {
        // Both open ends are the exact same suit number
        setSelectedSide('right');
      } else if (canLeft && !canRight) {
        setSelectedSide('left');
      } else if (!canLeft && canRight) {
        setSelectedSide('right');
      } else if (canLeft && canRight) {
        // If tile matches both ends, auto-default to optimal side if this is optimal tile
        const isOptimalTile = (tile[0] === currentPuzzle.optimalMove.tile[0] && tile[1] === currentPuzzle.optimalMove.tile[1]) ||
                              (tile[0] === currentPuzzle.optimalMove.tile[1] && tile[1] === currentPuzzle.optimalMove.tile[0]);
        if (isOptimalTile && currentPuzzle.optimalMove.side) {
          setSelectedSide(currentPuzzle.optimalMove.side);
        } else if (!selectedSide) {
          setSelectedSide('right');
        }
      } else {
        setSelectedSide(null);
      }
    }
  };

  const handleSubmitMove = () => {
    if (selectedTileIdx === null) return;
    const tile = currentPuzzle.playerHand[selectedTileIdx];
    const leftVal = currentPuzzle.openEnds[0];
    const rightVal = currentPuzzle.openEnds[1];
    const canLeft = currentPuzzle.boardState.length === 0 || tile[0] === leftVal || tile[1] === leftVal;
    const canRight = currentPuzzle.boardState.length === 0 || tile[0] === rightVal || tile[1] === rightVal;

    let effectiveSide = selectedSide;
    if (currentPuzzle.boardState.length === 0 || leftVal === rightVal) {
      effectiveSide = undefined;
    } else if (canLeft && !canRight) {
      effectiveSide = 'left';
    } else if (!canLeft && canRight) {
      effectiveSide = 'right';
    } else if (!effectiveSide) {
      effectiveSide = currentPuzzle.optimalMove.side || 'right';
    }

    // Check if match optimal tile
    const isOptimalTile = (tile[0] === currentPuzzle.optimalMove.tile[0] && tile[1] === currentPuzzle.optimalMove.tile[1]) ||
                          (tile[0] === currentPuzzle.optimalMove.tile[1] && tile[1] === currentPuzzle.optimalMove.tile[0]);
    
    // Check if match optimal side
    const isOptimalSide = !currentPuzzle.optimalMove.side ||
                          !effectiveSide ||
                          leftVal === rightVal ||
                          currentPuzzle.boardState.length === 0 ||
                          currentPuzzle.optimalMove.side === effectiveSide;

    const correct = isOptimalTile && isOptimalSide;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      if (onPlayWin) onPlayWin();
      setFeedbackText(currentPuzzle.optimalMove.rationale);
      setPrincipleText(currentPuzzle.optimalMove.cubanPrinciple);

      // Update progress
      const isNewCompletion = !progress.completedPuzzles.includes(currentPuzzle.id);
      const newCompleted = isNewCompletion ? [...progress.completedPuzzles, currentPuzzle.id] : progress.completedPuzzles;
      const newStreak = progress.streak + 1;
      const newBestStreak = Math.max(progress.bestStreak, newStreak);
      const newScore = progress.totalScore + 100 + (isNewCompletion ? 50 : 0);

      const cat = currentPuzzle.category;
      const catPrev = progress.categoryScores[cat] || { correct: 0, total: 0 };
      const newCategoryScores = {
        ...progress.categoryScores,
        [cat]: {
          correct: catPrev.correct + 1,
          total: catPrev.total + 1
        }
      };

      saveProgress({
        ...progress,
        completedPuzzles: newCompleted,
        categoryScores: newCategoryScores,
        totalScore: newScore,
        streak: newStreak,
        bestStreak: newBestStreak,
        lastTrainedAt: Date.now()
      });
    } else {
      if (onPlayClack) onPlayClack();
      const blunder = currentPuzzle.blunderMoves.find(b => {
        const matchesTile = (b.tile[0] === tile[0] && b.tile[1] === tile[1]) || (b.tile[0] === tile[1] && b.tile[1] === tile[0]);
        if (!matchesTile) return false;
        if (b.side && effectiveSide && b.side !== effectiveSide) return false;
        return true;
      }) || currentPuzzle.blunderMoves.find(b => 
        (b.tile[0] === tile[0] && b.tile[1] === tile[1]) || (b.tile[0] === tile[1] && b.tile[1] === tile[0])
      );

      if (blunder) {
        setFeedbackText(blunder.blunderReason);
      } else {
        setFeedbackText(`While this play is legal, it violates the master Cuban line: ${currentPuzzle.optimalMove.rationale}`);
      }
      setPrincipleText(currentPuzzle.optimalMove.cubanPrinciple);

      const cat = currentPuzzle.category;
      const catPrev = progress.categoryScores[cat] || { correct: 0, total: 0 };
      saveProgress({
        ...progress,
        streak: 0,
        categoryScores: {
          ...progress.categoryScores,
          [cat]: {
            correct: catPrev.correct,
            total: catPrev.total + 1
          }
        },
        lastTrainedAt: Date.now()
      });
    }
  };

  const handleNextPuzzle = () => {
    if (activePuzzleIndex < filteredPuzzles.length - 1) {
      setActivePuzzleIndex(prev => prev + 1);
    } else {
      setActivePuzzleIndex(0);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-3 sm:px-6">
      {/* HEADER NAVIGATION */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#d5c3bd]/30 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-[#200d07]/80 hover:bg-[#200d07] border border-[#83746f]/40 hover:border-[#8debfd] text-[#8debfd] rounded-sm transition-all flex items-center gap-1.5 font-mono text-xs font-bold uppercase cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Table</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[#fff9eb] tracking-tight uppercase">
                DOMINO SKILLS ACADEMY
              </h2>
              <span className="px-2 py-0.5 bg-[#fe7328] text-[#32170d] font-mono text-[10px] font-black rounded-xs uppercase tracking-wider">
                PRO MASTER
              </span>
            </div>
            <p className="text-xs font-serif italic text-[#d5c3bd]">
              Master the 6 key principles & implicit non-verbal signaling of Cuban Doble Nueve
            </p>
          </div>
        </div>

        {/* PROGRESS METRICS */}
        <div className="flex items-center gap-3 bg-[#200d07]/90 border border-[#83746f]/40 rounded-sm px-3.5 py-2 font-mono text-xs shadow-md">
          <div className="flex items-center gap-1.5 text-[#fbbf24]">
            <Trophy className="w-4 h-4" />
            <span className="font-bold">{progress.totalScore} PTS</span>
          </div>
          <span className="text-[#83746f]">|</span>
          <div className="flex items-center gap-1.5 text-[#fe7328]">
            <Flame className="w-4 h-4" />
            <span className="font-bold">{progress.streak} Streak</span>
          </div>
          <span className="text-[#83746f]">|</span>
          <div className="flex items-center gap-1.5 text-[#8debfd]">
            <Award className="w-4 h-4" />
            <span>{progress.completedPuzzles.length}/{PUZZLE_DATABASE.length} Mastered</span>
          </div>
        </div>
      </header>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#d5c3bd]/30 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('drills')}
          className={`px-4 py-2 rounded-sm font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'drills'
              ? 'bg-[#006876] text-white shadow-md'
              : 'bg-[#200d07]/60 text-[#eee8da] hover:bg-[#200d07]/90 border border-[#83746f]/30'
          }`}
        >
          <Target className="w-4 h-4 text-[#8debfd]" />
          <span>Tactical Drills & Puzzles</span>
        </button>

        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-4 py-2 rounded-sm font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'glossary'
              ? 'bg-[#006876] text-white shadow-md'
              : 'bg-[#200d07]/60 text-[#eee8da] hover:bg-[#200d07]/90 border border-[#83746f]/30'
          }`}
        >
          <BookMarked className="w-4 h-4 text-[#fbbf24]" />
          <span>Cuban Signaling Glossary</span>
        </button>
      </div>

      {/* TAB 1: DRILLS & PUZZLES */}
      {activeTab === 'drills' && (
        <div className="space-y-6">
          {/* CATEGORY PILL SELECTOR */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory('all'); setActivePuzzleIndex(0); }}
              className={`px-3 py-1.5 rounded-sm font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#fe7328] text-[#32170d] shadow-sm'
                  : 'bg-[#200d07]/80 text-[#d5c3bd] border border-[#83746f]/40 hover:text-white'
              }`}
            >
              All Modules ({PUZZLE_DATABASE.length})
            </button>
            {TRAINING_MODULES.map(mod => {
              const count = PUZZLE_DATABASE.filter(p => p.category === mod.id).length;
              return (
                <button
                  key={mod.id}
                  onClick={() => { setSelectedCategory(mod.id); setActivePuzzleIndex(0); }}
                  className={`px-3 py-1.5 rounded-sm font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedCategory === mod.id
                      ? 'bg-[#006876] text-white shadow-sm'
                      : 'bg-[#200d07]/80 text-[#d5c3bd] border border-[#83746f]/40 hover:text-white'
                  }`}
                >
                  <span>{mod.icon}</span>
                  <span>{mod.name}</span>
                  <span className="opacity-60 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* MAIN PUZZLE CARD */}
          <div className="linen-card p-6 md:p-8 relative shadow-2xl border border-[#d5c3bd]">
            {/* PUZZLE HEADER */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#d5c3bd]/70 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-[#32170d] text-[#8debfd] font-mono text-[10px] font-black rounded-xs uppercase">
                    PUZZLE {activePuzzleIndex + 1} OF {filteredPuzzles.length}
                  </span>
                  <span className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded-xs uppercase ${
                    currentPuzzle.difficulty === 'beginner' ? 'bg-emerald-800 text-white' :
                    currentPuzzle.difficulty === 'intermediate' ? 'bg-amber-800 text-white' : 'bg-rose-900 text-white'
                  }`}>
                    {currentPuzzle.difficulty}
                  </span>
                  {progress.completedPuzzles.includes(currentPuzzle.id) && (
                    <span className="flex items-center gap-1 text-emerald-700 font-mono text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mastered</span>
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-display font-black text-[#1d1c13] uppercase tracking-tight">
                  {currentPuzzle.title}
                </h3>
                <p className="text-sm font-serif italic text-[#504440]">
                  {currentPuzzle.subtitle}
                </p>
              </div>

              {/* PUZZLE NAVIGATION BUTTONS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePuzzleIndex(prev => Math.max(0, prev - 1))}
                  disabled={activePuzzleIndex === 0}
                  className="px-3 py-1.5 border border-[#83746f]/50 text-[#1d1c13] disabled:opacity-30 rounded-sm font-mono text-xs font-bold hover:bg-[#eee8da] cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={handleNextPuzzle}
                  className="px-3 py-1.5 btn-turquoise rounded-sm font-mono text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Next Drill</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* SCENARIO CONTEXT BOX */}
            <div className="bg-[#f4efe4] border-l-4 border-[#006876] p-4 rounded-r-sm space-y-2 mb-6 text-[#1d1c13] shadow-inner">
              <div className="flex items-center gap-2 text-[#006876] font-mono text-xs font-black uppercase">
                <Brain className="w-4 h-4" />
                <span>Tactical Scenario:</span>
              </div>
              <p className="text-sm leading-relaxed font-sans font-medium">
                {currentPuzzle.scenarioContext}
              </p>
              {(currentPuzzle.partnerInfo || currentPuzzle.opponentInfo) && (
                <div className="pt-2 flex flex-wrap gap-3 border-t border-[#d5c3bd]/60 text-xs font-mono">
                  {currentPuzzle.partnerInfo && (
                    <span className="text-[#006876] font-bold">
                      👥 Partner Intel: {currentPuzzle.partnerInfo}
                    </span>
                  )}
                  {currentPuzzle.opponentInfo && (
                    <span className="text-[#fe7328] font-bold">
                      ⚠️ Opponent Intel: {currentPuzzle.opponentInfo}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* BOARD VIEW */}
            <div className="mb-6">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#504440] font-bold mb-2 flex items-center justify-between">
                <span>Active Table Board</span>
                {currentPuzzle.boardState.length > 0 && (
                  <span className="text-[#006876] font-bold">
                    Open Ends: Left [{currentPuzzle.openEnds[0]}] • Right [{currentPuzzle.openEnds[1]}]
                  </span>
                )}
              </div>

              <div className="bg-[#200d07] border-2 border-[#83746f]/50 rounded-sm py-3 px-3 min-h-[96px] flex items-center shadow-inner overflow-x-auto scrollbar-thin">
                {currentPuzzle.boardState.length === 0 ? (
                  <div className="w-full text-center font-serif italic text-[#d5c3bd]/70 text-sm py-4">
                    ✨ Table is currently empty. You are making the opening lead (La Salida)!
                  </div>
                ) : (
                  <div className="flex w-max min-w-full items-center justify-start sm:justify-center gap-1 sm:gap-1.5 px-3 py-1">
                    {currentPuzzle.boardState.map((tile, i) => {
                      const isDouble = tile[0] === tile[1];
                      const boardTileSize = currentPuzzle.boardState.length > 6 ? 'xs' : currentPuzzle.boardState.length > 3 ? 'sm' : 'md';
                      return (
                        <div key={i} className="flex items-center shrink-0">
                          <DominoTile
                            val1={tile[0]}
                            val2={tile[1]}
                            isDouble={isDouble}
                            size={boardTileSize}
                            orientation={isDouble ? 'vertical' : 'horizontal'}
                            fichaTheme={fichaTheme}
                            disableHover
                          />
                          {i < currentPuzzle.boardState.length - 1 && (
                            <div className="w-1.5 sm:w-2 h-0.5 bg-[#8debfd]/50 mx-0.5 sm:mx-1 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* PLAYER HAND SELECTION */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-widest text-[#1d1c13] font-bold">
                  Your Hand ({currentPuzzle.playerHand.length} Tiles) — Click to Select Move
                </label>
                {selectedTileIdx !== null && currentPuzzle.boardState.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#1d1c13]">Target End:</span>
                    {currentPuzzle.openEnds[0] === currentPuzzle.openEnds[1] ? (
                      <span className="px-2.5 py-1 rounded-xs font-mono text-xs font-bold uppercase bg-[#006876] text-white shadow-sm">
                        Either End [{currentPuzzle.openEnds[0]}]
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedSide('left')}
                          className={`px-2.5 py-1 rounded-xs font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                            selectedSide === 'left' ? 'bg-[#006876] text-white shadow-sm ring-1 ring-[#8debfd]' : 'bg-[#f3eddf] text-[#504440] border border-[#83746f]/40 hover:bg-[#eee8da]'
                          }`}
                        >
                          Left [{currentPuzzle.openEnds[0]}]
                        </button>
                        <button
                          onClick={() => setSelectedSide('right')}
                          className={`px-2.5 py-1 rounded-xs font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
                            selectedSide === 'right' ? 'bg-[#006876] text-white shadow-sm ring-1 ring-[#8debfd]' : 'bg-[#f3eddf] text-[#504440] border border-[#83746f]/40 hover:bg-[#eee8da]'
                          }`}
                        >
                          Right [{currentPuzzle.openEnds[1]}]
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-[#f4efe4] p-4 rounded-sm border border-[#d5c3bd] flex flex-wrap gap-2.5 items-center justify-center shadow-inner">
                {currentPuzzle.playerHand.map((tile, idx) => {
                  const isSelected = selectedTileIdx === idx;
                  const isDouble = tile[0] === tile[1];

                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -4, scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelectTile(idx)}
                      className={`relative cursor-pointer transition-all rounded-xs ${
                        isSelected 
                          ? 'ring-4 ring-[#fe7328] ring-offset-2 ring-offset-[#f4efe4] -translate-y-2' 
                          : 'hover:opacity-90'
                      }`}
                    >
                      <DominoTile
                        val1={tile[0]}
                        val2={tile[1]}
                        isDouble={isDouble}
                        size="md"
                        orientation="vertical"
                        fichaTheme={fichaTheme}
                        highlighted={isSelected}
                      />
                      <div className="text-center font-mono text-[9px] font-bold text-[#504440] mt-1">
                        [{tile[0]}-{tile[1]}]
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ACTION BUTTON */}
            {!showResult ? (
              <button
                onClick={handleSubmitMove}
                disabled={selectedTileIdx === null}
                className="w-full py-4 btn-turquoise rounded-sm font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40"
              >
                <span>Execute Move & Test Cuban Mastery</span>
                <Play className="w-4 h-4 fill-white" />
              </button>
            ) : (
              /* RESULT FEEDBACK CARD */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-sm border-2 space-y-4 shadow-xl ${
                  isCorrect 
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100' 
                    : 'bg-rose-950/80 border-rose-500 text-rose-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xl font-display font-black uppercase tracking-tight">
                        {isCorrect ? 'EXCELLENT! PRO MASTER MOVE' : 'TACTICAL BLUNDER / SUBOPTIMAL'}
                      </h4>
                      <p className="text-xs font-mono font-bold tracking-widest uppercase opacity-80">
                        Principle: {principleText}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleNextPuzzle}
                    className="px-5 py-2.5 bg-white text-[#1d1c13] font-mono text-xs font-black uppercase rounded-sm shadow-md hover:bg-[#eee8da] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Next Drill</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-black/30 p-4 rounded-sm font-sans text-sm leading-relaxed border border-white/10">
                  {feedbackText}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => { setShowResult(false); setSelectedTileIdx(null); }}
                    className="px-4 py-1.5 border border-white/30 text-white font-mono text-xs font-bold uppercase rounded-sm hover:bg-white/10 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CUBAN SIGNALING GLOSSARY */}
      {activeTab === 'glossary' && (
        <div className="space-y-6">
          <div className="linen-card p-6 md:p-8 relative shadow-2xl border border-[#d5c3bd] space-y-6">
            <div className="border-b border-[#d5c3bd]/60 pb-4">
              <h3 className="text-2xl font-display font-black text-[#1d1c13] uppercase tracking-tight">
                CUBAN DOMINO NON-VERBAL SIGNALING & TERMS
              </h3>
              <p className="text-sm font-serif italic text-[#504440]">
                In authentic Cuban Doble Nueve, talking is strictly forbidden. Players communicate through precise tile timings and placements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CUBAN_GLOSSARY.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#f4efe4] p-5 rounded-sm border border-[#d5c3bd] shadow-sm hover:border-[#006876] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-[#d5c3bd]/60 pb-2">
                    <span className="font-display font-black text-lg text-[#1d1c13] uppercase">
                      {item.term}
                    </span>
                    <span className="font-mono text-[10px] text-[#006876] font-bold italic">
                      /{item.pronunciation}/
                    </span>
                  </div>
                  <p className="text-xs font-sans text-[#1d1c13] leading-relaxed font-medium">
                    {item.definition}
                  </p>
                  <div className="bg-[#006876]/10 border-l-2 border-[#006876] p-2 text-[11px] font-serif text-[#006876] font-bold">
                    💡 Master Tip: {item.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
