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

export const VALHALLA_DIRECTION_TYPE = {
  kNone: 0,
  kStart: 1,
  kStartRight: 2,
  kStartLeft: 3,
  kDestination: 4,
  kDestinationRight: 5,
  kDestinationLeft: 6,
  kBecomes: 7,
  kContinue: 8,
  kSlightRight: 9,
  kRight: 10,
  kSharpRight: 11,
  kUturnRight: 12,
  kUturnLeft: 13,
  kSharpLeft: 14,
  kLeft: 15,
  kSlightLeft: 16,
  kRampStraight: 17,
  kRampRight: 18,
  kRampLeft: 19,
  kExitRight: 20,
  kExitLeft: 21,
  kStayStraight: 22,
  kStayRight: 23,
  kStayLeft: 24,
  kMerge: 25,
  kRoundaboutEnter: 26,
  kRoundaboutExit: 27,
  kFerryEnter: 28,
  kFerryExit: 29,
  kTransit: 30,
  kTransitTransfer: 31,
  kTransitRemainOn: 32,
  kTransitConnectionStart: 33,
  kTransitConnectionTransfer: 34,
  kTransitConnectionDestination: 35,
  kPostTransitConnectionDestination: 36,
  kMergeRight: 37,
  kMergeLeft: 38,
  kElevatorEnter: 39,
  kStepsEnter: 40,
  kEscalatorEnter: 41,
  kBuildingEnter: 42,
  kBuildingExit: 43,
} as const;

export type ValhallaDirectionType =
  (typeof VALHALLA_DIRECTION_TYPE)[keyof typeof VALHALLA_DIRECTION_TYPE];

export interface ValhallaStep {
  type?: number;
  instruction?: string;
  bearing_before?: number;
  bearing_after?: number;
}

const KNOWN_DIRECTION_TYPES: ReadonlySet<number> = new Set(
  Object.values(VALHALLA_DIRECTION_TYPE)
);

function isValhallaDirectionType(type: number): type is ValhallaDirectionType {
  return KNOWN_DIRECTION_TYPES.has(type);
}

const RIGHT_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kStartRight,
  VALHALLA_DIRECTION_TYPE.kDestinationRight,
  VALHALLA_DIRECTION_TYPE.kRight,
  VALHALLA_DIRECTION_TYPE.kRampRight,
  VALHALLA_DIRECTION_TYPE.kExitRight,
  VALHALLA_DIRECTION_TYPE.kStayRight,
  VALHALLA_DIRECTION_TYPE.kRoundaboutExit,
  VALHALLA_DIRECTION_TYPE.kMergeRight,
]);
const LEFT_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kStartLeft,
  VALHALLA_DIRECTION_TYPE.kDestinationLeft,
  VALHALLA_DIRECTION_TYPE.kLeft,
  VALHALLA_DIRECTION_TYPE.kRampLeft,
  VALHALLA_DIRECTION_TYPE.kExitLeft,
  VALHALLA_DIRECTION_TYPE.kStayLeft,
  VALHALLA_DIRECTION_TYPE.kMergeLeft,
]);
const SLIGHT_RIGHT_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kSlightRight,
]);
const SLIGHT_LEFT_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kSlightLeft,
]);
const SHARP_RIGHT_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kSharpRight,
]);
const SHARP_LEFT_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kSharpLeft,
]);
const UTURN_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kUturnRight,
  VALHALLA_DIRECTION_TYPE.kUturnLeft,
]);
const MERGE_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kMerge,
]);
const ROUNDABOUT_ENTER_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kRoundaboutEnter,
]);
const STRAIGHT_TYPES: ReadonlySet<ValhallaDirectionType> = new Set([
  VALHALLA_DIRECTION_TYPE.kNone,
  VALHALLA_DIRECTION_TYPE.kStart,
  VALHALLA_DIRECTION_TYPE.kBecomes,
  VALHALLA_DIRECTION_TYPE.kContinue,
  VALHALLA_DIRECTION_TYPE.kRampStraight,
  VALHALLA_DIRECTION_TYPE.kStayStraight,
]);

export function getTurnIcon(step: ValhallaStep): LucideIcon {
  if (typeof step.type === 'undefined') return ArrowUp;

  if (!isValhallaDirectionType(step.type)) return ArrowUp;

  if (UTURN_TYPES.has(step.type)) return RotateCcw;
  if (MERGE_TYPES.has(step.type)) return GitMerge;
  if (ROUNDABOUT_ENTER_TYPES.has(step.type)) return CircleDot;
  if (SHARP_RIGHT_TYPES.has(step.type)) return CornerDownRight;
  if (SHARP_LEFT_TYPES.has(step.type)) return CornerDownLeft;
  if (SLIGHT_RIGHT_TYPES.has(step.type)) return ArrowUpRight;
  if (SLIGHT_LEFT_TYPES.has(step.type)) return ArrowUpLeft;
  if (RIGHT_TYPES.has(step.type)) return ArrowRight;
  if (LEFT_TYPES.has(step.type)) return ArrowLeft;
  if (STRAIGHT_TYPES.has(step.type)) return ArrowUp;

  return ArrowUp;
}
