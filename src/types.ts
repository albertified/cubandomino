export type Domino = [number, number];

export type PlayerType = 'human' | 'bot';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  slot: number; // 0, 1, 2, 3
  hand: Domino[];
  isHost?: boolean;
  dominoStreak?: number; // Number of consecutive domino wins in a row
  isLastDominoWinner?: boolean; // True if this player played their last tile in the previous domino win
}

export type GameStatus = 'waiting' | 'selecting_starter' | 'playing' | 'round_ended' | 'game_over';

export interface Reaction {
  id: string;
  slot: number;
  emoji: string;
  timestamp: number;
}

export interface RoundHistoryEntry {
  round: number;
  scores: [number, number];
  winnerTeam?: number | null;
  pointsEarned?: number;
}

export interface GameRoom {
  roomCode: string;
  status: GameStatus;
  targetScore: number;
  turnTimer?: number; // Turn timer limit in seconds (30 - 120)
  turnStartedAt?: number; // Timestamp (ms) when current turn started
  isPublic?: boolean;
  hostName?: string;
  hostId?: string;
  scores: [number, number]; // [Team 0 (Slots 0 & 2), Team 1 (Slots 1 & 3)]
  scoreHistory?: RoundHistoryEntry[];
  players: (Player | null)[];
  board: Domino[]; // Chain of dominoes, oriented such that adjacent tiles match
  firstTileIndex: number; // Index in board[] of the first tile played in the round
  turn: number; // Current active player slot (0, 1, 2, 3)
  starterSlot: number; // Slot that went first in the current round
  startingTeam?: number; // The team (0 or 1) that has the right to start this round
  starterSelection?: {
    team0Tile: Domino | null;
    team1Tile: Domino | null;
    selectingTeam: number;
    chosenIndex: number | null;
    options: Domino[];
    revealed?: boolean;
  };
  roundWinnerSlot: number | null; // Player slot who won the round (-1 if blocked/trancado)
  roundBlocked: boolean;
  roundPointsEarned: number;
  scoreMultiplier?: number; // Multiplier for points (e.g. 2x after a tie in trancado)
  lastDominoWinnerSlot?: number | null; // Slot of player who dominoed last (null if trancado or reset)
  consecutivePasses?: number;
  logs: string[];
  reactions?: Reaction[];
  lastUpdateTime: number;
}

export interface RoomListItem {
  roomCode: string;
  hostName: string;
  playerCount: number;
  humanCount: number;
  status: GameStatus;
  targetScore: number;
  turnTimer?: number;
  isPublic: boolean;
  lastUpdateTime: number;
}
