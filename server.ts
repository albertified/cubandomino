import express from 'express';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { GameRoom, Player, Domino, GameStatus, Reaction, RoomListItem } from './src/types';

const app = express();
const PORT = 3000;

// Enable trust proxy for reverse proxy environments (e.g. Cloud Run, Nginx)
app.set('trust proxy', 1);

app.use(express.json());

// Input Sanitization Helpers
function sanitizeString(input: unknown, maxLength = 30, defaultValue = ''): string {
  if (typeof input !== 'string') return defaultValue;
  let clean = input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip control chars
    .trim();

  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength).trim();
  }
  return clean || defaultValue;
}

function sanitizeRoomCode(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

function sanitizeId(input: unknown, defaultValue = ''): string {
  if (typeof input !== 'string') return defaultValue;
  return input.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 64) || defaultValue;
}

function sanitizeInt(input: unknown, min: number, max: number, defaultValue: number): number {
  if (input === undefined || input === null) return defaultValue;
  const num = parseInt(String(input), 10);
  if (isNaN(num)) return defaultValue;
  return Math.min(Math.max(num, min), max);
}

function sanitizeEmoji(input: unknown, defaultValue = '👍'): string {
  if (typeof input !== 'string') return defaultValue;
  const clean = input.replace(/<[^>]*>?/gm, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  return clean.slice(0, 10) || defaultValue;
}

// Global recursive sanitization helper for request payloads
function sanitizeRequestData(val: unknown): unknown {
  if (typeof val === 'string') {
    return val.replace(/<[^>]*>?/gm, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeRequestData);
  }
  if (val !== null && typeof val === 'object') {
    const cleanObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      cleanObj[k] = sanitizeRequestData(v);
    }
    return cleanObj;
  }
  return val;
}

// Global Sanitization Middleware to clean incoming body, params, and query
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeRequestData(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeRequestData(req.params) as typeof req.params;
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeRequestData(req.query) as typeof req.query;
  }
  next();
});

// Rate Limiters to protect server endpoints from abuse and DDoS
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  limit: 300, // 300 requests per minute per IP (accommodates 1.2s state polling)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
  message: { error: 'Too many requests from this IP, please try again in a minute.' },
});

const roomCreationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  limit: 30, // 30 room creations or joins per minute per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: false },
  message: { error: 'Too many room creation or join requests, please slow down.' },
});

// Protect all /api endpoints with the general rate limiter
app.use('/api', apiLimiter);

// Protect sensitive creation/join endpoints with stricter rate limiting
app.post('/api/rooms', roomCreationLimiter);
app.post('/api/rooms/:code/join', roomCreationLimiter);

// Cryptographically secure random helpers using Node.js crypto module
function cryptoRandomInt(max: number): number {
  return crypto.randomInt(0, max);
}

function cryptoRandomId(prefix: string = 'id'): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// In-memory database of game rooms
const rooms = new Map<string, GameRoom>();

// Generate a 4-character uppercase room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(cryptoRandomInt(chars.length));
  }
  return code;
}

// Generate domino double-nine deck (55 tiles)
function generateDoubleNineDeck(): Domino[] {
  const deck: Domino[] = [];
  for (let i = 0; i <= 9; i++) {
    for (let j = i; j <= 9; j++) {
      deck.push([i, j]);
    }
  }
  return deck;
}

// Shuffle deck using Fisher-Yates with crypto random
function shuffleDeck(deck: Domino[]): Domino[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1);
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Check if a single tile is playable on the current board ends
function canPlayTile(tile: Domino, leftVal: number, rightVal: number) {
  const [v1, v2] = tile;
  return {
    left: v1 === leftVal || v2 === leftVal,
    right: v1 === rightVal || v2 === rightVal
  };
}

// Check if a hand has any valid moves
function hasValidMoves(hand: Domino[], board: Domino[]): boolean {
  if (board.length === 0) return hand.length > 0;
  const leftVal = board[0][0];
  const rightVal = board[board.length - 1][1];
  return hand.some(([v1, v2]) => v1 === leftVal || v2 === leftVal || v1 === rightVal || v2 === rightVal);
}

// Select the best bot move based on difficulty (Novice, Intermediate, Pro)
type BotDifficulty = 'novice' | 'intermediate' | 'pro';

// Find the best double in a hand according to Cuban Doble Nueve opening strategy
function getBotOpeningDoubleMove(
  hand: Domino[],
  difficulty: BotDifficulty = 'intermediate',
  playerSlot?: number,
  room?: GameRoom
): { tileIndex: number; side: 'right'; isDouble: boolean } | null {
  if (hand.length === 0) return null;

  const doubleIndices: number[] = [];
  hand.forEach(([v1, v2], idx) => {
    if (v1 === v2) doubleIndices.push(idx);
  });

  // If bot holds one or more doubles, pick the best double!
  if (doubleIndices.length > 0) {
    if (difficulty === 'novice') {
      const chosenIdx = doubleIndices[cryptoRandomInt(doubleIndices.length)];
      return { tileIndex: chosenIdx, side: 'right', isDouble: true };
    }

    if (difficulty === 'intermediate') {
      // Pick highest value double (e.g. 9-9 > 8-8 > 7-7)
      let bestIdx = doubleIndices[0];
      let bestSum = -1;
      for (const idx of doubleIndices) {
        const sum = hand[idx][0] + hand[idx][1];
        if (sum > bestSum) {
          bestSum = sum;
          bestIdx = idx;
        }
      }
      return { tileIndex: bestIdx, side: 'right', isDouble: true };
    }

    // PRO: Cuban Master opening strategy for doubles
    // Count suit frequencies in hand (0..9)
    const suitCounts = new Array(10).fill(0);
    hand.forEach(([v1, v2]) => {
      suitCounts[v1]++;
      if (v1 !== v2) suitCounts[v2]++;
    });

    let bestIdx = doubleIndices[0];
    let bestScore = -1000;
    for (const idx of doubleIndices) {
      const v = hand[idx][0];
      // Total value points + heavy bonus for holding companion tiles of that suit (suit control / "suya")
      const score = (v * 2) * 5 + (suitCounts[v] * 35);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }
    return { tileIndex: bestIdx, side: 'right', isDouble: true };
  }

  // Fallback if bot has no doubles in hand: play strongest heavy tile
  const move = getBotMove(hand, [], difficulty, playerSlot, room);
  return move ? { tileIndex: move.tileIndex, side: 'right', isDouble: false } : null;
}

