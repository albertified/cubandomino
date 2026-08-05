import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RoundHistoryEntry } from '../types';
import { TrendingUp, Award, Zap, Maximize2, Minimize2, X } from 'lucide-react';

interface ScoreHistoryChartProps {
  scoreHistory?: RoundHistoryEntry[];
  targetScore: number;
  teamAName?: string;
  teamBName?: string;
  currentScores?: [number, number];
  compact?: boolean;
}

export const ScoreHistoryChart: React.FC<ScoreHistoryChartProps> = ({
  scoreHistory = [],
  targetScore = 150,
  teamAName = 'Team A',
  teamBName = 'Team B',
  currentScores = [0, 0],
  compact = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    round: number;
    teamAScore: number;
    teamBScore: number;
    winnerTeam?: number | null;
    pointsEarned?: number;
    x: number;
    yA: number;
    yB: number;
  } | null>(null);

  // Normalize history: ensure at least Round 0 (0,0) and current state if history is empty
  let history: RoundHistoryEntry[] = [...scoreHistory];
  if (history.length === 0) {
    history = [
      { round: 0, scores: [0, 0], winnerTeam: null, pointsEarned: 0 }
    ];
  }
  
  // If only 1 entry (round 0), add current scores as point 1 if non-zero
  if (history.length === 1 && (currentScores[0] > 0 || currentScores[1] > 0)) {
    history.push({
      round: 1,
      scores: [currentScores[0], currentScores[1]],
      winnerTeam: currentScores[0] > currentScores[1] ? 0 : (currentScores[1] > currentScores[0] ? 1 : null),
      pointsEarned: Math.max(currentScores[0], currentScores[1])
    });
  }

  const renderChart = (isExpandedView = false) => {
    // SVG dimensions
    const isCompactMode = compact && !isExpandedView;
    const svgWidth = isExpandedView ? 720 : (isCompactMode ? 380 : 500);
    const svgHeight = isExpandedView ? 340 : (isCompactMode ? 210 : 250);
    const marginTop = isExpandedView ? 35 : (isCompactMode ? 28 : 32);
    const marginBottom = isExpandedView ? 45 : (isCompactMode ? 32 : 36);
    const marginLeft = isExpandedView ? 48 : (isCompactMode ? 36 : 42);
    const marginRight = isExpandedView ? 30 : (isCompactMode ? 22 : 26);

    const width = svgWidth - marginLeft - marginRight;
    const height = svgHeight - marginTop - marginBottom;

    // Find max score for Y axis scale
    const maxScoreInHistory = Math.max(
      ...history.map(h => Math.max(h.scores[0], h.scores[1])),
      currentScores[0],
      currentScores[1]
    );
    const maxY = Math.max(targetScore, maxScoreInHistory, 10);
    const totalRounds = Math.max(1, history.length - 1);

    // Calculate coordinates
    const points = history.map((entry, index) => {
      const x = marginLeft + (index / totalRounds) * width;
      const yA = marginTop + height - (entry.scores[0] / maxY) * height;
      const yB = marginTop + height - (entry.scores[1] / maxY) * height;
      return {
        ...entry,
        x,
        yA,
        yB
      };
    });

    // Construct SVG path strings
    const pathA = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yA.toFixed(1)}`).join(' ');
    const pathB = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yB.toFixed(1)}`).join(' ');

    const areaA = `${pathA} L ${points[points.length - 1].x.toFixed(1)} ${(marginTop + height).toFixed(1)} L ${marginLeft.toFixed(1)} ${(marginTop + height).toFixed(1)} Z`;
    const areaB = `${pathB} L ${points[points.length - 1].x.toFixed(1)} ${(marginTop + height).toFixed(1)} L ${marginLeft.toFixed(1)} ${(marginTop + height).toFixed(1)} Z`;

    // Target score horizontal line position
    const targetY = marginTop + height - (targetScore / maxY) * height;

    return (
      <div className="relative w-full overflow-visible">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id={isExpandedView ? "gradientTeamA_exp" : "gradientTeamA"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={isExpandedView ? "gradientTeamB_exp" : "gradientTeamB"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = marginTop + height * (1 - ratio);
            const val = Math.round(maxY * ratio);
            return (
              <g key={idx}>
                <line
                  x1={marginLeft}
                  y1={y}
                  x2={marginLeft + width}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray="3 3"
                />
                <text
                  x={marginLeft - 6}
                  y={y + 3}
                  fill="rgba(255,255,255,0.45)"
                  fontSize={isExpandedView ? "11" : "9"}
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Target score line */}
          {targetY >= marginTop - 5 && targetY <= marginTop + height + 5 && (
            <g>
              <line
                x1={marginLeft}
                y1={targetY}
                x2={marginLeft + width}
                y2={targetY}
                stroke="#ef4444"
                strokeWidth={isExpandedView ? "2" : "1.5"}
                strokeDasharray="4 4"
                opacity="0.85"
              />
              <text
                x={marginLeft + width + 4}
                y={targetY + 3}
                fill="#ef4444"
                fontSize={isExpandedView ? "10" : "8"}
                fontWeight="bold"
                fontFamily="monospace"
              >
                TARGET ({targetScore})
              </text>
            </g>
          )}

          {/* Filled Area Gradients */}
          <motion.path
            d={areaA}
            fill={`url(#${isExpandedView ? "gradientTeamA_exp" : "gradientTeamA"})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
          <motion.path
            d={areaB}
            fill={`url(#${isExpandedView ? "gradientTeamB_exp" : "gradientTeamB"})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Animated Line Team B */}
          <motion.path
            d={pathB}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth={isExpandedView ? "4" : "3"}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Animated Line Team A */}
          <motion.path
            d={pathA}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={isExpandedView ? "4" : "3"}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Interactive Hover Columns & Data Points */}
          {points.map((p, idx) => {
            const isHovered = hoveredPoint?.round === p.round;
            const columnWidth = width / totalRounds;
            const clickAreaX = p.x - columnWidth / 2;

            return (
              <g
                key={idx}
                className="cursor-pointer group"
                onMouseEnter={() =>
                  setHoveredPoint({
                    round: p.round,
                    teamAScore: p.scores[0],
                    teamBScore: p.scores[1],
                    winnerTeam: p.winnerTeam,
                    pointsEarned: p.pointsEarned,
                    x: p.x,
                    yA: p.yA,
                    yB: p.yB
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Transparent hit area for hover ease */}
                <rect
                  x={Math.max(marginLeft, clickAreaX)}
                  y={marginTop}
                  width={Math.min(width, columnWidth)}
                  height={height}
                  fill="transparent"
                />

                {/* Vertical connector line for round */}
                <line
                  x1={p.x}
                  y1={marginTop}
                  x2={p.x}
                  y2={marginTop + height}
                  stroke={isHovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}
                  strokeWidth={isHovered ? "1.5" : "1"}
                  strokeDasharray="2 2"
                />

                {/* X Axis Round Labels */}
                <text
                  x={p.x}
                  y={marginTop + height + (isExpandedView ? 20 : 16)}
                  fill={isHovered ? "#ffffff" : "rgba(255,255,255,0.5)"}
                  fontSize={isExpandedView ? "11" : "9"}
                  fontWeight={isHovered ? "bold" : "normal"}
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {p.round === 0 ? 'START' : `R${p.round}`}
                </text>

                {/* Team B Circle Point */}
                <motion.circle
                  cx={p.x}
                  cy={p.yB}
                  r={isHovered ? (isExpandedView ? '8' : '6') : (isExpandedView ? '5' : '4')}
                  fill="#111113"
                  stroke="#2dd4bf"
                  strokeWidth={isHovered ? "3" : "2.5"}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 + idx * 0.08, duration: 0.25 }}
                />

                {/* Team A Circle Point */}
                <motion.circle
                  cx={p.x}
                  cy={p.yA}
                  r={isHovered ? (isExpandedView ? '8' : '6') : (isExpandedView ? '5' : '4')}
                  fill="#111113"
                  stroke="#fbbf24"
                  strokeWidth={isHovered ? "3" : "2.5"}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 + idx * 0.08, duration: 0.25 }}
                />

                {/* Score text label above point if last or round win */}
                {p.round > 0 && (
                  <>
                    <text
                      x={p.x}
                      y={p.yA - (isExpandedView ? 10 : 7)}
                      fill="#fbbf24"
                      fontSize={isExpandedView ? "10" : "8"}
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {p.scores[0]}
                    </text>
                    <text
                      x={p.x}
                      y={p.yB + (isExpandedView ? 16 : 13)}
                      fill="#2dd4bf"
                      fontSize={isExpandedView ? "10" : "8"}
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {p.scores[1]}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip - Smart Positioned & High Contrast */}
        {hoveredPoint && (() => {
          const minPointY = Math.min(hoveredPoint.yA, hoveredPoint.yB);
          const isTopHalf = minPointY < marginTop + height * 0.45;
          const leftPercent = (hoveredPoint.x / svgWidth) * 100;
          // Clamp left percentage to avoid screen clipping
          const clampedLeft = Math.max(18, Math.min(82, leftPercent));

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              className={`absolute z-50 pointer-events-none bg-[#18181b] border-2 border-[#fbbf24]/50 rounded-xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.9)] font-mono text-xs space-y-1.5 min-w-[170px] transform -translate-x-1/2 ${
                isTopHalf ? 'translate-y-4 top-full' : '-translate-y-full -mt-4'
              }`}
              style={{
                left: `${clampedLeft}%`,
                top: `${(minPointY / svgHeight) * 100}%`
              }}
            >
              <div className="text-[11px] font-bold text-white border-b border-white/15 pb-1 flex items-center justify-between gap-3">
                <span className="uppercase text-[#fbbf24]">
                  {hoveredPoint.round === 0 ? 'Game Start' : `Round ${hoveredPoint.round}`}
                </span>
                {hoveredPoint.winnerTeam !== undefined && hoveredPoint.winnerTeam !== null && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    hoveredPoint.winnerTeam === 0 ? 'bg-[#fbbf24]/20 text-[#fbbf24]' : 'bg-teal-400/20 text-teal-400'
                  }`}>
                    +{hoveredPoint.pointsEarned || 0} PTS
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 text-xs font-bold">
                <span className="text-[#fbbf24] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                  {teamAName}:
                </span>
                <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{hoveredPoint.teamAScore} pts</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-xs font-bold">
                <span className="text-teal-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  {teamBName}:
                </span>
                <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{hoveredPoint.teamBScore} pts</span>
              </div>
            </motion.div>
          );
        })()}
      </div>
    );
  };

  return (
    <>
      <div className="w-full bg-[#111113] border border-white/10 rounded-xl p-3 sm:p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/20 flex items-center justify-center text-[#fbbf24]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Score History
              </h4>
              <p className="text-[10px] font-mono text-white/40">Point progression per round</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-2.5 font-mono text-[10px] mr-1">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                <span className="text-[#fbbf24] font-bold">{teamAName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-teal-400 font-bold">{teamBName}</span>
              </div>
            </div>

            {/* Expand Fullscreen Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono"
              title="Expand point graph"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span className="hidden xs:inline uppercase">Expand</span>
            </button>
          </div>
        </div>

        {/* Chart View */}
        {renderChart(false)}

        {/* Round Breakdown Summary */}
        <div className="pt-1 flex items-center justify-between font-mono text-[10px] text-white/40 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>Rounds: <strong className="text-white">{history.length - 1}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-teal-400" />
            <span>Leader: <strong className={currentScores[0] >= currentScores[1] ? 'text-[#fbbf24]' : 'text-teal-400'}>
              {currentScores[0] > currentScores[1] ? teamAName : currentScores[1] > currentScores[0] ? teamBName : 'Tied'}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Expanded Fullscreen Graph Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-4xl bg-[#141417] border border-white/15 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fbbf24]/10 border border-[#fbbf24]/20 flex items-center justify-center text-[#fbbf24]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-mono font-bold text-white uppercase tracking-wider">
                      Detailed Score History & Point Progression
                    </h3>
                    <p className="text-xs font-mono text-white/50">
                      Target Score: <strong className="text-[#ef4444]">{targetScore} pts</strong> • Total Rounds: <strong className="text-white">{history.length - 1}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Legend */}
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-lg">
                      <span className="w-3 h-3 rounded-full bg-[#fbbf24]" />
                      <span className="text-[#fbbf24] font-bold">{teamAName} ({currentScores[0]} pts)</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-400/10 border border-teal-400/20 rounded-lg">
                      <span className="w-3 h-3 rounded-full bg-teal-400" />
                      <span className="text-teal-400 font-bold">{teamBName} ({currentScores[1]} pts)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Chart Rendering */}
              <div className="bg-[#0e0e10] p-4 sm:p-6 rounded-xl border border-white/10 shadow-inner">
                {renderChart(true)}
              </div>

              {/* Round by Round Score Table Breakdown */}
              <div className="bg-[#0e0e10] border border-white/10 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
                  Round-by-Round Breakdown
                </h4>
                <div className="max-h-48 overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left font-mono text-xs text-white/70">
                    <thead className="text-[10px] uppercase text-white/40 border-b border-white/5 sticky top-0 bg-[#0e0e10]">
                      <tr>
                        <th className="py-2 px-3">Round</th>
                        <th className="py-2 px-3 text-[#fbbf24]">{teamAName}</th>
                        <th className="py-2 px-3 text-teal-400">{teamBName}</th>
                        <th className="py-2 px-3">Round Winner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map((h, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-bold text-white/90">
                            {h.round === 0 ? 'Start' : `Round ${h.round}`}
                          </td>
                          <td className="py-2 px-3 text-[#fbbf24] font-bold">
                            {h.scores[0]} pts
                          </td>
                          <td className="py-2 px-3 text-teal-400 font-bold">
                            {h.scores[1]} pts
                          </td>
                          <td className="py-2 px-3">
                            {h.round === 0 ? (
                              <span className="text-white/30">Init</span>
                            ) : h.winnerTeam === 0 ? (
                              <span className="text-[#fbbf24] font-bold">+{h.pointsEarned || 0} pts ({teamAName})</span>
                            ) : h.winnerTeam === 1 ? (
                              <span className="text-teal-400 font-bold">+{h.pointsEarned || 0} pts ({teamBName})</span>
                            ) : (
                              <span className="text-amber-400/80">Tie / Trancado (0 pts)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-[#fbbf24] hover:bg-[#fbbf24]/90 text-[#111113] font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg uppercase tracking-wider"
                >
                  Close Analytics
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

