import React from 'react';
import { Play, Bot, Users, RefreshCw, UserPlus, LogOut, Eye, Sparkles } from 'lucide-react';
import { GameRoom, BotDifficulty } from '../types';

interface MatchLobbyViewProps {
  room: GameRoom;
  playerId: string;
  playerSlot: number | null;
  isHost: boolean;
  loading: boolean;
  t: Record<string, string>;
  shiftSeat: (direction: 'left' | 'right') => void;
  switchSlot: (destSlot: number) => void;
  takeOpenSeat: (slotIdx?: number, preferredTeam?: 0 | 1) => void;
  addBot: (difficulty?: BotDifficulty, slotIdx?: number) => void;
  removeSlot: (slotIdx: number) => void;
  changeBotDifficulty: (slotIdx: number, difficulty: BotDifficulty) => void;
  changeDefaultBotDifficulty: (difficulty: BotDifficulty) => void;
  startGame: () => void;
  exitRoom: () => void;
}

export const MatchLobbyView: React.FC<MatchLobbyViewProps> = ({
  room,
  playerId,
  playerSlot,
  isHost,
  loading,
  t,
  shiftSeat,
  switchSlot,
  takeOpenSeat,
  addBot,
  removeSlot,
  changeBotDifficulty,
  changeDefaultBotDifficulty,
  startGame,
  exitRoom
}) => {
  const seatedPlayers = room.players.filter(Boolean);
  const seatedCount = seatedPlayers.length;
  const isFull = room.players.every(p => p !== null);

  return (
    <div className="space-y-5 max-w-4xl mx-auto w-full my-auto px-2">
      {/* Table & Partnership Overview Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-stone-200 flex items-center gap-2">
              <span>Havana 4-Player Table</span>
              <span className="text-stone-500">•</span>
              <span className="text-stone-400 font-normal">{seatedCount}/4 Seated</span>
            </div>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5">
              <span className="text-[#fbbf24] font-bold">Team A</span>: Seats 1 & 3 &nbsp;|&nbsp; <span className="text-teal-400 font-bold">Team B</span>: Seats 2 & 4
            </p>
          </div>
        </div>

        {/* Quick Team / Seat Switcher if user is seated */}
        {playerSlot !== null ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-400 hidden sm:inline">
              Your Seat: <strong className="text-white">{playerSlot + 1}</strong> (<span className={playerSlot % 2 === 0 ? 'text-[#fbbf24] font-bold' : 'text-teal-400 font-bold'}>Team {playerSlot % 2 === 0 ? 'A' : 'B'}</span>)
            </span>
            <button
              onClick={() => shiftSeat('right')}
              disabled={loading}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 hover:text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Switch to opposite team"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Switch Team</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => takeOpenSeat(undefined, 0)}
              disabled={loading}
              className="px-3 py-1.5 bg-[#fbbf24]/15 hover:bg-[#fbbf24]/25 border border-[#fbbf24]/40 text-[#fbbf24] rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Join Team A</span>
            </button>
            <button
              onClick={() => takeOpenSeat(undefined, 1)}
              disabled={loading}
              className="px-3 py-1.5 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Join Team B</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Table Seats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {room.players.map((player, idx) => {
          const teamNum = idx % 2;
          const isMe = player && player.id === playerId;
          const isCrown = Boolean(player?.isLastDominoWinner || (room.lastDominoWinnerSlot !== null && room.lastDominoWinnerSlot === idx));
          const isTeamA = teamNum === 0;

          return (
            <div
              key={idx}
              className={`rounded-xl p-4 relative flex flex-col justify-between min-h-[220px] transition-all border ${
                player
                  ? isMe
                    ? 'bg-stone-900/90 border-[#fbbf24]/50 shadow-md ring-1 ring-[#fbbf24]/20'
                    : 'bg-stone-900/60 border-stone-800/80 shadow-sm'
                  : 'bg-stone-950/40 border-dashed border-stone-800/90 hover:border-stone-700/80'
              }`}
            >
              {/* Seat Header */}
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/5">
                <span className="text-[11px] font-mono font-bold text-stone-400">
                  Seat {idx + 1}
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isTeamA ? 'text-[#fbbf24]' : 'text-teal-400'
                }`}>
                  Team {isTeamA ? 'A' : 'B'}
                </span>
              </div>

              {/* Seat Body */}
              {player ? (
                <div className="py-4 flex-1 flex flex-col items-center justify-center text-center space-y-2">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full bg-stone-950 border flex items-center justify-center text-xl shadow-inner relative ${
                    isMe ? 'border-[#fbbf24]/60 ring-2 ring-[#fbbf24]/20' : 'border-stone-800'
                  }`}>
                    {player.type === 'bot' ? '🤖' : '👤'}
                    {(player.isHost || (room.hostId && room.hostId !== 'hidden' && room.hostId === player.id) || (!room.hostId && idx === 0)) && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shadow" title="Host">
                        ★
                      </span>
                    )}
                    {isCrown && (
                      <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-950 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shadow" title="Last Domino Winner">
                        👑
                      </span>
                    )}
                  </div>

                  {/* Player Name and Role Label */}
                  <div>
                    <div className="font-bold text-sm text-stone-100 flex items-center justify-center gap-1.5 flex-wrap">
                      <span>{player.name}</span>
                      {isMe && (
                        <span className="text-[10px] text-[#fbbf24] font-mono font-semibold">(You)</span>
                      )}
                    </div>

                    {player.type === 'bot' ? (
                      <div className="mt-1.5">
                        {isHost ? (
                          <select
                            value={player.botDifficulty || room.defaultBotDifficulty || 'intermediate'}
                            onChange={(e) => changeBotDifficulty(idx, e.target.value as BotDifficulty)}
                            className="bg-stone-950 border border-stone-700/80 text-amber-300 font-mono text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-400 cursor-pointer text-center"
                            title="Change bot difficulty"
                          >
                            <option value="novice">Novice</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="pro">Pro Master</option>
                          </select>
                        ) : (
                          <span className="text-[10px] font-mono text-stone-400 uppercase">
                            Bot · {player.botDifficulty || 'Intermediate'}
                          </span>
                        )}
                      </div>
                    ) : player.isDisconnected ? (
                      <span className="text-[10px] text-amber-400 font-mono flex items-center justify-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        Disconnected
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 font-mono">
                        {player.isHost ? 'Host' : 'Human'}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                /* Vacant Seat */
                <div className="py-4 flex-1 flex flex-col justify-center items-center text-stone-500 space-y-2">
                  <div className="w-10 h-10 rounded-full border border-dashed border-stone-800 flex items-center justify-center text-stone-600">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono text-stone-500">Vacant Seat</span>

                  {/* Actions on vacant seat */}
                  <div className="flex flex-col gap-1.5 w-full pt-1">
                    {playerSlot !== null ? (
                      <button
                        onClick={() => switchSlot(idx)}
                        disabled={loading}
                        className="w-full py-1.5 px-2 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border border-stone-700/60 flex items-center justify-center gap-1"
                      >
                        <span>Move Here</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => takeOpenSeat(idx)}
                        disabled={loading}
                        className={`w-full py-1.5 px-2 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer shadow flex items-center justify-center gap-1 ${
                          isTeamA
                            ? 'bg-[#fbbf24] hover:bg-[#f59e0b] text-stone-950'
                            : 'bg-teal-600 hover:bg-teal-500 text-white'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Sit Here</span>
                      </button>
                    )}

                    {isHost && (
                      <button
                        onClick={() => addBot(undefined, idx)}
                        disabled={loading}
                        className="w-full py-1 px-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded text-[11px] font-mono transition-all cursor-pointer border border-stone-800/60 flex items-center justify-center gap-1"
                        title="Add bot to this specific seat"
                      >
                        <Bot className="w-3 h-3 text-stone-400" />
                        <span>+ Add Bot</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Seat Footer Action (Remove if Host) */}
              {player && isHost && !isMe && (
                <div className="w-full pt-2 border-t border-white/5 flex items-center justify-center">
                  <button
                    onClick={() => removeSlot(idx)}
                    className="text-[11px] font-mono text-stone-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                    title={`Remove ${player.name}`}
                  >
                    <span>✕</span>
                    <span>{player.type === 'bot' ? 'Remove' : 'Kick'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Spectators watching list in lobby stage */}
      {room.spectators && room.spectators.length > 0 && (
        <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-800/80 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#fe7328] shrink-0" />
            <span className="text-stone-300 font-bold">Spectators ({room.spectators.length}):</span>
            <span className="text-stone-400 truncate max-w-md">
              {room.spectators.map(s => s.name).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-800/80">
        <div>
          {!isHost ? (
            <div className="flex items-center gap-2 text-xs font-mono text-stone-400 italic">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{t.waitingForHost}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-lg font-mono text-xs text-stone-400">
                <Bot className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[11px] text-stone-400 hidden sm:inline">Bot Level:</span>
                <select
                  value={room.defaultBotDifficulty || 'intermediate'}
                  onChange={(e) => changeDefaultBotDifficulty(e.target.value as BotDifficulty)}
                  className="bg-transparent text-stone-200 font-mono font-medium text-xs focus:outline-none cursor-pointer"
                  title="Set default skill level for bots"
                >
                  <option value="novice" className="bg-stone-900 text-stone-200">Novice</option>
                  <option value="intermediate" className="bg-stone-900 text-stone-200">Intermediate</option>
                  <option value="pro" className="bg-stone-900 text-stone-200">Pro Master</option>
                </select>
              </div>

              <button
                onClick={exitRoom}
                className="px-3 py-1.5 bg-stone-900/60 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 rounded-lg text-xs font-mono transition-all cursor-pointer"
                title="Close and exit lobby"
              >
                Close Lobby
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isHost ? (
            <>
              <button
                onClick={() => addBot()}
                disabled={isFull}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 font-mono text-xs font-medium transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-sm"
                title="Auto-fill next empty seat with a bot"
              >
                <Bot className="w-3.5 h-3.5 text-stone-400" />
                <span>Auto-Add Bot</span>
              </button>

              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-lg bg-[#fbbf24] hover:bg-[#f59e0b] text-stone-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-stone-950" />
                <span>{t.startGameBtn}</span>
              </button>
            </>
          ) : (
            <button
              onClick={exitRoom}
              className="px-4 py-2 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 font-mono text-xs transition-all cursor-pointer"
              title="Leave lobby"
            >
              Leave Lobby
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
