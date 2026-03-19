import { describe, it, expect } from 'vitest';

import {
  getTurnIcon,
  type ValhallaDirectionType,
  type ValhallaStep,
  VALHALLA_DIRECTION_TYPE,
} from './get-direction-icon';

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

  it('returns U-turn icon for right u-turn type', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kUturnRight }))
    ).toBe(RotateCcw);
  });

  it('returns U-turn icon for left u-turn type', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kUturnLeft }))
    ).toBe(RotateCcw);
  });

  it('returns merge icon', () => {
    expect(getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kMerge }))).toBe(
      GitMerge
    );
  });

  it('returns roundabout enter icon', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kRoundaboutEnter }))
    ).toBe(CircleDot);
  });

  it('returns sharp right icon', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kSharpRight }))
    ).toBe(CornerDownRight);
  });

  it('returns sharp left icon', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kSharpLeft }))
    ).toBe(CornerDownLeft);
  });

  it('returns slight right icon', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kSlightRight }))
    ).toBe(ArrowUpRight);
  });

  it('returns slight left icon', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kSlightLeft }))
    ).toBe(ArrowUpLeft);
  });

  it('returns right icon for right turn type', () => {
    expect(getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kRight }))).toBe(
      ArrowRight
    );
  });

  it('returns right icon for start-right type', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kStartRight }))
    ).toBe(ArrowRight);
  });

  it('returns left icon for left turn type', () => {
    expect(getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kLeft }))).toBe(
      ArrowLeft
    );
  });

  it('returns left icon for start-left type', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kStartLeft }))
    ).toBe(ArrowLeft);
  });

  it('returns straight icon for continue type', () => {
    expect(getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kContinue }))).toBe(
      ArrowUp
    );
  });

  it('returns straight icon for ramp-straight type', () => {
    expect(
      getTurnIcon(step({ type: VALHALLA_DIRECTION_TYPE.kRampStraight }))
    ).toBe(ArrowUp);
  });

  it('ignores instruction text and uses type mapping only', () => {
    expect(
      getTurnIcon(
        step({
          type: VALHALLA_DIRECTION_TYPE.kContinue,
          instruction: 'Make a sharp right now',
        })
      )
    ).toBe(ArrowUp);
  });

  it('returns default icon when type is missing', () => {
    expect(getTurnIcon(step({ instruction: 'Turn right onto road' }))).toBe(
      ArrowUp
    );
  });

  it('returns default icon when type is unknown', () => {
    expect(getTurnIcon(step({ type: 999 as ValhallaDirectionType }))).toBe(
      ArrowUp
    );
  });

  it('returns default icon when step is empty', () => {
    expect(getTurnIcon(step({}))).toBe(ArrowUp);
  });
});
