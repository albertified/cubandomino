import React from 'react';
import { motion } from 'motion/react';
import { FichaThemeId, FICHA_THEMES } from '../utils/themes';

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
  fichaTheme?: FichaThemeId;
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

const PipGrid: React.FC<{ value: number; sizeClass: string; pipColor?: string }> = ({ value, sizeClass, pipColor }) => {
  const activePips = pipPositions[value] || [];
  
  return (
    <div className={`grid grid-cols-3 grid-rows-3 gap-[1px] w-full h-full p-[3px] aspect-square relative`}>
      {Array.from({ length: 9 }).map((_, idx) => {
        const isActive = activePips.includes(idx);
        return (
          <div key={idx} className="flex items-center justify-center w-full h-full">
            {isActive && (
              <div 
                className={`rounded-full shadow-inner transition-all duration-300 ${
                  sizeClass === 'sm' ? 'w-[3px] h-[3px]' : 
                  sizeClass === 'md' ? 'w-[5px] h-[5px]' : 'w-[7px] h-[7px]'
                }`}
                style={{
                  backgroundColor: pipColor || '#32170d',
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
  fichaTheme = 'havana',
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
  const theme = FICHA_THEMES[fichaTheme] || FICHA_THEMES.havana;

  // Custom theme background & border states
  const baseBg = theme.tileBgClass;
  const highlightedBg = `${theme.tileBgClass} ${theme.highlightBorder}`;
  const playableBg = `${theme.tileBgClass} ${theme.playableRing}`;
  const disabledBg = `opacity-60 ${theme.tileBgClass}`;

  let currentBg = baseBg;
  if (highlighted) {
    currentBg = highlightedBg;
  } else if (playable) {
    currentBg = playableBg;
  } else if (onClick === undefined) {
    currentBg = disabledBg;
  }

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
        <PipGrid value={val1} sizeClass={config.pipSize} pipColor={theme.pipColor} />
      </div>

      {/* Dividing Line & Clavito/Spinner */}
      <div className={`relative ${isVertical ? 'w-full h-[1px]' : 'h-full w-[1px]'} bg-current opacity-30`}>
        {/* Cuban Clavito (metal spinner knob) at exact center */}
        <div 
          className={`absolute rounded-full border border-black/40 shadow-sm transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 ${config.spinner}`}
          style={{ backgroundImage: theme.spinnerGradient }}
        />
      </div>

      {/* Half 2 */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-[2px]">
        <PipGrid value={val2} sizeClass={config.pipSize} pipColor={theme.pipColor} />
      </div>
    </motion.div>
  );
};
