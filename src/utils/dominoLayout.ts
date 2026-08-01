import { Domino } from '../types';

export interface LayoutPosition {
  x: number;
  y: number;
  angle: number;
  isDouble: boolean;
  dir: string;
  orientation: 'horizontal' | 'vertical';
}

const S_SIZES = { sm: 24, md: 36, lg: 54 };
const L_SIZES = { sm: 48, md: 72, lg: 108 };

const ROW_LIMIT = 6;

function getRightDirectionDynamic(k: number, _numLeft: number, _numRight: number): string {
  if (k < ROW_LIMIT) return 'right';
  if (k < ROW_LIMIT + 2) return 'down';
  
  const h_len = ROW_LIMIT * 2; // 12 tiles span across the screen
  if (k < ROW_LIMIT + 2 + h_len) return 'left';
  if (k < ROW_LIMIT + 2 + h_len + 2) return 'down';

  const kPrime = k - (ROW_LIMIT + 2 + h_len + 2);
  const cycleLen = h_len + 2; // 14
  const cycle = Math.floor(kPrime / cycleLen);
  const offset = kPrime % cycleLen;

  if (offset < h_len) {
    return cycle % 2 === 0 ? 'right' : 'left';
  }
  return 'down';
}

function getLeftDirectionDynamic(k: number, _numLeft: number, _numRight: number): string {
  if (k < ROW_LIMIT) return 'left';
  if (k < ROW_LIMIT + 2) return 'up';
  
  const h_len = ROW_LIMIT * 2; // 12 tiles span across the screen
  if (k < ROW_LIMIT + 2 + h_len) return 'right';
  if (k < ROW_LIMIT + 2 + h_len + 2) return 'up';

  const kPrime = k - (ROW_LIMIT + 2 + h_len + 2);
  const cycleLen = h_len + 2; // 14
  const cycle = Math.floor(kPrime / cycleLen);
  const offset = kPrime % cycleLen;

  if (offset < h_len) {
    return cycle % 2 === 0 ? 'left' : 'right';
  }
  return 'up';
}

function calculateOffset(
  prevDir: string,
  currDir: string,
  prevOrient: 'horizontal' | 'vertical',
  currOrient: 'horizontal' | 'vertical',
  S: number,
  L: number
): { dx: number; dy: number } {
  const prevW = prevOrient === 'horizontal' ? L : S;
  const prevH = prevOrient === 'horizontal' ? S : L;
  const currW = currOrient === 'horizontal' ? L : S;
  const currH = currOrient === 'horizontal' ? S : L;

  if (currDir === 'right') {
    const dx = prevW / 2 + currW / 2;
    let dy = 0;
    if (prevDir === 'up') dy = -(prevH / 2 - currH / 2);
    else if (prevDir === 'down') dy = prevH / 2 - currH / 2;
    return { dx, dy };
  }

  if (currDir === 'left') {
    const dx = -(prevW / 2 + currW / 2);
    let dy = 0;
    if (prevDir === 'up') dy = -(prevH / 2 - currH / 2);
    else if (prevDir === 'down') dy = prevH / 2 - currH / 2;
    return { dx, dy };
  }

  if (currDir === 'down') {
    const dy = prevH / 2 + currH / 2;
    let dx = 0;
    if (prevDir === 'right') dx = prevW / 2 - currW / 2;
    else if (prevDir === 'left') dx = -(prevW / 2 - currW / 2);
    return { dx, dy };
  }

  if (currDir === 'up') {
    const dy = -(prevH / 2 + currH / 2);
    let dx = 0;
    if (prevDir === 'right') dx = prevW / 2 - currW / 2;
    else if (prevDir === 'left') dx = -(prevW / 2 - currW / 2);
    return { dx, dy };
  }

  return { dx: 0, dy: 0 };
}

export function layoutBoard(
  chain: Domino[],
  firstTileIndex: number,
  size: 'sm' | 'md' | 'lg' = 'md'
): LayoutPosition[] {
  if (chain.length === 0) return [];

  const S = S_SIZES[size];
  const L = L_SIZES[size];

  const positions: LayoutPosition[] = new Array(chain.length);

  // Base tile at center
  const firstIsDouble = chain[firstTileIndex][0] === chain[firstTileIndex][1];
  positions[firstTileIndex] = {
    x: 0,
    y: 0,
    angle: 0,
    isDouble: firstIsDouble,
    dir: 'right',
    orientation: firstIsDouble ? 'vertical' : 'horizontal',
  };

  const numLeft = firstTileIndex;
  const numRight = chain.length - 1 - firstTileIndex;

  // Right Branch (growing from firstTileIndex + 1 onwards)
  for (let i = firstTileIndex + 1; i < chain.length; i++) {
    const prevPos = positions[i - 1];
    const currTile = chain[i];

    const currIsDouble = currTile[0] === currTile[1];

    const k = i - (firstTileIndex + 1);
    const curr_dir = getRightDirectionDynamic(k, numLeft, numRight);
    const prev_dir = i === firstTileIndex + 1 ? 'right' : prevPos.dir;

    // Determine orientation of current tile
    let curr_orient: 'horizontal' | 'vertical';
    if (currIsDouble) {
      curr_orient = (curr_dir === 'down' || curr_dir === 'up') ? 'horizontal' : 'vertical';
    } else {
      curr_orient = (curr_dir === 'right' || curr_dir === 'left') ? 'horizontal' : 'vertical';
    }

    // Calculate dx and dy
    const { dx, dy } = calculateOffset(prev_dir, curr_dir, prevPos.orientation, curr_orient, S, L);

    const x = prevPos.x + dx;
    const y = prevPos.y + dy;

    positions[i] = { x, y, angle: 0, isDouble: currIsDouble, dir: curr_dir, orientation: curr_orient };
  }

  // Left Branch (growing from firstTileIndex - 1 downwards to 0)
  for (let i = firstTileIndex - 1; i >= 0; i--) {
    const prevPos = positions[i + 1]; // Reference is tile at i + 1
    const currTile = chain[i];

    const currIsDouble = currTile[0] === currTile[1];

    const k = firstTileIndex - 1 - i;
    const curr_dir = getLeftDirectionDynamic(k, numLeft, numRight);
    const prev_dir = i === firstTileIndex - 1 ? 'left' : prevPos.dir;

    // Determine orientation of current tile
    let curr_orient: 'horizontal' | 'vertical';
    if (currIsDouble) {
      curr_orient = (curr_dir === 'down' || curr_dir === 'up') ? 'horizontal' : 'vertical';
    } else {
      curr_orient = (curr_dir === 'right' || curr_dir === 'left') ? 'horizontal' : 'vertical';
    }

    // Calculate dx and dy
    const { dx, dy } = calculateOffset(prev_dir, curr_dir, prevPos.orientation, curr_orient, S, L);

    const x = prevPos.x + dx;
    const y = prevPos.y + dy;

    positions[i] = { x, y, angle: 0, isDouble: currIsDouble, dir: curr_dir, orientation: curr_orient };
  }

  return positions;
}