function getBotMove(
  hand: Domino[],
  board: Domino[],
  difficulty: BotDifficulty = 'intermediate',
  playerSlot?: number,
  room?: GameRoom
): { tileIndex: number; side: 'left' | 'right' } | null {
  if (hand.length === 0) return null;

  // 1. OPENING MOVE (Empty Board) - prioritize doubles
  if (board.length === 0) {
    const openingDoubleMove = getBotOpeningDoubleMove(hand, difficulty, playerSlot, room);
    if (openingDoubleMove) {
      return { tileIndex: openingDoubleMove.tileIndex, side: 'right' };
    }

    if (difficulty === 'novice') {
      const randomIdx = cryptoRandomInt(hand.length);
      return { tileIndex: randomIdx, side: 'right' };
    }

    if (difficulty === 'intermediate') {
      let bestIndex = 0;
      let bestScore = -1;
      for (let i = 0; i < hand.length; i++) {
        const [v1, v2] = hand[i];
        const isDouble = v1 === v2;
        const score = v1 + v2 + (isDouble ? 200 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      return { tileIndex: bestIndex, side: 'right' };
    }

    // PRO: Cuban Master Opening Strategy
    // Count suit frequencies in hand (0..9)
    const suitCounts = new Array(10).fill(0);
    hand.forEach(([v1, v2]) => {
      suitCounts[v1]++;
      if (v1 !== v2) suitCounts[v2]++;
    });

    let bestIndex = 0;
    let bestScore = -1000;

    for (let i = 0; i < hand.length; i++) {
      const [v1, v2] = hand[i];
      const isDouble = v1 === v2;
      const totalPoints = v1 + v2;

      let score = totalPoints + (isDouble ? 250 : 0);

      // Suit Control: holding 4+ of a suit gives massive advantage
      if (isDouble) {
        score += suitCounts[v1] * 35;
      } else {
        score += (suitCounts[v1] + suitCounts[v2]) * 12;
      }

      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return { tileIndex: bestIndex, side: 'right' };
  }

  // 2. MID-GAME / END-GAME MOVES (Board has tiles)
  const leftVal = board[0][0];
  const rightVal = board[board.length - 1][1];

  interface ValidMove {
    tileIndex: number;
    side: 'left' | 'right';
    tile: Domino;
    score: number;
  }

  const validMoves: ValidMove[] = [];

  for (let i = 0; i < hand.length; i++) {
    const tile = hand[i];
    const { left, right } = canPlayTile(tile, leftVal, rightVal);

    if (left) {
      validMoves.push({ tileIndex: i, side: 'left', tile, score: 0 });
    }
    if (right) {
      validMoves.push({ tileIndex: i, side: 'right', tile, score: 0 });
    }
  }

  if (validMoves.length === 0) return null;

  // --- NOVICE ALGORITHM ---
  if (difficulty === 'novice') {
    // 60% chance to pick completely at random, 40% chance to pick lowest value tile
    if (Math.random() < 0.6) {
      const randomChoice = validMoves[cryptoRandomInt(validMoves.length)];
      return { tileIndex: randomChoice.tileIndex, side: randomChoice.side };
    }
    validMoves.sort((a, b) => (a.tile[0] + a.tile[1]) - (b.tile[0] + b.tile[1]));
    return { tileIndex: validMoves[0].tileIndex, side: validMoves[0].side };
  }

  // --- INTERMEDIATE ALGORITHM ---
  if (difficulty === 'intermediate') {
    for (const move of validMoves) {
      const isDouble = move.tile[0] === move.tile[1];
      move.score = move.tile[0] + move.tile[1] + (isDouble ? 100 : 0);
    }
    validMoves.sort((a, b) => b.score - a.score);
    return { tileIndex: validMoves[0].tileIndex, side: validMoves[0].side };
  }

  // --- PRO MASTER ALGORITHM (Cuban Doble Nueve Advanced Strategy) ---
  const handSuitCounts = new Array(10).fill(0);
  hand.forEach(([v1, v2]) => {
    handSuitCounts[v1]++;
    if (v1 !== v2) handSuitCounts[v2]++;
  });

  const partnerSlot = playerSlot !== undefined ? (playerSlot + 2) % 4 : null;
  const oppSlot1 = playerSlot !== undefined ? (playerSlot + 1) % 4 : null;
  const oppSlot2 = playerSlot !== undefined ? (playerSlot + 3) % 4 : null;

  for (const move of validMoves) {
    const [v1, v2] = move.tile;
    const isDouble = v1 === v2;
    const totalValue = v1 + v2;

    let exposedVal: number;
    if (move.side === 'left') {
      exposedVal = (v1 === leftVal) ? v2 : v1;
    } else {
      exposedVal = (v1 === rightVal) ? v2 : v1;
    }

    let score = 0;

    // A. Heavy Double Dump: High doubles (9-9, 8-8, 7-7) get huge priority to prevent getting blocked
    if (isDouble) {
      score += 150 + (v1 * 15);
    } else {
      score += totalValue * 4;
    }

    // B. Suit Control (Suya Strategy): Holding extra tiles of the exposed suit
    const remainingInHand = handSuitCounts[exposedVal] - (v1 === exposedVal || v2 === exposedVal ? 1 : 0);
    score += remainingInHand * 35;

    // C. Tactical Pressuring
    if (room && room.logs) {
      const logsText = room.logs.slice(-15).join('\n');
      if (oppSlot1 !== null && room.players[oppSlot1]) {
        const opp1Name = room.players[oppSlot1]?.name;
        if (opp1Name && logsText.includes(`${opp1Name} has no valid moves`)) {
          score += 25;
        }
      }
      if (oppSlot2 !== null && room.players[oppSlot2]) {
        const opp2Name = room.players[oppSlot2]?.name;
        if (opp2Name && logsText.includes(`${opp2Name} has no valid moves`)) {
          score += 25;
        }
      }
    }

    // D. End of hand urgency
    if (hand.length <= 2) {
      score += 100;
    }

    move.score = score;
  }

  validMoves.sort((a, b) => b.score - a.score);
  return { tileIndex: validMoves[0].tileIndex, side: validMoves[0].side };
}

// Deal a new round
function dealRound(room: GameRoom) {
  const deck = shuffleDeck(generateDoubleNineDeck());
  room.board = [];
  room.firstTileIndex = 0;
  room.roundWinnerSlot = null;
  room.roundWinnerTeam = null;
  room.roundBlocked = false;
  room.roundPointsEarned = 0;
  room.consecutivePasses = 0;

  // Deal 10 tiles to each of the 4 slots
  for (let i = 0; i < 4; i++) {
    const player = room.players[i];
    if (player) {
      player.hand = deck.slice(i * 10, (i + 1) * 10);
    }
  }

  // If startingTeam is not set, default to a random team
  if (room.startingTeam === undefined) {
    room.startingTeam = cryptoRandomInt(2);
  }

  // Set initial turn to the lower slot on the starting team
  const initialStarter = room.startingTeam === 0 ? 0 : 1;
  room.starterSlot = initialStarter;
  room.turn = initialStarter;
  room.turnStartedAt = Date.now();

  room.logs.push(`--- A New Round Begins ---`);
  room.logs.push(`🔀 Shuffled deck. 10 dominoes dealt per player. 15 dominoes out of play.`);
  room.logs.push(`🎲 Team ${room.startingTeam === 0 ? 'A (Slots 1 & 3)' : 'B (Slots 2 & 4)'} has starting rights! Either teammate can make the first play.`);
  room.lastUpdateTime = Date.now();
}

// Handle what happens when a player has no tiles left
function handleRoundWin(room: GameRoom, winnerSlot: number) {
  const winner = room.players[winnerSlot];
  if (!winner) return;

  const winningTeam = winnerSlot % 2;
  const losingTeam = 1 - winningTeam;

  // Sum losing team's remaining tiles
  const m1 = losingTeam;
  const m2 = losingTeam + 2;

  let losingPoints = 0;
  const hand1 = room.players[m1]?.hand || [];
  const hand2 = room.players[m2]?.hand || [];

  for (const [v1, v2] of hand1) losingPoints += (v1 + v2);
  for (const [v1, v2] of hand2) losingPoints += (v1 + v2);

  const multiplier = room.scoreMultiplier || 1;
  const totalPoints = losingPoints * multiplier;

  room.scores[winningTeam] += totalPoints;
  room.roundWinnerSlot = winnerSlot;
  room.roundWinnerTeam = winningTeam;
  room.roundBlocked = false;
  room.roundPointsEarned = totalPoints;
  room.status = 'round_ended';
  room.startingTeam = winningTeam; // Winner team gets starting rights on subsequent round!
  room.scoreMultiplier = 1; // Reset multiplier after a win!

  // Record score history entry
  if (!room.scoreHistory) {
    room.scoreHistory = [{ round: 0, scores: [0, 0], winnerTeam: null, pointsEarned: 0 }];
  }
  const roundNumWin = room.scoreHistory.length;
  room.scoreHistory.push({
    round: roundNumWin,
    scores: [room.scores[0], room.scores[1]],
    winnerTeam: winningTeam,
    pointsEarned: totalPoints
  });

  // Crown & Domino Streak logic
  room.lastDominoWinnerSlot = winnerSlot;
  for (let i = 0; i < 4; i++) {
    const p = room.players[i];
    if (p) {
      if (i === winnerSlot) {
        p.isLastDominoWinner = true;
        p.dominoStreak = (p.dominoStreak || 0) + 1;
      } else {
        p.isLastDominoWinner = false;
        p.dominoStreak = 0; // Streak removed if they didn't domino!
      }
    }
  }

  const winnerStreak = winner.dominoStreak || 1;
  room.logs.push(`🎉 DOMINO! ${winner.name} played their last tile! 👑${winnerStreak > 1 ? ` (🔥 ${winnerStreak}x DOMINO STREAK!)` : ''}`);
  if (multiplier > 1) {
    room.logs.push(`🏆 Team ${winningTeam === 0 ? 'A (Slots 1 & 3)' : 'B (Slots 2 & 4)'} wins the round and earns ${totalPoints} points (${losingPoints} pts × ${multiplier}x DOUBLE bonus from previous tie)!`);
  } else {
    room.logs.push(`🏆 Team ${winningTeam === 0 ? 'A (Slots 1 & 3)' : 'B (Slots 2 & 4)'} wins the round and earns ${totalPoints} points!`);
  }

  // Check game win
  if (room.scores[winningTeam] >= room.targetScore) {
    room.status = 'game_over';
    room.logs.push(`🏆 GAME OVER! Team ${winningTeam === 0 ? 'A' : 'B'} reached ${room.scores[winningTeam]} points (Target: ${room.targetScore}) and won the match! 🏆`);
  }
}

// Handle blocked game
function handleTrancado(room: GameRoom) {
  // Blocked! Nobody can make a valid move.
  // Crown & Domino Streak logic for blocked game:
  // "Dont add a crown to anyone if it the game got blocked... Remove this streak if they don't dominoe, lose the round, or block the game"
  room.lastDominoWinnerSlot = null;
  for (let i = 0; i < 4; i++) {
    const p = room.players[i];
    if (p) {
      p.isLastDominoWinner = false;
      p.dominoStreak = 0;
    }
  }

  // Evaluate individual hands to see who wins.
  const sums = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const hand = room.players[i]?.hand || [];
    let sum = 0;
    for (const [v1, v2] of hand) sum += (v1 + v2);
    sums[i] = sum;
  }

  const team0Sum = sums[0] + sums[2];
  const team1Sum = sums[1] + sums[3];

  // Find minimum individual hand value
  const minIndividualSum = Math.min(...sums);
  const minSlots = [0, 1, 2, 3].filter(i => sums[i] === minIndividualSum);

  const team0HasMin = minSlots.some(s => s % 2 === 0);
  const team1HasMin = minSlots.some(s => s % 2 === 1);

  room.logs.push(`⚠️ TRANCADO! The game is blocked. No player has a valid move.`);
  room.logs.push(`📊 Individual hands: ${room.players[0]?.name || 'P1'}: ${sums[0]}pts | ${room.players[1]?.name || 'P2'}: ${sums[1]}pts | ${room.players[2]?.name || 'P3'}: ${sums[2]}pts | ${room.players[3]?.name || 'P4'}: ${sums[3]}pts.`);

  // If players from BOTH opposing teams tie for the lowest individual hand value
  if (team0HasMin && team1HasMin) {
    const currentMultiplier = room.scoreMultiplier || 1;
    const nextMultiplier = currentMultiplier * 2;
    room.scoreMultiplier = nextMultiplier;

    room.roundWinnerSlot = -1;
    room.roundWinnerTeam = null;
    room.roundBlocked = true;
    room.roundPointsEarned = 0;
    room.status = 'round_ended';

    const pA = room.players[minSlots.find(s => s % 2 === 0)!]?.name || 'Team A Player';
    const pB = room.players[minSlots.find(s => s % 2 === 1)!]?.name || 'Team B Player';

    room.logs.push(`🤝 TIE IN TRANCADO! Both ${pA} (Team A) and ${pB} (Team B) share the lowest hand value of ${minIndividualSum}pts.`);
    room.logs.push(`⚖️ Zero points awarded this round. Next round points will be DOUBLED (${nextMultiplier}x)!`);

    if (!room.scoreHistory) {
      room.scoreHistory = [{ round: 0, scores: [0, 0], winnerTeam: null, pointsEarned: 0 }];
    }
    const roundNumTie = room.scoreHistory.length;
    room.scoreHistory.push({
      round: roundNumTie,
      scores: [room.scores[0], room.scores[1]],
      winnerTeam: null,
      pointsEarned: 0
    });
    return;
  }

  // Not a tie: one team clearly holds the lowest individual hand!
  const winningTeam = team0HasMin ? 0 : 1;
  const losingPoints = winningTeam === 0 ? team1Sum : team0Sum;
  const multiplier = room.scoreMultiplier || 1;
  const totalPoints = losingPoints * multiplier;

  const winningPlayersList = minSlots
    .filter(s => s % 2 === winningTeam)
    .map(s => room.players[s]?.name || `Slot ${s + 1}`)
    .join(', ');

  room.scores[winningTeam] += totalPoints;
  room.roundWinnerSlot = -1; // -1 represents block/trancado
  room.roundWinnerTeam = winningTeam;
  room.roundBlocked = true;
  room.roundPointsEarned = totalPoints;
  room.status = 'round_ended';
  room.startingTeam = winningTeam; // Winner team gets starting rights on subsequent round!
  room.scoreMultiplier = 1; // Reset multiplier after a win!

  if (!room.scoreHistory) {
    room.scoreHistory = [{ round: 0, scores: [0, 0], winnerTeam: null, pointsEarned: 0 }];
  }
  const roundNumTrancadoWin = room.scoreHistory.length;
  room.scoreHistory.push({
    round: roundNumTrancadoWin,
    scores: [room.scores[0], room.scores[1]],
    winnerTeam: winningTeam,
    pointsEarned: totalPoints
  });

  room.logs.push(`🏆 Lowest individual hand: ${winningPlayersList} (${minIndividualSum}pts). Team ${winningTeam === 0 ? 'A' : 'B'} wins the block!`);
  if (multiplier > 1) {
    room.logs.push(`🎉 Team ${winningTeam === 0 ? 'A' : 'B'} earns ${totalPoints} points (${losingPoints} pts × ${multiplier}x DOUBLE bonus from previous tie)!`);
  } else {
    room.logs.push(`🎉 Team ${winningTeam === 0 ? 'A' : 'B'} earns ${totalPoints} points (sum of losing team's remaining tiles)!`);
  }

  if (room.scores[winningTeam] >= room.targetScore) {
    room.status = 'game_over';
    room.logs.push(`🏆 GAME OVER! Team ${winningTeam === 0 ? 'A' : 'B'} reached ${room.scores[winningTeam]} points and won the match! 🏆`);
  }
}

// Advance turn counter-clockwise (0 -> 3 -> 2 -> 1 -> 0)
function advanceTurn(room: GameRoom) {
  room.turn = (room.turn + 3) % 4;
  room.turnStartedAt = Date.now();

  // Handle empty player slots if any (auto-pass for empty slots)
  let emptySkips = 0;
  while (!room.players[room.turn] && emptySkips < 4) {
    emptySkips++;
    room.consecutivePasses = (room.consecutivePasses || 0) + 1;
    room.logs.push(`⚠️ Slot ${room.turn + 1} is empty and passes.`);
    if (room.consecutivePasses >= 4) {
      handleTrancado(room);
      return;
    }
    room.turn = (room.turn + 3) % 4;
  }

  room.lastUpdateTime = Date.now();
}

// Execute player tile placement
function executePlayTile(room: GameRoom, slot: number, tileIndex: number, side: 'left' | 'right') {
  const player = room.players[slot];
  if (!player) return;

  const tile = player.hand[tileIndex];
  
  // Remove tile from player hand
  player.hand.splice(tileIndex, 1);

  if (room.board.length === 0) {
    room.board = [tile];
    room.firstTileIndex = 0;
    room.starterSlot = slot;
    room.turn = slot;
    room.logs.push(`🟢 ${player.name} plays starting tile [${tile[0]}|${tile[1]}].`);
  } else if (side === 'left') {
    const leftVal = room.board[0][0];
    if (tile[1] === leftVal) {
      room.board.unshift(tile);
    } else {
      room.board.unshift([tile[1], tile[0]]);
    }
    room.firstTileIndex++;
    room.logs.push(`🔹 ${player.name} plays [${tile[0]}|${tile[1]}] on Left.`);
  } else {
    const rightVal = room.board[room.board.length - 1][1];
    if (tile[0] === rightVal) {
      room.board.push(tile);
    } else {
      room.board.push([tile[1], tile[0]]);
    }
    room.logs.push(`🔹 ${player.name} plays [${tile[0]}|${tile[1]}] on Right.`);
  }

  // Any successful play resets consecutive passes to 0
  room.consecutivePasses = 0;

  room.lastUpdateTime = Date.now();

  // Check round win
  if (player.hand.length === 0) {
    handleRoundWin(room, slot);
  } else {
    advanceTurn(room);
  }
}

// Store active bot timers per room code to prevent duplicate timers
const botTimers = new Map<string, NodeJS.Timeout>();

function clearBotTimer(code: string) {
  const normalizedCode = code.toUpperCase();
  const timer = botTimers.get(normalizedCode);
  if (timer) {
    clearTimeout(timer);
    botTimers.delete(normalizedCode);
  }
}

// Schedule bot turn asynchronously with a realistic 2-5 second random delay
function scheduleBotTurnIfNeeded(room: GameRoom) {
  clearBotTimer(room.roomCode);

  if (room.status !== 'playing') {
    return;
  }

  // If starting a new round, check if there are human players on the starting team.
  // If so, do not auto-play bots. Let the human team decide who starts.
  if (room.board.length === 0 && room.startingTeam !== undefined) {
    const hasHumanOnStartingTeam = room.players.some((p, sIdx) => 
      p && p.type === 'human' && (sIdx % 2 === room.startingTeam)
    );
    if (hasHumanOnStartingTeam) {
      const activePlayer = room.players[room.turn];
      if (activePlayer && activePlayer.type === 'bot') {
        return; // Wait for the human on the starting team to make the first move
      }
    }
  }

  const activePlayer = room.players[room.turn];
  if (!activePlayer) {
    // Empty slot, advance turn automatically
    advanceTurn(room);
    scheduleBotTurnIfNeeded(room);
    return;
  }

  if (activePlayer.type === 'bot') {
    // Random delay between 2000ms and 5000ms (2 to 5 seconds)
    const delay = cryptoRandomInt(3000) + 2000;

    const timer = setTimeout(() => {
      botTimers.delete(room.roomCode.toUpperCase());

      const currentRoom = rooms.get(room.roomCode.toUpperCase());
      if (!currentRoom || currentRoom.status !== 'playing') {
        return;
      }

      const botPlayer = currentRoom.players[currentRoom.turn];
      if (!botPlayer || botPlayer.type !== 'bot') {
        return;
      }

      const botDiff = botPlayer.botDifficulty || currentRoom.defaultBotDifficulty || 'intermediate';
      const botMove = getBotMove(botPlayer.hand, currentRoom.board, botDiff, currentRoom.turn, currentRoom);
      if (botMove) {
        executePlayTile(currentRoom, currentRoom.turn, botMove.tileIndex, botMove.side);
      } else {
        currentRoom.consecutivePasses = (currentRoom.consecutivePasses || 0) + 1;
        currentRoom.logs.push(`⚠️ ${botPlayer.name} has no valid moves and passes.`);
        
        if (currentRoom.consecutivePasses >= 4) {
          handleTrancado(currentRoom);
        } else {
          advanceTurn(currentRoom);
          scheduleBotTurnIfNeeded(currentRoom);
        }
      }

      currentRoom.lastUpdateTime = Date.now();

      // Schedule next turn if the subsequent player is also a bot
      if (currentRoom.status === 'playing') {
        scheduleBotTurnIfNeeded(currentRoom);
      }
    }, delay);

    botTimers.set(room.roomCode.toUpperCase(), timer);
  }
}

// Extract requesting player ID from query string or body safely
function getRequesterPlayerId(req: express.Request): string | undefined {
  const fromQuery = typeof req.query.playerId === 'string' ? req.query.playerId : undefined;
  const fromHeader = typeof req.headers['x-player-id'] === 'string' ? req.headers['x-player-id'] : undefined;
  const fromBody = req.body?.playerId || req.body?.requesterId;
  const rawId = fromQuery || fromHeader || fromBody;
  return rawId ? sanitizeId(rawId) : undefined;
}

// Update player heartbeat and connection state
function updatePlayerPresence(room: GameRoom, playerId?: string) {
  if (!playerId || playerId === 'hidden') return;
  const player = room.players.find(p => p && p.id === playerId);
  if (player && player.type === 'human') {
    const wasDisconnected = player.isDisconnected;
    player.lastSeen = Date.now();
    player.isDisconnected = false;
    if (wasDisconnected) {
      room.logs.push(`⚡ ${player.name} reconnected to Seat ${player.slot + 1}!`);
      room.lastUpdateTime = Date.now();
    }
  }
}

// Sanitize room data for client responses to prevent hand-peeking / network inspection cheats
function sanitizeRoomForPlayer(room: GameRoom, requesterPlayerId?: string): GameRoom {
  const isEndState = room.status === 'round_ended' || room.status === 'game_over';

  const sanitizedPlayers = room.players.map((player) => {
    if (!player) return null;

    const isSelf = Boolean(requesterPlayerId && player.id === requesterPlayerId);
    const isPlayerHost = room.hostId ? player.id === room.hostId : player.slot === 0;

    let hand = player.hand;
    if (!isEndState && !isSelf) {
      // Mask hands for other players/bots as dummy tiles [-1, -1] while keeping array length intact
      hand = player.hand.map(() => [-1, -1] as Domino);
    }

    let id = player.id;
    if (!isSelf) {
      // Hide other players' secret IDs so nobody can spoof another player's ID
      id = 'hidden';
    }

    return {
      ...player,
      id,
      isHost: isPlayerHost,
      hand,
      lastSeen: player.lastSeen,
      isDisconnected: Boolean(player.isDisconnected)
    };
  });

  const requestingPlayerIsHost = Boolean(requesterPlayerId && room.hostId && requesterPlayerId === room.hostId);
  const sanitizedHostId = requestingPlayerIsHost ? room.hostId : 'hidden';

  let starterSelection = room.starterSelection;
  if (starterSelection && starterSelection.chosenIndex === null) {
    // Hide facedown starter tiles during selection phase until flipped
    starterSelection = {
      ...starterSelection,
      options: [[-1, -1], [-1, -1]],
      team0Tile: null,
      team1Tile: null
    };
  }

  const sanitizedSpectators = (room.spectators || []).map((spec) => {
    const isSelf = Boolean(requesterPlayerId && spec.id === requesterPlayerId);
    return {
      ...spec,
      id: isSelf ? spec.id : 'hidden'
    };
  });

  return {
    ...room,
    hostId: sanitizedHostId,
    players: sanitizedPlayers,
    spectators: sanitizedSpectators,
    starterSelection
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get Public Lobbies List (supports both /api/public-rooms and /api/rooms/public)
app.get(['/api/public-rooms', '/api/rooms/public'], (req, res) => {
  const publicRooms: RoomListItem[] = [];
  const now = Date.now();

  // Cleanup stale rooms or rooms with zero human players and zero spectators
  for (const [code, room] of rooms.entries()) {
    const activePlayers = room.players.filter(p => p !== null);
    const humanPlayerCount = activePlayers.filter(p => p?.type === 'human').length;
    const spectatorCount = (room.spectators || []).length;
    const totalHumanPresence = humanPlayerCount + spectatorCount;

    // Automatically close lobbies with 0 human presence or stale rooms (>3h)
    if (totalHumanPresence === 0 || now - room.lastUpdateTime > 3 * 60 * 60 * 1000) {
      rooms.delete(code);
      continue;
    }

    const isPublicRoom = room.isPublic ?? true;
    if (isPublicRoom && (room.status === 'waiting' || room.status === 'selecting_starter' || room.status === 'playing')) {
      const host = room.players[0]?.name || room.hostName || 'Host';

      publicRooms.push({
        roomCode: room.roomCode,
        hostName: host,
        playerCount: activePlayers.length,
        humanCount: humanPlayerCount,
        spectatorCount,
        status: room.status,
        targetScore: room.targetScore,
        turnTimer: room.turnTimer !== undefined ? room.turnTimer : 60,
        isPublic: true,
        lastUpdateTime: room.lastUpdateTime,
      });
    }
  }

  // Sort: 'waiting' rooms first, then by latest updated
  publicRooms.sort((a, b) => {
    if (a.status === 'waiting' && b.status !== 'waiting') return -1;
    if (a.status !== 'waiting' && b.status === 'waiting') return 1;
    return b.lastUpdateTime - a.lastUpdateTime;
  });

  res.json({ rooms: publicRooms });
});

// Create Room
app.post('/api/rooms', (req, res) => {
  const { targetScore, turnTimer, playerName, playerId, isPublic } = req.body || {};
  
  let code = generateRoomCode();
  // Ensure unique code
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const limitScore = sanitizeInt(targetScore, 50, 500, 150);
  const limitTurnTimer = (turnTimer === 0 || turnTimer === '0') ? 0 : sanitizeInt(turnTimer, 30, 120, 60);
  const roomIsPublic = isPublic !== undefined ? Boolean(isPublic) : true;
  const defaultBotDiff: BotDifficulty = req.body?.defaultBotDifficulty && ['novice', 'intermediate', 'pro'].includes(req.body.defaultBotDifficulty)
    ? req.body.defaultBotDifficulty
    : 'intermediate';
  const cleanName = sanitizeString(playerName, 24, 'Player 1');
  const cleanId = sanitizeId(playerId, cryptoRandomId('host'));

  const firstPlayer: Player = {
    id: cleanId,
    name: cleanName,
    type: 'human',
    slot: 0,
    hand: []
  };

  const newRoom: GameRoom = {
    roomCode: code,
    status: 'waiting',
    targetScore: limitScore,
    turnTimer: limitTurnTimer,
    isPublic: roomIsPublic,
    defaultBotDifficulty: defaultBotDiff,
    hostName: firstPlayer.name,
    hostId: firstPlayer.id,
    scores: [0, 0],
    scoreHistory: [{ round: 0, scores: [0, 0], winnerTeam: null, pointsEarned: 0 }],
    players: [firstPlayer, null, null, null],
    board: [],
    firstTileIndex: 0,
    turn: 0,
    starterSlot: 0,
    roundWinnerSlot: null,
    roundWinnerTeam: null,
    roundBlocked: false,
    roundPointsEarned: 0,
    logs: [`Room ${code} created. Target: ${limitScore} PTS | Turn Timer: ${limitTurnTimer > 0 ? `${limitTurnTimer}s` : 'OFF'}. Waiting for players to join.`],
    reactions: [],
    spectators: [],
    lastUpdateTime: Date.now()
  };

  rooms.set(code, newRoom);
  res.json({ room: sanitizeRoomForPlayer(newRoom, firstPlayer.id), playerSlot: 0 });
});

// Join Room (Supports direct join and seamless match reconnect)
app.post('/api/rooms/:code/join', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { playerName, playerId, slot, preferredTeam, claimSlot } = req.body || {};
  const cleanName = sanitizeString(playerName, 24, 'Player');
  const cleanId = sanitizeId(playerId, cryptoRandomId('p'));

  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // 1. Check if player with this exact ID is already sitting in the room (seamless instant rejoin)
  const existingPlayerIndex = room.players.findIndex(p => p && p.id === cleanId);
  if (existingPlayerIndex !== -1) {
    const p = room.players[existingPlayerIndex]!;
    const wasDisconnected = p.isDisconnected;
    p.lastSeen = Date.now();
    p.isDisconnected = false;
    if (cleanName && cleanName.length > 0 && p.name !== cleanName) {
      p.name = cleanName;
    }
    if (wasDisconnected) {
      room.logs.push(`⚡ ${p.name} reconnected to Seat ${existingPlayerIndex + 1}!`);
      room.lastUpdateTime = Date.now();
    }
    return res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: existingPlayerIndex, reconnected: true });
  }

  // 2. Check if player is an active spectator
  const existingSpectatorIndex = (room.spectators || []).findIndex(s => s.id === cleanId);
  if (existingSpectatorIndex !== -1) {
    return res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: null, role: 'spectator' });
  }

  // 3. Check if player explicitly requested to claim a disconnected seat in an ongoing match
  if (claimSlot !== undefined && typeof claimSlot === 'number' && claimSlot >= 0 && claimSlot < 4) {
    const targetPlayer = room.players[claimSlot];
    if (targetPlayer) {
      targetPlayer.id = cleanId;
      if (cleanName) targetPlayer.name = cleanName;
      targetPlayer.lastSeen = Date.now();
      targetPlayer.isDisconnected = false;
      targetPlayer.type = 'human';
      room.logs.push(`⚡ ${targetPlayer.name} reconnected and reclaimed Seat ${claimSlot + 1}.`);
      room.lastUpdateTime = Date.now();
      return res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: claimSlot, reconnected: true });
    }
  }

  // 4. If game is already active (playing / round ended / selecting starter)
  if (room.status !== 'waiting') {
    // Check if a human with matching name is disconnected
    const matchIdx = room.players.findIndex(p => p && p.type === 'human' && (p.isDisconnected || p.name.toLowerCase() === cleanName.toLowerCase()));
    if (matchIdx !== -1) {
      const targetPlayer = room.players[matchIdx]!;
      targetPlayer.id = cleanId;
      targetPlayer.lastSeen = Date.now();
      targetPlayer.isDisconnected = false;
      targetPlayer.type = 'human';
      room.logs.push(`⚡ ${targetPlayer.name} reconnected to the match at Seat ${matchIdx + 1}!`);
      room.lastUpdateTime = Date.now();
      return res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: matchIdx, reconnected: true });
    }

    // Otherwise offer to spectate or reclaim seat
    const disconnectedSlots = room.players
      .map((p, idx) => p ? { slot: idx, name: p.name, isDisconnected: Boolean(p.isDisconnected), type: p.type } : null)
      .filter(p => p !== null && (p.isDisconnected || p.type === 'human'));

    return res.status(400).json({ 
      error: 'Game has already started in this room', 
      canSpectate: true,
      canReclaimSeats: disconnectedSlots 
    });
  }

  // 5. Waiting Lobby: Find slot based on explicit slot, preferred team, or first vacant slot
  let targetSlot = -1;
  if (slot !== undefined) {
    const parsedSlot = sanitizeInt(slot, 0, 3, -1);
    if (parsedSlot >= 0 && parsedSlot < 4 && !room.players[parsedSlot]) {
      targetSlot = parsedSlot;
    }
  }

  // If preferredTeam (0 for Team A, 1 for Team B) is passed and targetSlot hasn't been set
  if (targetSlot === -1 && preferredTeam !== undefined) {
    const team = sanitizeInt(preferredTeam, 0, 1, -1);
    if (team === 0) {
      // Team A slots: 0, 2
      if (!room.players[0]) targetSlot = 0;
      else if (!room.players[2]) targetSlot = 2;
    } else if (team === 1) {
      // Team B slots: 1, 3
      if (!room.players[1]) targetSlot = 1;
      else if (!room.players[3]) targetSlot = 3;
    }
  }

  if (targetSlot === -1) {
    // Find first empty slot
    targetSlot = room.players.findIndex(p => p === null);
  }

  if (targetSlot === -1) {
    return res.status(400).json({ error: 'Room is full', canSpectate: true });
  }

  // If user was previously in spectators list, remove them
  if (room.spectators) {
    const specIdx = room.spectators.findIndex(s => s.id === cleanId);
    if (specIdx !== -1) {
      room.spectators.splice(specIdx, 1);
    }
  }

  const teamLabel = targetSlot % 2 === 0 ? 'Team A' : 'Team B';
  const newPlayer: Player = {
    id: cleanId,
    name: cleanName || `Player ${targetSlot + 1}`,
    type: 'human',
    slot: targetSlot,
    hand: [],
    lastSeen: Date.now(),
    isDisconnected: false
  };

  room.players[targetSlot] = newPlayer;
  room.logs.push(`👥 ${newPlayer.name} joined the table on ${teamLabel} (Slot ${targetSlot + 1}).`);
  room.lastUpdateTime = Date.now();

  res.json({ room: sanitizeRoomForPlayer(room, newPlayer.id), playerSlot: targetSlot });
});

