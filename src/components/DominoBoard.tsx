import React, { useRef, useState, useEffect } from 'react';
import { Domino } from '../types';
import { layoutBoard } from '../utils/dominoLayout';
import { DominoTile } from './DominoTile';
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { BoardThemeId, FichaThemeId, BOARD_THEMES } from '../utils/themes';

interface DominoBoardProps {
  board: Domino[];
  firstTileIndex: number;
  onPlaySelect?: (side: 'left' | 'right') => void;
  pendingPlaySideSelection?: boolean; // True if the user clicked a playable card and we need to ask left or right
  boardTheme?: BoardThemeId;
  fichaTheme?: FichaThemeId;
}

export const DominoBoard: React.FC<DominoBoardProps> = ({
  board,
  firstTileIndex,
  onPlaySelect,
  pendingPlaySideSelection = false,
  boardTheme = 'havana',
  fichaTheme = 'havana',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activeBoardTheme = BOARD_THEMES[boardTheme] || BOARD_THEMES.havana;

  // Monitor container size
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Recenter and reset zoom whenever the board length changes
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1.0);
  }, [board.length]);

  // Handle Wheel Zoom non-passively
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = 1.15;
      setZoomScale((prev) => {
        let newScale = prev;
        if (e.deltaY < 0) {
          newScale = Math.min(prev * scaleFactor, 3.0);
        } else {
          newScale = Math.max(prev / scaleFactor, 0.3);
        }
        return newScale;
      });
    };

    container.addEventListener('wheel', handleWheelRaw, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelRaw);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click drags
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setPanOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1.0);
  };

  const positions = layoutBoard(board, firstTileIndex);

  // Compute bounding box and translate to center
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;

  if (positions.length > 0) {
    minX = positions[0].x;
    maxX = positions[0].x;
    minY = positions[0].y;
    maxY = positions[0].y;

    positions.forEach((pos) => {
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.y > maxY) maxY = pos.y;
    });
  }

  const bBoxCenterX = (minX + maxX) / 2;
  const bBoxCenterY = (minY + maxY) / 2;

  // Center of the physical viewport
  const viewCenterX = dimensions.width / 2;
  const viewCenterY = dimensions.height / 2;

  // Offset to center the bounding box
  const offsetX = viewCenterX - bBoxCenterX;
  const offsetY = viewCenterY - bBoxCenterY;

  // Get offset for left choice button (which attaches to positions[0])
  const getLeftButtonPosition = () => {
    if (positions.length === 0) return { x: 0, y: 0 };
    const firstPos = positions[0];
    const firstOrient = firstPos.orientation;
    const S = 36;
    const L = 72;
    const dist = (firstOrient === 'horizontal' ? L / 2 : S / 2) + 40; // 40px padding for the button
    
    if (firstPos.dir === 'left') return { x: firstPos.x - dist, y: firstPos.y };
    if (firstPos.dir === 'right') return { x: firstPos.x + dist, y: firstPos.y };
    if (firstPos.dir === 'up') return { x: firstPos.x, y: firstPos.y - dist };
    if (firstPos.dir === 'down') return { x: firstPos.x, y: firstPos.y + dist };
    return { x: firstPos.x - 60, y: firstPos.y };
  };

  // Get offset for right choice button (which attaches to positions[positions.length - 1])
  const getRightButtonPosition = () => {
    if (positions.length === 0) return { x: 0, y: 0 };
    const lastPos = positions[positions.length - 1];
    const lastOrient = lastPos.orientation;
    const S = 36;
    const L = 72;
    const dist = (lastOrient === 'horizontal' ? L / 2 : S / 2) + 40;
    
    if (lastPos.dir === 'left') return { x: lastPos.x - dist, y: lastPos.y };
    if (lastPos.dir === 'right') return { x: lastPos.x + dist, y: lastPos.y };
    if (lastPos.dir === 'up') return { x: lastPos.x, y: lastPos.y - dist };
    if (lastPos.dir === 'down') return { x: lastPos.x, y: lastPos.y + dist };
    return { x: lastPos.x + 60, y: lastPos.y };
  };

  const leftButtonPos = getLeftButtonPosition();
  const rightButtonPos = getRightButtonPosition();

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full rounded-sm shadow-2xl border-[16px] md:border-[22px] overflow-hidden flex items-center justify-center min-h-[360px] md:min-h-[420px] select-none transition-colors duration-500 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        borderColor: activeBoardTheme.frameBorder,
        backgroundImage: activeBoardTheme.feltBg,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 35px rgba(0,0,0,0.6)'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      {/* Felt Board texture */}
      <div className="absolute inset-0 opacity-25 pointer-events-none bg-repeat transition-all duration-500" style={{
        backgroundImage: activeBoardTheme.svgPattern,
        backgroundSize: '40px 40px'
      }} />

      {/* Interaction Hint */}
      <div className="absolute top-4 left-4 pointer-events-none opacity-60 text-[9px] md:text-xs font-mono text-white/90 flex items-center gap-1.5 select-none z-10 bg-black/60 px-2.5 py-1 rounded border border-white/20 backdrop-blur-sm shadow-md">
        <span>🖱️ Drag to Pan</span>
        <span>•</span>
        <span>🎡 Scroll to Zoom</span>
        <span>•</span>
        <span>Double-click to Reset</span>
      </div>

      {board.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-white/70 text-center p-6 space-y-3 z-10 select-none">
          <div className="w-16 h-16 rounded-full border border-dashed border-white/30 flex items-center justify-center text-2xl font-bold font-sans shadow-lg">
            9|9
          </div>
          <div>
            <p className="font-sans font-medium text-white/90 text-sm md:text-base">{activeBoardTheme.name}</p>
            <p className="text-xs text-white/60 max-w-xs mt-1">Play the first tile of the round to begin the chain of play.</p>
          </div>
        </div>
      ) : (
        <div 
          className="absolute left-0 top-0 transition-all duration-300 ease-out"
          style={{
            transform: `translate(${offsetX + panOffset.x}px, ${offsetY + panOffset.y}px) scale(${zoomScale})`,
            transformOrigin: '0 0',
            width: '1px',
            height: '1px',
          }}
        >
          {positions.map((pos, idx) => {
            const tile = board[idx];
            const isLastPlayed = idx === 0 || idx === board.length - 1;
            
            let val1 = tile[0];
            let val2 = tile[1];

            // Decide whether to swap val1 and val2 based on flow direction to match pips
            if (idx > firstTileIndex) {
              if (pos.dir === 'left' || pos.dir === 'up') {
                val1 = tile[1];
                val2 = tile[0];
              }
            } else if (idx < firstTileIndex) {
              if (pos.dir === 'right' || pos.dir === 'down') {
                val1 = tile[1];
                val2 = tile[0];
              }
            }

            return (
              <div
                key={idx}
                className="absolute transition-all duration-500"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: `translate(-50%, -50%) rotate(${pos.angle}deg)`,
                  zIndex: isLastPlayed ? 30 : 20,
                }}
              >
                <DominoTile
                  val1={val1}
                  val2={val2}
                  isDouble={pos.isDouble}
                  highlighted={isLastPlayed}
                  orientation={pos.orientation}
                  size="md"
                  fichaTheme={fichaTheme}
                />
              </div>
            );
          })}

          {/* Left / Right Placement Overlays (Only visible when user has pending action) */}
          {pendingPlaySideSelection && onPlaySelect && (
            <>
              {/* Left choice button */}
              {positions.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySelect('left');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="absolute p-3 rounded-md bg-[#006876] hover:bg-[#007a8a] text-white font-mono font-bold uppercase tracking-wider shadow-xl border border-[#8debfd]/40 flex items-center gap-1.5 hover:scale-110 active:scale-95 transition-all z-40"
                  style={{
                    left: `${leftButtonPos.x}px`,
                    top: `${leftButtonPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(0,104,118,0.4)'
                  }}
                  title="Play on Left"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-xs pr-1">LEFT</span>
                </button>
              )}

              {/* Right choice button */}
              {positions.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlaySelect('right');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="absolute p-3 rounded-md bg-[#006876] hover:bg-[#007a8a] text-white font-mono font-bold uppercase tracking-wider shadow-xl border border-[#8debfd]/40 flex items-center gap-1.5 hover:scale-110 active:scale-95 transition-all z-40"
                  style={{
                    left: `${rightButtonPos.x}px`,
                    top: `${rightButtonPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(0,104,118,0.4)'
                  }}
                  title="Play on Right"
                >
                  <span className="text-xs pl-1">RIGHT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Zoom Controls */}
      {board.length > 0 && (
        <div 
          className="absolute bottom-4 right-4 flex flex-col gap-2 z-50"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setZoomScale((prev) => Math.min(prev * 1.2, 3.0))}
            className="p-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/50 shadow-lg hover:scale-105 active:scale-95 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomScale((prev) => Math.max(prev / 1.2, 0.3))}
            className="p-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/50 shadow-lg hover:scale-105 active:scale-95 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleDoubleClick}
            className="p-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/50 shadow-lg hover:scale-105 active:scale-95 transition-all"
            title="Recenter / Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
