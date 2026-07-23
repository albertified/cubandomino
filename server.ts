import express from 'express';
import path from 'path';
import { GameRoom, Player, Domino, GameStatus, Reaction, RoomListItem } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory database of game rooms
const rooms = new Map<string, GameRoom>();

// Generate a 4-character uppercase room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters like I, O, 0, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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

// Shuffle deck
function shuffleDeck(deck: Domino[]): Domino[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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

// Select the best bot move
function getBotMove(hand: Domino[], board: Domino[]): { tileIndex: number; side: 'left' | 'right' } | null {
  if (board.length === 0) {
    // Play the highest value double, or highest tile
    let bestIndex = 0;
    let bestScore = -1;
    for (let i = 0; i < hand.length; i++) {
      const [v1, v2] = hand[i];
      const isDouble = v1 === v2;
      const score = v1 + v2 + (isDouble ? 100 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return { tileIndex: bestIndex, side: 'right' };
  }

  const leftVal = board[0][0];
  const rightVal = board[board.length - 1][1];
  const validMoves: { tileIndex: number; side: 'left' | 'right'; score: number }[] = [];

  for (let i = 0; i < hand.length; i++) {
    const tile = hand[i];
    const isDouble = tile[0] === tile[1];
    const baseScore = tile[0] + tile[1] + (isDouble ? 100 : 0);

    const { left, right } = canPlayTile(tile, leftVal, rightVal);
    if (left) {
      validMoves.push({ tileIndex: i, side: 'left', score: baseScore });
    }
    if (right) {
      validMoves.push({ tileIndex: i, side: 'right', score: baseScore });
    }
  }

  if (validMoves.length === 0) return null;

  // Sort descending by score
  validMoves.sort((a, b) => b.score - a.score);
  return { tileIndex: validMoves[0].tileIndex, side: validMoves[0].side };
}

// Deal a new round
function dealRound(room: GameRoom) {
  const deck = shuffleDeck(generateDoubleNineDeck());
  room.board = [];
  room.firstTileIndex = 0;
  room.roundWinnerSlot = null;
  room.roundBlocked = false;
  room.roundPointsEarned = 0;

  // Deal 10 tiles to each of the 4 slots
  for (let i = 0; i < 4; i++) {
    const player = room.players[i];
    if (player) {
      player.hand = deck.slice(i * 10, (i + 1) * 10);
    }
  }

  // If startingTeam is not set, default to a random team
  if (room.startingTeam === undefined) {
    room.startingTeam = Math.floor(Math.random() * 2);
  }

  // Set initial turn to the lower slot on the starting team
  const initialStarter = room.startingTeam === 0 ? 0 : 1;
  room.starterSlot = initialStarter;
  room.turn = initialStarter;

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

  room.scores[winningTeam] += losingPoints;
  room.roundWinnerSlot = winnerSlot;
  room.roundBlocked = false;
  room.roundPointsEarned = losingPoints;
  room.status = 'round_ended';
  room.startingTeam = winningTeam; // Winner team gets starting rights on subsequent round!

  room.logs.push(`🎉 DOMINO! ${winner.name} played their last tile!`);
  room.logs.push(`🏆 Team ${winningTeam === 0 ? 'A (Slots 1 & 3)' : 'B (Slots 2 & 4)'} wins the round and earns ${losingPoints} points!`);

  // Check game win
  if (room.scores[winningTeam] >= room.targetScore) {
    room.status = 'game_over';
    room.logs.push(`🏆 GAME OVER! Team ${winningTeam === 0 ? 'A' : 'B'} reached ${room.scores[winningTeam]} points (Target: ${room.targetScore}) and won the match! 🏆`);
  }
}

// Handle blocked game
function handleTrancado(room: GameRoom) {
  // Blocked! Nobody can make a valid move.
  // Evaluate hands to see who wins.
  const sums = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const hand = room.players[i]?.hand || [];
    let sum = 0;
    for (const [v1, v2] of hand) sum += (v1 + v2);
    sums[i] = sum;
  }

  const team0Sum = sums[0] + sums[2];
  const team1Sum = sums[1] + sums[3];

  let winningTeam = 0;
  let losingPoints = 0;

  if (team0Sum < team1Sum) {
    winningTeam = 0;
    losingPoints = team1Sum;
  } else if (team1Sum < team0Sum) {
    winningTeam = 1;
    losingPoints = team0Sum;
  } else {
    // Tie in blocked game: traditional rules can vary, let's award to Team 0 as default tie-breaker
    winningTeam = 0;
    losingPoints = team1Sum;
  }

  room.scores[winningTeam] += losingPoints;
  room.roundWinnerSlot = -1; // -1 represents block/trancado
  room.roundBlocked = true;
  room.roundPointsEarned = losingPoints;
  room.status = 'round_ended';
  room.startingTeam = winningTeam; // Winner team of blocked game gets starting rights on subsequent round!

  room.logs.push(`⚠️ TRANCADO! The game is blocked. No player has a valid move.`);
  room.logs.push(`📊 Scores remaining: Player 1 (Slot 1): ${sums[0]}pts | Player 2 (Slot 2): ${sums[1]}pts | Player 3 (Slot 3): ${sums[2]}pts | Player 4 (Slot 4): ${sums[3]}pts.`);
  room.logs.push(`📊 Team A Combined: ${team0Sum}pts vs Team B Combined: ${team1Sum}pts.`);
  room.logs.push(`🏆 Team ${winningTeam === 0 ? 'A' : 'B'} wins the block with lower points and earns ${losingPoints} points!`);

  if (room.scores[winningTeam] >= room.targetScore) {
    room.status = 'game_over';
    room.logs.push(`🏆 GAME OVER! Team ${winningTeam === 0 ? 'A' : 'B'} reached ${room.scores[winningTeam]} points and won the match! 🏆`);
  }
}

// Advance turn, skipping players who have no valid moves.
// If all 4 players are consecutively skipped, trigger trancado.
function advanceTurn(room: GameRoom) {
  let consecutiveSkips = 0;

  while (consecutiveSkips < 4) {
    room.turn = (room.turn + 3) % 4;
    const nextPlayer = room.players[room.turn];

    if (nextPlayer && nextPlayer.hand.length > 0) {
      if (hasValidMoves(nextPlayer.hand, room.board)) {
        room.lastUpdateTime = Date.now();
        return;
      } else {
        room.logs.push(`⚠️ ${nextPlayer.name} has no valid moves and is automatically skipped.`);
        consecutiveSkips++;
      }
    } else {
      consecutiveSkips++;
    }
  }

  // If we looped through all 4 slots and no one can play, trigger blocked game
  handleTrancado(room);
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

  room.lastUpdateTime = Date.now();

  // Check round win
  if (player.hand.length === 0) {
    handleRoundWin(room, slot);
  } else {
    advanceTurn(room);
  }
}

// Play bots and skips recursively until a human player is active (or game ends)
function runBotsAndSkips(room: GameRoom) {
  let loops = 0;
  while (room.status === 'playing' && loops < 50) {
    loops++;

    // If starting a new round, check if there are human players on the starting team.
    // If so, do not auto-play bots. Let the human team decide who starts.
    if (room.board.length === 0 && room.startingTeam !== undefined) {
      const hasHumanOnStartingTeam = room.players.some((p, sIdx) => 
        p && p.type === 'human' && (sIdx % 2 === room.startingTeam)
      );
      if (hasHumanOnStartingTeam) {
        const activePlayer = room.players[room.turn];
        if (activePlayer && activePlayer.type === 'bot') {
          break; // Wait for the human on the team to make the starting play
        }
      }
    }

    const activePlayer = room.players[room.turn];
    if (!activePlayer) {
      // Empty slot, treat as auto-pass
      advanceTurn(room);
      continue;
    }

    if (activePlayer.type === 'bot') {
      const botMove = getBotMove(activePlayer.hand, room.board);
      if (botMove) {
        executePlayTile(room, room.turn, botMove.tileIndex, botMove.side);
      } else {
        room.logs.push(`⚠️ ${activePlayer.name} has no valid moves and is automatically skipped.`);
        advanceTurn(room);
      }
    } else {
      // It's a human player's turn, wait for input!
      break;
    }
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get Public Lobbies List
app.get('/api/public-rooms', (req, res) => {
  const publicRooms: RoomListItem[] = [];
  const now = Date.now();

  // Cleanup stale rooms or rooms with zero human players
  for (const [code, room] of rooms.entries()) {
    const activePlayers = room.players.filter(p => p !== null);
    const humanCount = activePlayers.filter(p => p?.type === 'human').length;

    // Automatically close lobbies with 0 human players or stale rooms (>3h)
    if (humanCount === 0 || now - room.lastUpdateTime > 3 * 60 * 60 * 1000) {
      rooms.delete(code);
      continue;
    }

    const isPublicRoom = room.isPublic ?? true;
    if (isPublicRoom && (room.status === 'waiting' || room.status === 'selecting_starter' || room.status === 'playing')) {
      const activePlayers = room.players.filter(p => p !== null);
      const humanCount = activePlayers.filter(p => p?.type === 'human').length;
      const host = room.players[0]?.name || room.hostName || 'Host';

      publicRooms.push({
        roomCode: room.roomCode,
        hostName: host,
        playerCount: activePlayers.length,
        humanCount: humanCount,
        status: room.status,
        targetScore: room.targetScore,
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
  const { targetScore, playerName, playerId, isPublic } = req.body;
  
  let code = generateRoomCode();
  // Ensure unique code
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const limitScore = Number(targetScore) || 150;
  const roomIsPublic = isPublic !== undefined ? Boolean(isPublic) : true;

  const firstPlayer: Player = {
    id: playerId || `host_${Math.random().toString(36).substr(2, 9)}`,
    name: playerName || 'Player 1',
    type: 'human',
    slot: 0,
    hand: []
  };

  const newRoom: GameRoom = {
    roomCode: code,
    status: 'waiting',
    targetScore: limitScore,
    isPublic: roomIsPublic,
    hostName: firstPlayer.name,
    hostId: firstPlayer.id,
    scores: [0, 0],
    players: [firstPlayer, null, null, null],
    board: [],
    firstTileIndex: 0,
    turn: 0,
    starterSlot: 0,
    roundWinnerSlot: null,
    roundBlocked: false,
    roundPointsEarned: 0,
    logs: [`Room ${code} created. Waiting for players to join.`],
    reactions: [],
    lastUpdateTime: Date.now()
  };

  rooms.set(code, newRoom);
  res.json({ room: newRoom, playerSlot: 0 });
});

// Join Room
app.post('/api/rooms/:code/join', (req, res) => {
  const { code } = req.params;
  const { playerName, playerId, slot } = req.body;
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Check if player is already in the room
  const existingPlayerIndex = room.players.findIndex(p => p && p.id === playerId);
  if (existingPlayerIndex !== -1) {
    return res.json({ room, playerSlot: existingPlayerIndex });
  }

  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Game has already started in this room' });
  }

  // Find slot
  let targetSlot = -1;
  if (slot !== undefined && Number(slot) >= 0 && Number(slot) < 4) {
    if (!room.players[Number(slot)]) {
      targetSlot = Number(slot);
    }
  }

  if (targetSlot === -1) {
    // Find first empty slot
    targetSlot = room.players.findIndex(p => p === null);
  }

  if (targetSlot === -1) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const newPlayer: Player = {
    id: playerId || `p_${Math.random().toString(36).substr(2, 9)}`,
    name: playerName || `Player ${targetSlot + 1}`,
    type: 'human',
    slot: targetSlot,
    hand: []
  };

  room.players[targetSlot] = newPlayer;
  room.logs.push(`👥 ${newPlayer.name} joined the room (Slot ${targetSlot + 1}).`);
  room.lastUpdateTime = Date.now();

  res.json({ room, playerSlot: targetSlot });
});

// Update Player Name
app.post('/api/rooms/:code/update-player', (req, res) => {
  const { code } = req.params;
  const { playerId, newName } = req.body;
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const player = room.players.find(p => p && p.id === playerId);
  if (player && newName && typeof newName === 'string' && newName.trim().length > 0) {
    const oldName = player.name;
    player.name = newName.trim();
    if (oldName !== player.name) {
      room.logs.push(`✏️ ${oldName} changed profile name to ${player.name}.`);
      room.lastUpdateTime = Date.now();
    }
  }

  res.json({ room });
});

// Get Room State
app.get('/api/rooms/:code', (req, res) => {
  const { code } = req.params;
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  // Prune reactions older than 8 seconds
  if (room.reactions) {
    const cutoff = Date.now() - 8000;
    room.reactions = room.reactions.filter(r => r.timestamp > cutoff);
  }

  res.json({ room });
});

// Add Bot
app.post('/api/rooms/:code/bot', (req, res) => {
  const { code } = req.params;
  const { requesterId } = req.body;
  const room = rooms.get(code.toUpperCase());

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

  const emptySlot = room.players.findIndex(p => p === null);
  if (emptySlot === -1) {
    return res.status(400).json({ error: 'Room is full' });
  }

  const botNames = ['Bot Pepe', 'Bot Maria', 'Bot Jose', 'Bot Caridad'];
  const botName = botNames[emptySlot] || `Bot ${emptySlot + 1}`;

  const botPlayer: Player = {
    id: `bot_${emptySlot}`,
    name: botName,
    type: 'bot',
    slot: emptySlot,
    hand: []
  };

  room.players[emptySlot] = botPlayer;
  room.logs.push(`🤖 ${botName} has been added to Slot ${emptySlot + 1}.`);
  room.lastUpdateTime = Date.now();

  res.json({ room });
});

// Remove Player/Bot from slot
app.post('/api/rooms/:code/remove-slot', (req, res) => {
  const { code } = req.params;
  const { slot, requesterId } = req.body;
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const targetSlot = Number(slot);
  if (targetSlot < 0 || targetSlot > 3) {
    return res.status(400).json({ error: 'Invalid slot' });
  }

  const targetPlayer = room.players[targetSlot];
  if (!targetPlayer) {
    return res.json({ room });
  }

  // Permission check: host can remove any slot, player can remove themselves (leave)
  const isHost = room.hostId ? room.hostId === requesterId : requesterId === room.players[0]?.id;
  const isSelf = targetPlayer.id === requesterId;

  if (!isHost && !isSelf) {
    return res.status(403).json({ error: 'Only the lobby host can kick other players.' });
  }

  const actionVerb = isSelf ? 'left the table' : 'was removed from the table by the host';
  room.logs.push(`🚪 ${targetPlayer.name} ${actionVerb}.`);
  room.players[targetSlot] = null;

  // Check remaining human players
  const remainingHumans = room.players.filter(p => p && p.type === 'human');

  if (remainingHumans.length === 0) {
    // Automatically close lobbies that have zero human players
    rooms.delete(code.toUpperCase());
    return res.json({ message: 'Room closed (no human players remaining)', roomClosed: true });
  }

  // If host was removed/left, reassign host to the first remaining human player
  if (targetPlayer.id === room.hostId) {
    const nextHost = remainingHumans[0];
    if (nextHost) {
      room.hostId = nextHost.id;
      room.hostName = nextHost.name;
      room.logs.push(`👑 ${nextHost.name} is now the table host.`);
    }
  }

  room.lastUpdateTime = Date.now();
  res.json({ room });
});

// Start Game
app.post('/api/rooms/:code/start', (req, res) => {
  const { code } = req.params;
  const { requesterId } = req.body;
  const room = rooms.get(code.toUpperCase());

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
      room.players[i] = {
        id: `bot_${i}`,
        name: botNames[i],
        type: 'bot',
        slot: i,
        hand: []
      };
      room.logs.push(`🤖 ${botNames[i]} added to fill Slot ${i + 1}.`);
    }
  }

  // Set up the Starter Selection Phase for the first round of the game
  room.status = 'selecting_starter';
  room.scores = [0, 0];
  
  // Pick two random dominoes with different sums to prevent any ties in value
  const deck = shuffleDeck(generateDoubleNineDeck());
  let tileA = deck[0];
  let tileB = deck[1];
  let idx = 2;
  while (tileA[0] + tileA[1] === tileB[0] + tileB[1] && idx < deck.length) {
    tileB = deck[idx++];
  }

  const selectingTeam = Math.floor(Math.random() * 2);

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
    const randomIndex = Math.floor(Math.random() * 2);
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

    dealRound(room);
    room.status = 'playing';
    runBotsAndSkips(room);
  }

  room.lastUpdateTime = Date.now();
  res.json({ room });
});

// Select Starter Tile
app.post('/api/rooms/:code/select-starter', (req, res) => {
  const { code } = req.params;
  const { playerId, optionIndex } = req.body;
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'selecting_starter' || !room.starterSelection) {
    return res.status(400).json({ error: 'Starter selection is not active' });
  }

  const idx = Number(optionIndex);
  if (idx !== 0 && idx !== 1) {
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

  const chosenTile = room.starterSelection.options[idx];
  const otherTile = room.starterSelection.options[1 - idx];

  room.starterSelection.chosenIndex = idx;

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

  room.logs.push(`🔮 ${player.name} chose Tile ${idx + 1}.`);
  room.logs.push(`🎴 Team A gets [${team0Tile[0]}|${team0Tile[1]}] (Value: ${sum0}).`);
  room.logs.push(`🎴 Team B gets [${team1Tile[0]}|${team1Tile[1]}] (Value: ${sum1}).`);
  room.logs.push(`🎲 Team ${startingTeam === 0 ? 'A' : 'B'} has the lower value tile and starts the match!`);

  // Deal hands for the first round
  dealRound(room);
  room.status = 'playing';

  // Run subsequent bots if any
  runBotsAndSkips(room);

  room.lastUpdateTime = Date.now();
  res.json({ room });
});

// Play Tile
app.post('/api/rooms/:code/play', (req, res) => {
  const { code } = req.params;
  const { playerId, tileIndex, side } = req.body;
  const room = rooms.get(code.toUpperCase());

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
  const parsedTileIndex = Number(tileIndex);
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
  executePlayTile(room, room.turn, parsedTileIndex, side);

  // Run subsequent bots and skips
  runBotsAndSkips(room);

  room.lastUpdateTime = Date.now();
  res.json({ room });
});

// Next Round
app.post('/api/rooms/:code/next-round', (req, res) => {
  const { code } = req.params;
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.status !== 'round_ended') {
    return res.status(400).json({ error: 'Round has not ended yet' });
  }

  room.status = 'playing';
  dealRound(room);

  // If starter is bot, play automatically
  runBotsAndSkips(room);

  room.lastUpdateTime = Date.now();
  res.json({ room });
});

// Reset entire game (keep players)
app.post('/api/rooms/:code/reset', (req, res) => {
  const { code } = req.params;
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  room.status = 'waiting';
  room.scores = [0, 0];
  room.board = [];
  room.firstTileIndex = 0;
  room.roundWinnerSlot = null;
  room.roundBlocked = false;
  room.roundPointsEarned = 0;
  room.logs = [`Match reset by host. Waiting to start.`];

  // Clear hands
  for (let i = 0; i < 4; i++) {
    if (room.players[i]) {
      room.players[i]!.hand = [];
    }
  }

  room.lastUpdateTime = Date.now();
  res.json({ room });
});

// Send Quick Reaction Emoji
app.post('/api/rooms/:code/react', (req, res) => {
  const { code } = req.params;
  const { slot, emoji } = req.body;
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const slotNum = Number(slot);
  if (isNaN(slotNum) || slotNum < 0 || slotNum > 3) {
    return res.status(400).json({ error: 'Invalid player slot' });
  }

  if (!emoji || typeof emoji !== 'string') {
    return res.status(400).json({ error: 'Invalid emoji' });
  }

  const newReaction: Reaction = {
    id: `react_${Math.random().toString(36).substring(2, 11)}`,
    slot: slotNum,
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
  res.json({ room });
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

async function bootstrap() {
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
}

bootstrap();