// Reconnect to active room explicitly
app.post('/api/rooms/:code/reconnect', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { playerName, playerId, slot } = req.body || {};
  const cleanName = sanitizeString(playerName, 24, 'Player');
  const cleanId = sanitizeId(playerId);

  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found or game has concluded.' });
  }

  // 1. By exact ID match
  if (cleanId) {
    const existingIndex = room.players.findIndex(p => p && p.id === cleanId);
    if (existingIndex !== -1) {
      const p = room.players[existingIndex]!;
      p.lastSeen = Date.now();
      p.isDisconnected = false;
      if (cleanName && cleanName.length > 0) p.name = cleanName;
      room.logs.push(`⚡ ${p.name} reconnected to Seat ${existingIndex + 1}!`);
      room.lastUpdateTime = Date.now();
      return res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: existingIndex, reconnected: true });
    }
  }

  // 2. By slot match (if reclaiming a disconnected seat)
  const parsedSlot = typeof slot === 'number' ? slot : parseInt(slot, 10);
  if (!isNaN(parsedSlot) && parsedSlot >= 0 && parsedSlot < 4) {
    const targetPlayer = room.players[parsedSlot];
    if (targetPlayer) {
      targetPlayer.id = cleanId || cryptoRandomId('p');
      if (cleanName) targetPlayer.name = cleanName;
      targetPlayer.lastSeen = Date.now();
      targetPlayer.isDisconnected = false;
      targetPlayer.type = 'human';
      room.logs.push(`⚡ ${targetPlayer.name} reconnected and reclaimed Seat ${parsedSlot + 1}.`);
      room.lastUpdateTime = Date.now();
      return res.json({ room: sanitizeRoomForPlayer(room, targetPlayer.id), playerSlot: parsedSlot, reconnected: true });
    }
  }

  // 3. By Name match
  if (cleanName) {
    const matchIdx = room.players.findIndex(p => p && p.name.toLowerCase() === cleanName.toLowerCase());
    if (matchIdx !== -1) {
      const p = room.players[matchIdx]!;
      p.id = cleanId || cryptoRandomId('p');
      p.lastSeen = Date.now();
      p.isDisconnected = false;
      p.type = 'human';
      room.logs.push(`⚡ ${p.name} reconnected to Seat ${matchIdx + 1}!`);
      room.lastUpdateTime = Date.now();
      return res.json({ room: sanitizeRoomForPlayer(room, p.id), playerSlot: matchIdx, reconnected: true });
    }
  }

  return res.status(400).json({ error: 'Could not find matching seat to reclaim.' });
});

