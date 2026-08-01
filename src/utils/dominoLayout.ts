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

function computeBranchDirections(branchTiles: Domino[], isLeftBranch: boolean): string[] {
  const directions: string[] = [];
  let currentSegmentIndex = 0;
  let countInCurrentSegment = 0;

  for (let i = 0; i < branchTiles.length; i++) {
    const tile = branchTiles[i];
    const isDouble = tile[0] === tile[1];

    let targetLength: number;
    if (currentSegmentIndex === 0) {
      targetLength = ROW_LIMIT;
    } else if (currentSegmentIndex % 2 === 0) {
      targetLength = ROW_LIMIT * 2;
    } else {
      targetLength = 2;
    }

    if (countInCurrentSegment >= targetLength) {
      if (isDouble) {
        // If the chain needs to bend with a double, extend the chain prior to the bend by one domino
        countInCurrentSegment++;
      } else {
        currentSegmentIndex++;
        countInCurrentSegment = 1;
      }
    } else {
      countInCurrentSegment++;
    }

    let dir: string;
    if (!isLeftBranch) {
      if (currentSegmentIndex % 2 === 0) {
        dir = (Math.floor(currentSegmentIndex / 2) % 2 === 0) ? 'right' : 'left';
      } else {
        dir = 'down';
      }
    } else {
      if (currentSegmentIndex % 2 === 0) {
        dir = (Math.floor(currentSegmentIndex / 2) % 2 === 0) ? 'left' : 'right';
      } else {
        dir = 'up';
      }
    }

    directions.push(dir);
  }

  return directions;
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

  // Right Branch (growing from firstTileIndex + 1 onwards)
  if (firstTileIndex + 1 < chain.length) {
    const rightTiles = chain.slice(firstTileIndex + 1);
    const rightDirs = computeBranchDirections(rightTiles, false);

    for (let k = 0; k < rightTiles.length; k++) {
      const i = firstTileIndex + 1 + k;
      const prevPos = positions[i - 1];
      const currTile = chain[i];
      const currIsDouble = currTile[0] === currTile[1];

      const curr_dir = rightDirs[k];
      const prev_dir = k === 0 ? 'right' : prevPos.dir;

      let curr_orient: 'horizontal' | 'vertical';
      if (currIsDouble) {
        curr_orient = (curr_dir === 'down' || curr_dir === 'up') ? 'horizontal' : 'vertical';
      } else {
        curr_orient = (curr_dir === 'right' || curr_dir === 'left') ? 'horizontal' : 'vertical';
      }

      const { dx, dy } = calculateOffset(prev_dir, curr_dir, prevPos.orientation, curr_orient, S, L);

      const x = prevPos.x + dx;
      const y = prevPos.y + dy;

      positions[i] = { x, y, angle: 0, isDouble: currIsDouble, dir: curr_dir, orientation: curr_orient };
    }
  }

  // Left Branch (growing from firstTileIndex - 1 downwards to 0)
  if (firstTileIndex - 1 >= 0) {
    const leftTiles = chain.slice(0, firstTileIndex).reverse();
    const leftDirs = computeBranchDirections(leftTiles, true);

    for (let k = 0; k < leftTiles.length; k++) {
      const i = firstTileIndex - 1 - k;
      const prevPos = positions[i + 1];
      const currTile = chain[i];
      const currIsDouble = currTile[0] === currTile[1];

      const curr_dir = leftDirs[k];
      const prev_dir = k === 0 ? 'left' : prevPos.dir;

      let curr_orient: 'horizontal' | 'vertical';
      if (currIsDouble) {
        curr_orient = (curr_dir === 'down' || curr_dir === 'up') ? 'horizontal' : 'vertical';
      } else {
        curr_orient = (curr_dir === 'right' || curr_dir === 'left') ? 'horizontal' : 'vertical';
      }

      const { dx, dy } = calculateOffset(prev_dir, curr_dir, prevPos.orientation, curr_orient, S, L);

      const x = prevPos.x + dx;
      const y = prevPos.y + dy;

      positions[i] = { x, y, angle: 0, isDouble: currIsDouble, dir: curr_dir, orientation: curr_orient };
    }
  }

  return positions;
}
