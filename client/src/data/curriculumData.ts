import type { DayTrack } from '../types';
import { DAY01_TRACK, PART01_TRACK } from './curriculum/day01_numpy';
import { DAY02_TRACK, PART02_TRACK } from './curriculum/day02_pandas';
import { DAY03_TRACK, PART03_TRACK } from './curriculum/day03_autograd';
import { DAY04_TRACK, PART04_TRACK } from './curriculum/day04_cuda_streams';
import { DAY05_TRACK, PART05_TRACK } from './curriculum/day05_pytorch_nn';
import { DAY06_TRACK, PART06_TRACK } from './curriculum/day06_attention';
import { DAY07_TRACK, PART07_TRACK } from './curriculum/day07_quantization';

export const PART_TRACKS: DayTrack[] = [
  PART01_TRACK,
  PART02_TRACK,
  PART03_TRACK,
  PART04_TRACK,
  PART05_TRACK,
  PART06_TRACK,
  PART07_TRACK,
];

export const CURRICULUM_DATA: DayTrack[] = PART_TRACKS;

export {
  DAY01_TRACK,
  DAY02_TRACK,
  DAY03_TRACK,
  DAY04_TRACK,
  DAY05_TRACK,
  DAY06_TRACK,
  DAY07_TRACK,
  PART01_TRACK,
  PART02_TRACK,
  PART03_TRACK,
  PART04_TRACK,
  PART05_TRACK,
  PART06_TRACK,
  PART07_TRACK,
};

export default CURRICULUM_DATA;
