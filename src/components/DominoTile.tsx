import React from 'react';
import { motion } from 'motion/react';

interface DominoTileProps {
  val1: number;
  val2: number;
  isDouble?: boolean;
  highlighted?: boolean;
  playable?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}

const pipPositions: { [key: number]: number[] } = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

const PipGrid: React.FC<{ value: number; sizeClass: string }> = ({ value, sizeClass }) => {
  const activePips = pipPositions[value] || [];
  
  return (
    <div className={`grid grid-cols-3 grid-rows-3 gap-[1px] w-full h-full p-[3px] aspect-square relative`}>
      {Array.from({ length: 9 }).map((_, idx) => {
        const isActive = activePips.includes(idx);
        return (
          <div key={idx} className="flex items-center justify-center w-full h-full">
            {isActive && (
              <div 
                className={`rounded-full bg-[#32170d] shadow-inner transition-all duration-300 ${
                  sizeClass === 'sm' ? 'w-[3px] h-[3px]' : 
                  sizeClass === 'md' ? 'w-[5px] h-[5px]' : 'w-[7px] h-[7px]'
                }`}
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)'
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const DominoTile: React.FC<DominoTileProps> = ({
  val1,
  val2,
  isDouble = false,
  highlighted = false,
  playable = false,
  onClick,
  className = '',
  size = 'md',
  orientation,
}) => {
  // Dimensions based on size
  const sizeClasses = {
    sm: {
      tile: 'w-[24px] h-[48px]',
      tileDouble: 'w-[48px] h-[24px]',
      border: 'rounded-[3px] border',
      fontSize: 'text-[8px]',
      spinner: 'w-[3px] h-[3px]',
      pipSize: 'sm'
    },
    md: {
      tile: 'w-[36px] h-[72px]',
      tileDouble: 'w-[72px] h-[36px]',
      border: 'rounded-[6px] border-[2px]',
      fontSize: 'text-[12px]',
      spinner: 'w-[4.5px] h-[4.5px]',
      pipSize: 'md'
    },
    lg: {
      tile: 'w-[54px] h-[108px]',
      tileDouble: 'w-[108px] h-[54px]',
      border: 'rounded-[8px] border-[3px]',
      fontSize: 'text-[16px]',
      spinner: 'w-[6px] h-[6px]',
      pipSize: 'lg'
    }
  };

  const config = sizeClasses[size];

  // Ivory Vintage Cream color theme
  const baseBg = 'bg-[#fff9eb] text-[#1d1c13] border-[#d5c3bd] shadow-[0_6px_14px_rgba(0,0,0,0.35)]';
  const highlightedBg = 'bg-[#fff9eb] border-[#fe7328] ring-2 ring-[#fe7328] shadow-[0_8px_20px_rgba(254,115,40,0.3)]';
  const playableBg = 'bg-[#fff9eb] border-[#006876] hover:bg-[#fffdf7] cursor-pointer ring-2 ring-[#006876] hover:scale-105 active:scale-95 transition-all shadow-[0_8px_18px_rgba(0,104,118,0.25)]';
  const disabledBg = 'opacity-60 bg-[#eee8da] border-[#d5c3bd]';

  let currentBg = baseBg;
  if (highlighted) {
    currentBg = highlightedBg;
  } else if (playable) {
    currentBg = playableBg;
  } else if (onClick === undefined) {
    currentBg = disabledBg;
  }

  // Double tile is rendered horizontally with values side-by-side (Wait, let's keep vertical split for standard layout!)
  // If isDouble, layout split is horizontal (so left and right halves).
  // If regular, layout split is vertical (top and bottom halves).
  // Overridden if orientation is explicitly specified.
  const isVertical = orientation ? (orientation === 'vertical') : !isDouble;

  return (
    <motion.div
      whileHover={playable ? { scale: 1.05, y: -4 } : {}}
      whileTap={playable ? { scale: 0.95 } : {}}
      onClick={playable && onClick ? onClick : undefined}
      className={`relative select-none flex ${isVertical ? 'flex-col' : 'flex-row'} items-center justify-between ${
        isVertical ? config.tile : config.tileDouble
      } ${config.border} ${currentBg} ${className}`}
      id={`domino-${val1}-${val2}`}
    >
      {/* Half 1 */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-[2px]">
        <PipGrid value={val1} sizeClass={config.pipSize} />
      </div>

      {/* Dividing Line & Clavito/Spinner */}
      <div className={`relative ${isVertical ? 'w-full h-[1px]' : 'h-full w-[1px]'} bg-[#83746f]/40`}>
        {/* Cuban Clavito (metal spinner knob) at exact center */}
        <div 
          className={`absolute rounded-full border border-[#3b1200] shadow-sm transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 ${config.spinner}`}
          style={{ backgroundImage: 'radial-gradient(circle at 35% 35%, #fe7328, #3b1200)' }}
        />
      </div>

      {/* Half 2 */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-[2px]">
        <PipGrid value={val2} sizeClass={config.pipSize} />
      </div>
    </motion.div>
  );
};