// Explicit Heartbeat Endpoint
app.post('/api/rooms/:code/heartbeat', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const playerId = getRequesterPlayerId(req);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (playerId) {
    updatePlayerPresence(room, playerId);
  }

  res.json({ ok: true, status: room.status, lastUpdateTime: room.lastUpdateTime });
});

// Join Room as Spectator
app.post('/api/rooms/:code/spectate', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { playerName, playerId } = req.body || {};
  const cleanName = sanitizeString(playerName, 24, 'Spectator');
  const cleanId = sanitizeId(playerId, cryptoRandomId('spec'));

  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (!room.spectators) {
    room.spectators = [];
  }

  // If player was sitting at a player slot in waiting mode, remove them from player slot
  const activePlayerIdx = room.players.findIndex(p => p && p.id === cleanId);
  if (activePlayerIdx !== -1 && room.status === 'waiting') {
    const removed = room.players[activePlayerIdx];
    room.players[activePlayerIdx] = null;
    if (removed) {
      room.logs.push(`🪑 ${removed.name} left Slot ${activePlayerIdx + 1} and moved to Spectators.`);
    }
  }

  // Add or update spectator entry
  const specIndex = room.spectators.findIndex(s => s.id === cleanId);
  if (specIndex === -1) {
    room.spectators.push({
      id: cleanId,
      name: cleanName,
      joinedAt: Date.now()
    });
    room.logs.push(`👁️ ${cleanName} is now spectating the match.`);
  } else {
    room.spectators[specIndex].name = cleanName;
  }

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, cleanId), role: 'spectator' });
});

