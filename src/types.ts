export type Domino = [number, number];

export type PlayerType = 'human' | 'bot';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  slot: number; // 0, 1, 2, 3
  hand: Domino[];
}

export type GameStatus = 'waiting' | 'selecting_starter' | 'playing' | 'round_ended' | 'game_over';

export interface Reaction {
  id: string;
  slot: number;
  emoji: string;
  timestamp: number;
}

export interface GameRoom {
  roomCode: string;
  status: GameStatus;
  targetScore: number;
  isPublic?: boolean;
  hostName?: string;
  hostId?: string;
  scores: [number, number]; // [Team 0 (Slots 0 & 2), Team 1 (Slots 1 & 3)]
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
  };
  roundWinnerSlot: number | null; // Player slot who won the round (-1 if blocked/trancado)
  roundBlocked: boolean;
  roundPointsEarned: number;
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
  isPublic: boolean;
  lastUpdateTime: number;
}
