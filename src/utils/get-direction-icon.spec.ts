import { describe, it, expect } from 'vitest';

import { getTurnIcon, type ValhallaStep } from './get-direction-icon';

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

describe('getTurnIcon', () => {
  const step = (data: Partial<ValhallaStep>): ValhallaStep => data;

  it('returns U-turn icon', () => {
    expect(getTurnIcon(step({ instruction: 'Make a u-turn' }))).toBe(RotateCcw);
  });

  it('returns merge icon', () => {
    expect(getTurnIcon(step({ instruction: 'Merge onto highway' }))).toBe(
      GitMerge
    );
  });

  it('handles enter + exit roundabout as turn (right)', () => {
    expect(
      getTurnIcon(
        step({
          instruction: 'Enter the roundabout and take the 1st exit',
          bearing_before: 0,
          bearing_after: 90,
        })
      )
    ).toBe(ArrowUpRight);
  });

  it('handles exit roundabout using bearing (left)', () => {
    expect(
      getTurnIcon(
        step({
          instruction: 'Exit the roundabout',
          type: 15,
          bearing_before: 0,
          bearing_after: 260,
        })
      )
    ).toBe(ArrowLeft);
  });

  it('returns roundabout icon on enter', () => {
    expect(
      getTurnIcon(
        step({
          instruction: 'Enter the roundabout',
          type: 15,
        })
      )
    ).toBe(CircleDot);
  });

  it('returns sharp right icon', () => {
    expect(getTurnIcon(step({ instruction: 'Make a sharp right' }))).toBe(
      CornerDownRight
    );
  });

  it('returns sharp left icon', () => {
    expect(getTurnIcon(step({ instruction: 'Make a sharp left' }))).toBe(
      CornerDownLeft
    );
  });

  it('returns slight right icon (bear right)', () => {
    expect(getTurnIcon(step({ instruction: 'Bear right onto road' }))).toBe(
      ArrowUpRight
    );
  });

  it('returns slight left icon (keep left)', () => {
    expect(getTurnIcon(step({ instruction: 'Keep left to continue' }))).toBe(
      ArrowUpLeft
    );
  });

  it('returns right icon', () => {
    expect(getTurnIcon(step({ instruction: 'Turn right onto road' }))).toBe(
      ArrowRight
    );
  });

  it('returns left icon (via bearing exit fallback)', () => {
    expect(
      getTurnIcon(
        step({
          instruction: 'Exit something',
          bearing_before: 0,
          bearing_after: 270,
        })
      )
    ).toBe(ArrowLeft);
  });

  it('returns straight icon', () => {
    expect(getTurnIcon(step({ instruction: 'Continue straight' }))).toBe(
      ArrowUp
    );
  });

  it('returns default icon when no match', () => {
    expect(getTurnIcon(step({}))).toBe(ArrowUp);
  });
});