// Leave Spectator Seat
app.post('/api/rooms/:code/leave-spectator', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { playerId } = req.body || {};
  const cleanId = sanitizeId(playerId);

  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.spectators) {
    const specIndex = room.spectators.findIndex(s => s.id === cleanId);
    if (specIndex !== -1) {
      const specName = room.spectators[specIndex].name;
      room.spectators.splice(specIndex, 1);
      room.logs.push(`👋 ${specName} stopped spectating.`);
      room.lastUpdateTime = Date.now();
    }
  }

  res.json({ room: sanitizeRoomForPlayer(room, cleanId) });
});

// Update Player Name
app.post('/api/rooms/:code/update-player', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { playerId, newName } = req.body || {};
  const cleanId = sanitizeId(playerId);
  const cleanName = sanitizeString(newName, 24, '');

  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const player = room.players.find(p => p && p.id === cleanId);
  if (player && cleanName.length > 0) {
    const oldName = player.name;
    player.name = cleanName;
    if (oldName !== player.name) {
      room.logs.push(`✏️ ${oldName} changed profile name to ${player.name}.`);
      room.lastUpdateTime = Date.now();
    }
  }

  res.json({ room: sanitizeRoomForPlayer(room, cleanId) });
});

// Get Room State
app.get('/api/rooms/:code', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const requesterId = getRequesterPlayerId(req);
  if (requesterId) {
    updatePlayerPresence(room, requesterId);
  }

  // Prune reactions older than 8 seconds
  if (room.reactions) {
    const cutoff = Date.now() - 8000;
    room.reactions = room.reactions.filter(r => r.timestamp > cutoff);
  }

  res.json({ room: sanitizeRoomForPlayer(room, requesterId) });
});

// Add Bot (places in specified slot or automatically in first vacant space)
app.post('/api/rooms/:code/bot', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const requesterId = sanitizeId(req.body?.requesterId);
  const requestedDiff = req.body?.difficulty;
  const requestedSlot = req.body?.slot !== undefined ? sanitizeInt(req.body.slot, 0, 3, -1) : -1;
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Permission check: only host can add bots
  const isHost = room.hostId ? room.hostId === requesterId : requesterId === room.players[0]?.id;
  if (!isHost) {
    return res.status(403).json({ error: 'Only the room creator can add bots.' });
  }

  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Cannot add bots to an active game' });
  }

  let targetSlot = -1;
  if (requestedSlot >= 0 && requestedSlot < 4 && !room.players[requestedSlot]) {
    targetSlot = requestedSlot;
  } else {
    // Automatically find the first vacant space
    targetSlot = room.players.findIndex(p => p === null);
  }

  if (targetSlot === -1) {
    return res.status(400).json({ error: 'All table seats are currently occupied' });
  }

  const difficulty: BotDifficulty = requestedDiff && ['novice', 'intermediate', 'pro'].includes(requestedDiff)
    ? requestedDiff
    : (room.defaultBotDifficulty || 'intermediate');

  const botNames = ['Bot Pepe', 'Bot Maria', 'Bot Jose', 'Bot Caridad'];
  const botName = botNames[targetSlot] || `Bot ${targetSlot + 1}`;
  const teamLabel = targetSlot % 2 === 0 ? 'Team A' : 'Team B';

  const botPlayer: Player = {
    id: `bot_${targetSlot}`,
    name: botName,
    type: 'bot',
    slot: targetSlot,
    hand: [],
    botDifficulty: difficulty,
  };

  const diffLabel = difficulty === 'pro' ? 'Pro Master 🧠' : difficulty === 'novice' ? 'Novice 🎲' : 'Intermediate ⚡';

  room.players[targetSlot] = botPlayer;
  room.logs.push(`🤖 ${botName} (${diffLabel}) was added to ${teamLabel} (Slot ${targetSlot + 1}).`);
  room.lastUpdateTime = Date.now();

  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)), addedSlot: targetSlot });
});

// Shift Seat Left or Right (intuitive arrow system with jump over occupied seats)
app.post('/api/rooms/:code/shift-seat', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { playerId, direction } = req.body || {};
  const cleanId = sanitizeId(playerId);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Cannot change seats once the match has started' });
  }

  const currentSlot = room.players.findIndex(p => p && p.id === cleanId);
  if (currentSlot === -1) {
    return res.status(400).json({ error: 'Player is not currently seated at the table' });
  }

  const step = direction === 'left' ? -1 : 1;
  let targetSlot = -1;

  // Search in the specified direction for the closest slot that is completely vacant (jumping over any occupied seat)
  for (let i = 1; i <= 3; i++) {
    const candidate = (currentSlot + step * i + 8) % 4;
    const occupant = room.players[candidate];
    if (!occupant) {
      targetSlot = candidate;
      break;
    }
  }

  if (targetSlot === -1) {
    return res.status(400).json({ error: 'All other seats are currently occupied. Cannot jump.' });
  }

  const movingPlayer = room.players[currentSlot]!;
  const destTeam = targetSlot % 2 === 0 ? 'Team A' : 'Team B';

  movingPlayer.slot = targetSlot;
  room.players[targetSlot] = movingPlayer;
  room.players[currentSlot] = null;

  const stepsTaken = ((targetSlot - currentSlot) * step + 8) % 4 || 4;
  if (stepsTaken > 1) {
    room.logs.push(`🪑 ${movingPlayer.name} jumped ${direction === 'left' ? 'left' : 'right'} past occupied seats into ${destTeam} (Seat ${targetSlot + 1}).`);
  } else {
    room.logs.push(`🪑 ${movingPlayer.name} moved ${direction === 'left' ? 'left' : 'right'} to ${destTeam} (Seat ${targetSlot + 1}).`);
  }

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: targetSlot });
});

