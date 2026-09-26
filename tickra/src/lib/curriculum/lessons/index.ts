// Advanced and mastery lessons, one module per half-track.
//
// Server-only, like lesson-content.ts that merges them: this is paid copy.

import type { LessonContent } from '../lesson-content';
import { TREND_A } from './trend-a';
import { TREND_B } from './trend-b';
import { TREND_C } from './trend-c';
import { RANGE_A } from './range-a';
import { RANGE_B } from './range-b';
import { RANGE_C } from './range-c';
import { VOL_A } from './vol-a';
import { VOL_B } from './vol-b';
import { VOL_C } from './vol-c';
import { PSY } from './psy';
import { LIVE_A } from './live-a';
import { LIVE_B } from './live-b';
import { LIVE_C } from './live-c';

export const ADVANCED_LESSONS: Record<string, LessonContent> = {
  ...TREND_A,
  ...TREND_B,
  ...TREND_C,
  ...RANGE_A,
  ...RANGE_B,
  ...RANGE_C,
  ...VOL_A,
  ...VOL_B,
  ...VOL_C,
  ...PSY,
  ...LIVE_A,
  ...LIVE_B,
  ...LIVE_C,
};
