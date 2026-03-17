import {
  ArrowUp,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowUpLeft,
  CornerDownRight,
  CornerDownLeft,
  RotateCcw,
  GitMerge,
  CircleDot,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

export interface ValhallaStep {
  type?: number;
  instruction?: string;
  bearing_before?: number;
  bearing_after?: number;
}

function getDirectionFromBearing(
  before: number,
  after: number
): 'straight' | 'right' | 'left' | 'slight-right' | 'slight-left' {
  const diff = (after - before + 360) % 360;

  if (diff <= 10 || diff >= 350) return 'straight';
  if (diff <= 90) return 'slight-right';
  if (diff <= 180) return 'right';
  if (diff <= 270) return 'left';

  return 'slight-left';
}

export function getTurnIcon(step: ValhallaStep): LucideIcon {
  const text = step.instruction?.toLowerCase() || '';

  if (text.includes('u-turn')) return RotateCcw;
  if (text.includes('merge')) return GitMerge;

  if (text.includes('enter') && text.includes('exit')) {
    if (
      typeof step.bearing_before === 'number' &&
      typeof step.bearing_after === 'number'
    ) {
      const dir = getDirectionFromBearing(
        step.bearing_before,
        step.bearing_after
      );

      if (dir === 'right') return ArrowRight;
      if (dir === 'left') return ArrowLeft;
      if (dir === 'slight-right') return ArrowUpRight;
      if (dir === 'slight-left') return ArrowUpLeft;
    }

    return ArrowRight;
  }

  if (
    text.includes('exit') &&
    (text.includes('roundabout') || step.type === 15)
  ) {
    if (
      typeof step.bearing_before === 'number' &&
      typeof step.bearing_after === 'number'
    ) {
      const dir = getDirectionFromBearing(
        step.bearing_before,
        step.bearing_after
      );

      if (dir === 'right') return ArrowRight;
      if (dir === 'left') return ArrowLeft;
      if (dir === 'slight-right') return ArrowUpRight;
      if (dir === 'slight-left') return ArrowUpLeft;
    }

    return ArrowRight;
  }

  if (
    text.includes('exit') &&
    typeof step.bearing_before === 'number' &&
    typeof step.bearing_after === 'number'
  ) {
    const dir = getDirectionFromBearing(
      step.bearing_before,
      step.bearing_after
    );

    if (dir === 'right') return ArrowRight;
    if (dir === 'left') return ArrowLeft;
    if (dir === 'slight-right') return ArrowUpRight;
    if (dir === 'slight-left') return ArrowUpLeft;
  }

  if (
    text.includes('enter') &&
    (text.includes('roundabout') || step.type === 15)
  ) {
    return CircleDot;
  }

  if (text.includes('sharp right')) return CornerDownRight;
  if (text.includes('sharp left')) return CornerDownLeft;
  if (
    text.includes('slight right') ||
    text.includes('bear right') ||
    text.includes('keep right')
  )
    return ArrowUpRight;

  if (
    text.includes('slight left') ||
    text.includes('bear left') ||
    text.includes('keep left')
  )
    return ArrowUpLeft;

  if (text.includes('right')) return ArrowRight;
  if (text.includes('straight') || text.includes('continue')) return ArrowUp;

  return ArrowUp;
}