// Switch Seat / Move to a Specific Slot in Lobby
app.post('/api/rooms/:code/switch-slot', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { playerId, targetSlot } = req.body || {};
  const cleanId = sanitizeId(playerId);
  const destSlot = sanitizeInt(targetSlot, 0, 3, -1);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Cannot change seats once the match has started' });
  }

  if (destSlot < 0 || destSlot > 3) {
    return res.status(400).json({ error: 'Invalid destination slot' });
  }

  const currentSlot = room.players.findIndex(p => p && p.id === cleanId);
  if (currentSlot === -1) {
    return res.status(400).json({ error: 'Player is not currently seated at the table' });
  }

  if (currentSlot === destSlot) {
    return res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: currentSlot });
  }

  const movingPlayer = room.players[currentSlot]!;
  const occupant = room.players[destSlot];

  if (occupant) {
    return res.status(400).json({ error: `Seat ${destSlot + 1} is already occupied by ${occupant.name}.` });
  }

  const destTeam = destSlot % 2 === 0 ? 'Team A' : 'Team B';

  // Empty slot: move directly
  movingPlayer.slot = destSlot;
  room.players[destSlot] = movingPlayer;
  room.players[currentSlot] = null;
  room.logs.push(`🪑 ${movingPlayer.name} moved to ${destTeam} (Seat ${destSlot + 1}).`);

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: destSlot });
});

// Switch Team in Lobby (Team A <-> Team B)
app.post('/api/rooms/:code/switch-team', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { playerId, targetTeam } = req.body || {};
  const cleanId = sanitizeId(playerId);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Cannot switch teams once the match has started' });
  }

  const currentSlot = room.players.findIndex(p => p && p.id === cleanId);
  if (currentSlot === -1) {
    return res.status(400).json({ error: 'Player is not currently seated at the table' });
  }

  const currentTeam = currentSlot % 2;
  const desiredTeam = targetTeam !== undefined ? sanitizeInt(targetTeam, 0, 1, 1 - currentTeam) : 1 - currentTeam;

  if (currentTeam === desiredTeam) {
    return res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: currentSlot });
  }

  // Candidate slots for desired team
  const targetSlots = desiredTeam === 0 ? [0, 2] : [1, 3];

  // Find a completely vacant slot in the desired team
  const chosenSlot = targetSlots.find(s => room.players[s] === null);

  if (chosenSlot === undefined) {
    return res.status(400).json({ error: `Team ${desiredTeam === 0 ? 'A' : 'B'} has no vacant seats.` });
  }

  const movingPlayer = room.players[currentSlot]!;
  const destTeamName = desiredTeam === 0 ? 'Team A' : 'Team B';

  movingPlayer.slot = chosenSlot;
  room.players[chosenSlot] = movingPlayer;
  room.players[currentSlot] = null;
  room.logs.push(`🎽 ${movingPlayer.name} switched to ${destTeamName} (Seat ${chosenSlot + 1}).`);

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, cleanId), playerSlot: chosenSlot });
});

// Update specific bot difficulty
app.post('/api/rooms/:code/bot-difficulty', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { slot, difficulty, requesterId } = req.body || {};
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Room not found' });

  const isHost = room.hostId ? room.hostId === requesterId : requesterId === room.players[0]?.id;
  if (!isHost) return res.status(403).json({ error: 'Only the lobby host can change bot skill levels.' });

  const targetSlot = typeof slot === 'number' ? slot : parseInt(slot, 10);
  if (isNaN(targetSlot) || targetSlot < 0 || targetSlot > 3) {
    return res.status(400).json({ error: 'Invalid slot' });
  }

  const player = room.players[targetSlot];
  if (!player || player.type !== 'bot') {
    return res.status(400).json({ error: 'No bot in this slot' });
  }

  if (!['novice', 'intermediate', 'pro'].includes(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty level' });
  }

  player.botDifficulty = difficulty as BotDifficulty;
  const diffLabel = difficulty === 'pro' ? 'Pro Master 🧠' : difficulty === 'novice' ? 'Novice 🎲' : 'Intermediate ⚡';
  room.logs.push(`⚙️ ${player.name}'s skill level set to ${diffLabel}.`);
  room.lastUpdateTime = Date.now();

  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Update default bot difficulty for room
app.post('/api/rooms/:code/default-bot-difficulty', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const { difficulty, requesterId } = req.body || {};
  const room = rooms.get(code);

  if (!room) return res.status(404).json({ error: 'Room not found' });

  const isHost = room.hostId ? room.hostId === requesterId : requesterId === room.players[0]?.id;
  if (!isHost) return res.status(403).json({ error: 'Only the lobby host can change default bot skill level.' });

  if (!['novice', 'intermediate', 'pro'].includes(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty level' });
  }

  room.defaultBotDifficulty = difficulty as BotDifficulty;

  // Also update any existing bots in the lobby
  room.players.forEach(p => {
    if (p && p.type === 'bot') {
      p.botDifficulty = difficulty as BotDifficulty;
    }
  });

  const diffLabel = difficulty === 'pro' ? 'Pro Master 🧠' : difficulty === 'novice' ? 'Novice 🎲' : 'Intermediate ⚡';
  room.logs.push(`⚙️ Room default bot skill level set to ${diffLabel}.`);
  room.lastUpdateTime = Date.now();

  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Remove Player/Bot from slot
app.post('/api/rooms/:code/remove-slot', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const targetSlot = sanitizeInt(req.body?.slot, 0, 3, -1);
  const requesterId = sanitizeId(req.body?.requesterId);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (targetSlot < 0 || targetSlot > 3) {
    return res.status(400).json({ error: 'Invalid slot' });
  }

  const targetPlayer = room.players[targetSlot];
  if (!targetPlayer) {
    return res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
  }

  // Permission check: host can remove any slot, player can remove themselves (leave)
  const isHost = room.hostId ? room.hostId === requesterId : requesterId === room.players[0]?.id;
  const isSelf = targetPlayer.id === requesterId;

  if (!isHost && !isSelf) {
    return res.status(403).json({ error: 'Only the lobby host can kick other players.' });
  }

  // If the target player being removed is the HOST, or if the host leaves / closes the lobby:
  // The lobby gets completely closed and deleted from the public server directory, kicking everyone.
  if (targetPlayer.id === room.hostId || (isHost && isSelf)) {
    clearBotTimer(code);
    clearStarterTimer(code);
    rooms.delete(code);
    return res.json({ message: 'Lobby closed and deleted by host', roomClosed: true });
  }

  const actionVerb = isSelf ? 'left the table' : 'was removed from the table by the host';
  room.logs.push(`🚪 ${targetPlayer.name} ${actionVerb}.`);
  room.players[targetSlot] = null;

  // Check remaining human players and spectators
  const humanPlayerCount = room.players.filter(p => p && p.type === 'human').length;
  const spectatorCount = (room.spectators || []).length;

  if (humanPlayerCount + spectatorCount === 0) {
    // Automatically close lobbies that have zero human presence
    clearBotTimer(code);
    clearStarterTimer(code);
    rooms.delete(code);
    return res.json({ message: 'Room closed (no human presence remaining)', roomClosed: true });
  }

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Close / Disband Room (Host only)
app.post('/api/rooms/:code/close', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const requesterId = sanitizeId(req.body?.requesterId || req.body?.playerId);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const isHost = room.hostId ? room.hostId === requesterId : requesterId === room.players[0]?.id;
  if (!isHost) {
    return res.status(403).json({ error: 'Only the lobby host can close the lobby.' });
  }

  clearBotTimer(code);
  clearStarterTimer(code);
  rooms.delete(code);

  res.json({ message: 'Lobby closed and deleted by host', roomClosed: true });
});

// Store active starter reveal timers per room code
const starterTimers = new Map<string, NodeJS.Timeout>();

function clearStarterTimer(code: string) {
  const normalizedCode = code.toUpperCase();
  const timer = starterTimers.get(normalizedCode);
  if (timer) {
    clearTimeout(timer);
    starterTimers.delete(normalizedCode);
  }
}

function startMatchAfterReveal(room: GameRoom) {
  clearStarterTimer(room.roomCode);
  if (room.status !== 'selecting_starter') return;

  dealRound(room);
  room.status = 'playing';
  room.lastUpdateTime = Date.now();
  scheduleBotTurnIfNeeded(room);
}

function scheduleStarterTransition(room: GameRoom, delayMs: number = 4500) {
  clearStarterTimer(room.roomCode);
  const timer = setTimeout(() => {
    starterTimers.delete(room.roomCode.toUpperCase());
    const currentRoom = rooms.get(room.roomCode.toUpperCase());
    if (currentRoom && currentRoom.status === 'selecting_starter') {
      startMatchAfterReveal(currentRoom);
    }
  }, delayMs);
  starterTimers.set(room.roomCode.toUpperCase(), timer);
}

// Start Game
app.post('/api/rooms/:code/start', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const requesterId = sanitizeId(req.body?.requesterId);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Permission check: only host can start
  const isHost = room.hostId ? room.hostId === requesterId : requesterId === room.players[0]?.id;
  if (!isHost) {
    return res.status(403).json({ error: 'Only the lobby host can start the match.' });
  }

  // Fill any empty slots with bots automatically
  const botNames = ['Bot Pepe', 'Bot Maria', 'Bot Jose', 'Bot Caridad'];
  for (let i = 0; i < 4; i++) {
    if (!room.players[i]) {
      const difficulty = room.defaultBotDifficulty || 'intermediate';
      room.players[i] = {
        id: `bot_${i}`,
        name: botNames[i],
        type: 'bot',
        slot: i,
        hand: [],
        botDifficulty: difficulty,
      };
      const diffLabel = difficulty === 'pro' ? 'Pro Master 🧠' : difficulty === 'novice' ? 'Novice 🎲' : 'Intermediate ⚡';
      room.logs.push(`🤖 ${botNames[i]} (${diffLabel}) added to fill Slot ${i + 1}.`);
    }
  }

  // Set up the Starter Selection Phase for the first round of the game
  room.status = 'selecting_starter';
  room.scores = [0, 0];
  room.scoreHistory = [{ round: 0, scores: [0, 0], winnerTeam: null, pointsEarned: 0 }];
  room.scoreMultiplier = 1;
  room.turnStartedAt = Date.now();
  
  // Pick two random dominoes with different sums to prevent any ties in value
  const deck = shuffleDeck(generateDoubleNineDeck());
  let tileA = deck[0];
  let tileB = deck[1];
  let idx = 2;
  while (tileA[0] + tileA[1] === tileB[0] + tileB[1] && idx < deck.length) {
    tileB = deck[idx++];
  }

  const selectingTeam = cryptoRandomInt(2);

  room.starterSelection = {
    team0Tile: null,
    team1Tile: null,
    selectingTeam,
    chosenIndex: null,
    options: [tileA, tileB],
  };

  room.logs = [];
  room.logs.push(`🎮 Game started! Match target score: ${room.targetScore} points.`);
  room.logs.push(`🎲 Starter Selection Ceremony: Team ${selectingTeam === 0 ? 'A (Slots 1 & 3)' : 'B (Slots 2 & 4)'} must choose a facedown tile.`);

  // If the selecting team consists only of bots, choose automatically
  const hasHumanOnSelectingTeam = room.players.some((p, sIdx) => 
    p && p.type === 'human' && (sIdx % 2 === selectingTeam)
  );

  if (!hasHumanOnSelectingTeam) {
    const randomIndex = cryptoRandomInt(2);
    const chosenTile = room.starterSelection.options[randomIndex];
    const otherTile = room.starterSelection.options[1 - randomIndex];

    room.starterSelection.chosenIndex = randomIndex;

    let team0Tile: Domino;
    let team1Tile: Domino;

    if (selectingTeam === 0) {
      team0Tile = chosenTile;
      team1Tile = otherTile;
    } else {
      team1Tile = chosenTile;
      team0Tile = otherTile;
    }

    room.starterSelection.team0Tile = team0Tile;
    room.starterSelection.team1Tile = team1Tile;

    const sum0 = team0Tile[0] + team0Tile[1];
    const sum1 = team1Tile[0] + team1Tile[1];

    const startingTeam = sum0 < sum1 ? 0 : 1;
    room.startingTeam = startingTeam;

    room.logs.push(`🤖 Team ${selectingTeam === 0 ? 'A' : 'B'} (Bots only) selected Tile ${randomIndex + 1}.`);
    room.logs.push(`🎴 Team A gets [${team0Tile[0]}|${team0Tile[1]}] (Value: ${sum0}).`);
    room.logs.push(`🎴 Team B gets [${team1Tile[0]}|${team1Tile[1]}] (Value: ${sum1}).`);
    room.logs.push(`🎲 Team ${startingTeam === 0 ? 'A' : 'B'} has the lower value tile and starts the match!`);

    scheduleStarterTransition(room, 4500);
  }

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Select Starter Tile
app.post('/api/rooms/:code/select-starter', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const playerId = sanitizeId(req.body?.playerId);
  const optionIndex = sanitizeInt(req.body?.optionIndex, 0, 1, -1);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'selecting_starter' || !room.starterSelection) {
    return res.status(400).json({ error: 'Starter selection is not active' });
  }

  if (room.starterSelection.chosenIndex !== null) {
    return res.status(400).json({ error: 'Starter tile has already been chosen' });
  }

  if (optionIndex !== 0 && optionIndex !== 1) {
    return res.status(400).json({ error: 'Invalid option index' });
  }

  // Verify selecting team player
  const player = room.players.find(p => p && p.id === playerId);
  if (!player) {
    return res.status(400).json({ error: 'Player not found' });
  }

  const selectingTeam = room.starterSelection.selectingTeam;
  if (player.slot % 2 !== selectingTeam) {
    return res.status(400).json({ error: `Only Team ${selectingTeam === 0 ? 'A' : 'B'} can make this choice` });
  }

  const chosenTile = room.starterSelection.options[optionIndex];
  const otherTile = room.starterSelection.options[1 - optionIndex];

  room.starterSelection.chosenIndex = optionIndex;

  let team0Tile: Domino;
  let team1Tile: Domino;

  if (selectingTeam === 0) {
    team0Tile = chosenTile;
    team1Tile = otherTile;
  } else {
    team1Tile = chosenTile;
    team0Tile = otherTile;
  }

  room.starterSelection.team0Tile = team0Tile;
  room.starterSelection.team1Tile = team1Tile;

  const sum0 = team0Tile[0] + team0Tile[1];
  const sum1 = team1Tile[0] + team1Tile[1];

  // The team with the lower value starts first
  const startingTeam = sum0 < sum1 ? 0 : 1;
  room.startingTeam = startingTeam;

  room.logs.push(`🔮 ${player.name} chose Tile ${optionIndex + 1}.`);
  room.logs.push(`🎴 Team A gets [${team0Tile[0]}|${team0Tile[1]}] (Value: ${sum0}).`);
  room.logs.push(`🎴 Team B gets [${team1Tile[0]}|${team1Tile[1]}] (Value: ${sum1}).`);
  room.logs.push(`🎲 Team ${startingTeam === 0 ? 'A' : 'B'} has the lower value tile and starts the match!`);

  // Schedule transition to playing status after reveal
  scheduleStarterTransition(room, 4500);

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Confirm Starter Reveal (Skip waiting timer)
app.post('/api/rooms/:code/confirm-starter', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status === 'selecting_starter' && room.starterSelection?.chosenIndex !== null) {
    startMatchAfterReveal(room);
  }

  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Play Tile
app.post('/api/rooms/:code/play', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const playerId = sanitizeId(req.body?.playerId);
  const parsedTileIndex = sanitizeInt(req.body?.tileIndex, 0, 55, -1);
  const rawSide = req.body?.side;
  const side = rawSide === 'left' ? 'left' : rawSide === 'right' ? 'right' : '';

  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'playing') {
    return res.status(400).json({ error: 'Game is not currently active' });
  }

  const player = room.players.find(p => p && p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found in this room' });
  }

  const slot = player.slot;

  if (room.board.length === 0) {
    // At the start of a round, either teammate of the starting team can play
    if (slot % 2 !== room.startingTeam) {
      return res.status(400).json({ 
        error: `Only Team ${room.startingTeam === 0 ? 'A' : 'B'} (${room.startingTeam === 0 ? 'Slots 1 & 3' : 'Slots 2 & 4'}) can play first in this round` 
      });
    }
    // Set active turn to this player
    room.turn = slot;
  } else {
    // Normal turn check
    const activePlayer = room.players[room.turn];
    if (!activePlayer || activePlayer.id !== playerId) {
      return res.status(400).json({ error: "It is not your turn to play" });
    }
  }

  const activePlayer = room.players[room.turn]!;
  if (parsedTileIndex < 0 || parsedTileIndex >= activePlayer.hand.length) {
    return res.status(400).json({ error: 'Invalid tile index' });
  }

  const tile = activePlayer.hand[parsedTileIndex];

  // Validate play validity
  if (room.board.length > 0) {
    const leftVal = room.board[0][0];
    const rightVal = room.board[room.board.length - 1][1];
    const { left, right } = canPlayTile(tile, leftVal, rightVal);

    if (side === 'left' && !left) {
      return res.status(400).json({ error: `Tile [${tile[0]}|${tile[1]}] cannot be played on Left end (needs ${leftVal})` });
    }
    if (side === 'right' && !right) {
      return res.status(400).json({ error: `Tile [${tile[0]}|${tile[1]}] cannot be played on Right end (needs ${rightVal})` });
    }
    if (side !== 'left' && side !== 'right') {
      return res.status(400).json({ error: 'Invalid side. Must be left or right' });
    }
  }

  // Execute human play
  executePlayTile(room, room.turn, parsedTileIndex, side as 'left' | 'right');

  // Run subsequent bots and skips
  scheduleBotTurnIfNeeded(room);

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Let Bot Partner Start the Round with a Double
app.post(['/api/rooms/:code/bot-partner-start', '/api/rooms/:code/bot-start-double'], (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const playerId = sanitizeId(req.body?.playerId);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'playing') {
    return res.status(400).json({ error: 'Game is not currently active' });
  }

  if (room.board.length > 0) {
    return res.status(400).json({ error: 'Round has already started with a tile on the board' });
  }

  const requestingPlayer = room.players.find(p => p && p.id === playerId);
  if (!requestingPlayer) {
    return res.status(404).json({ error: 'Player not found in this room' });
  }

  const requesterSlot = requestingPlayer.slot;

  // Verify that requester is on the starting team
  if (requesterSlot % 2 !== room.startingTeam) {
    const startingTeamName = room.startingTeam === 0 ? 'Team A (Slots 1 & 3)' : 'Team B (Slots 2 & 4)';
    return res.status(400).json({ error: `Only ${startingTeamName} has starting rights for this round` });
  }

  // Teammate slot is partner (requesterSlot + 2) % 4
  const partnerSlot = (requesterSlot + 2) % 4;
  const botPartner = room.players[partnerSlot];

  if (!botPartner || botPartner.type !== 'bot') {
    return res.status(400).json({ error: 'Your teammate is not a bot or the seat is empty' });
  }

  if (!botPartner.hand || botPartner.hand.length === 0) {
    return res.status(400).json({ error: 'Bot partner has no dominoes in hand' });
  }

  const botDiff = botPartner.botDifficulty || room.defaultBotDifficulty || 'intermediate';
  const openingMove = getBotOpeningDoubleMove(botPartner.hand, botDiff, partnerSlot, room);

  if (!openingMove) {
    return res.status(400).json({ error: 'Bot partner has no available moves' });
  }

  const playedTile = botPartner.hand[openingMove.tileIndex];
  const isDouble = playedTile[0] === playedTile[1];
  const teamLabel = room.startingTeam === 0 ? 'Team A' : 'Team B';

  if (isDouble) {
    room.logs.push(`🤖 Partner ${botPartner.name} takes the lead for ${teamLabel} and opens the round with DOUBLE [${playedTile[0]}|${playedTile[1]}]! 🀰`);
  } else {
    room.logs.push(`🤖 Partner ${botPartner.name} takes the lead for ${teamLabel} and opens the round with [${playedTile[0]}|${playedTile[1]}]!`);
  }

  // Set the starter slot and active turn to the bot partner, then execute the play
  room.starterSlot = partnerSlot;
  room.turn = partnerSlot;
  executePlayTile(room, partnerSlot, openingMove.tileIndex, 'right');

  // Schedule subsequent bot turns if needed
  scheduleBotTurnIfNeeded(room);

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Pass Turn
app.post('/api/rooms/:code/pass', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const playerId = sanitizeId(req.body?.playerId);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'playing') {
    return res.status(400).json({ error: 'Game is not currently active' });
  }

  const activePlayer = room.players[room.turn];
  if (!activePlayer || activePlayer.id !== playerId) {
    return res.status(400).json({ error: 'It is not your turn to play' });
  }

  // Prevent passing if player has valid moves!
  if (hasValidMoves(activePlayer.hand, room.board)) {
    return res.status(400).json({ error: 'You have legal dominoes to play and cannot pass!' });
  }

  room.consecutivePasses = (room.consecutivePasses || 0) + 1;
  room.logs.push(`⚠️ ${activePlayer.name} has no valid moves and passes.`);

  if (room.consecutivePasses >= 4) {
    handleTrancado(room);
  } else {
    advanceTurn(room);
    scheduleBotTurnIfNeeded(room);
  }

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Next Round
app.post('/api/rooms/:code/next-round', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'round_ended') {
    return res.status(400).json({ error: 'Round has not ended yet' });
  }

  room.status = 'playing';
  dealRound(room);

  // If starter is bot, play automatically
  scheduleBotTurnIfNeeded(room);

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Reset entire game (keep players)
app.post('/api/rooms/:code/reset', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  const requesterId = sanitizeId(req.body?.playerId || req.body?.requesterId);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Permission check: only host can reset game and scores
  const isHost = room.hostId ? room.hostId === requesterId : requesterId === room.players[0]?.id;
  if (!isHost) {
    return res.status(403).json({ error: 'Only the lobby host can reset scores and restart the game.' });
  }

  room.status = 'waiting';
  room.scores = [0, 0];
  room.scoreHistory = [{ round: 0, scores: [0, 0], winnerTeam: null, pointsEarned: 0 }];
  room.scoreMultiplier = 1;
  room.board = [];
  room.firstTileIndex = 0;
  room.roundWinnerSlot = null;
  room.roundWinnerTeam = null;
  room.roundBlocked = false;
  room.roundPointsEarned = 0;
  room.lastDominoWinnerSlot = null;
  room.logs = [`Match reset by host. Waiting to start.`];

  // Clear hands & streaks
  for (let i = 0; i < 4; i++) {
    if (room.players[i]) {
      room.players[i]!.hand = [];
      room.players[i]!.isLastDominoWinner = false;
      room.players[i]!.dominoStreak = 0;
    }
  }

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Send Quick Reaction Emoji
app.post('/api/rooms/:code/react', (req, res) => {
  const code = sanitizeRoomCode(req.params.code);
  let slotNum = sanitizeInt(req.body?.slot, 0, 3, -1);
  const playerId = sanitizeId(req.body?.playerId);
  const emoji = sanitizeEmoji(req.body?.emoji);
  const room = rooms.get(code);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (slotNum === -1 && playerId) {
    const playerIdx = room.players.findIndex(p => p && p.id === playerId);
    if (playerIdx !== -1) {
      slotNum = playerIdx;
    }
  }

  if (!emoji) {
    return res.status(400).json({ error: 'Invalid emoji' });
  }

  const newReaction: Reaction = {
    id: cryptoRandomId('react'),
    slot: slotNum, // -1 means spectator reaction
    emoji,
    timestamp: Date.now()
  };

  if (!room.reactions) {
    room.reactions = [];
  }

  room.reactions.push(newReaction);

  // Prune reactions older than 8 seconds
  const cutoff = Date.now() - 8000;
  room.reactions = room.reactions.filter(r => r.timestamp > cutoff);

  room.lastUpdateTime = Date.now();
  res.json({ room: sanitizeRoomForPlayer(room, getRequesterPlayerId(req)) });
});

// Fallback 404 handler for any unhandled /api/* routes to prevent serving HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found` });
});

// Clean up stale rooms (older than 4 hours)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastUpdateTime > 4 * 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 30 * 60 * 1000);

// Disconnect Detection & Auto-Hold Loop (runs every 2.5 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    let roomUpdated = false;
    for (let i = 0; i < 4; i++) {
      const p = room.players[i];
      if (p && p.type === 'human' && p.lastSeen) {
        // If human has not polled or sent heartbeat for > 10 seconds and not marked disconnected
        if (now - p.lastSeen > 10000 && !p.isDisconnected) {
          p.isDisconnected = true;
          room.logs.push(`⚠️ ${p.name} (Seat ${i + 1}) connection lost. Holding seat for reconnect...`);
          roomUpdated = true;
        }
      }
    }
    if (roomUpdated) {
      room.lastUpdateTime = Date.now();
    }
  }
}, 2500);

// Turn Timer Enforcer & Disconnected Player Auto-Play Loop (runs every 1 second)
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (!room.turnStartedAt) continue;

    const elapsedSec = (now - room.turnStartedAt) / 1000;
    const timerLimit = room.turnTimer && room.turnTimer > 0 ? room.turnTimer : 0;
    
    // Check if active player is disconnected and needs auto-play (fallback 15s if timer is OFF)
    const activeSlot = room.turn;
    const activePlayer = room.players[activeSlot];
    const isDisconnectedHuman = activePlayer && activePlayer.type === 'human' && activePlayer.isDisconnected;
    
    const isExpired = timerLimit > 0 ? (elapsedSec >= timerLimit) : (isDisconnectedHuman && elapsedSec >= 15);

    if (!isExpired) continue;

    // Time expired!
    if (room.status === 'selecting_starter' && room.starterSelection && room.starterSelection.chosenIndex === null) {
      const optionIndex = 0;
      const chosenTile = room.starterSelection.options[optionIndex];
      const otherTile = room.starterSelection.options[1 - optionIndex];

      room.starterSelection.chosenIndex = optionIndex;
      const selectingTeam = room.starterSelection.selectingTeam;

      if (selectingTeam === 0) {
        room.starterSelection.team0Tile = chosenTile;
        room.starterSelection.team1Tile = otherTile;
      } else {
        room.starterSelection.team1Tile = chosenTile;
        room.starterSelection.team0Tile = otherTile;
      }

      const sum0 = room.starterSelection.team0Tile[0] + room.starterSelection.team0Tile[1];
      const sum1 = room.starterSelection.team1Tile[0] + room.starterSelection.team1Tile[1];
      const startingTeam = sum0 < sum1 ? 0 : 1;
      room.startingTeam = startingTeam;

      room.logs.push(`⏰ Selection time limit expired! Tile 1 was automatically selected.`);
      room.logs.push(`🎴 Team A gets [${room.starterSelection.team0Tile[0]}|${room.starterSelection.team0Tile[1]}] (Value: ${sum0}).`);
      room.logs.push(`🎴 Team B gets [${room.starterSelection.team1Tile[0]}|${room.starterSelection.team1Tile[1]}] (Value: ${sum1}).`);
      room.logs.push(`🎲 Team ${startingTeam === 0 ? 'A' : 'B'} starts the match!`);

      scheduleStarterTransition(room, 4500);
      room.turnStartedAt = Date.now();
      room.lastUpdateTime = Date.now();
    } else if (room.status === 'playing') {
      if (!activePlayer) {
        advanceTurn(room);
        scheduleBotTurnIfNeeded(room);
        continue;
      }

      const botDiff = activePlayer.botDifficulty || room.defaultBotDifficulty || 'intermediate';
      const botMove = getBotMove(activePlayer.hand, room.board, botDiff, activeSlot, room);
      const reasonPrefix = isDisconnectedHuman ? `⚡ ${activePlayer.name} (Disconnected)` : `⏰ ${activePlayer.name}'s turn timer expired`;

      if (botMove) {
        const tile = activePlayer.hand[botMove.tileIndex];
        room.logs.push(`${reasonPrefix}: Auto-played tile [${tile[0]}|${tile[1]}].`);
        executePlayTile(room, activeSlot, botMove.tileIndex, botMove.side);
      } else {
        room.consecutivePasses = (room.consecutivePasses || 0) + 1;
        room.logs.push(`${reasonPrefix}: Auto-passed turn.`);

        if (room.consecutivePasses >= 4) {
          handleTrancado(room);
        } else {
          advanceTurn(room);
          scheduleBotTurnIfNeeded(room);
        }
      }
      room.turnStartedAt = Date.now();
      room.lastUpdateTime = Date.now();
    }
  }
}, 1000);

async function bootstrap() {
  try {
    // Serve static build in production
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Cuban Dominoes Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Error bootstrapping server:', err);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('Unhandled bootstrap error:', err);
  process.exit(1);
});
