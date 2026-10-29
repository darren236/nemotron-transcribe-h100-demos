export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;
export const DURATION = 1800; // 60 s

export const SCENES = {
  signal: {from: 0, dur: 180},
  identity: {from: 180, dur: 240},
  transcript: {from: 420, dur: 600},
  search: {from: 1020, dur: 240},
  srt: {from: 1260, dur: 300},
  audit: {from: 1560, dur: 240},
} as const;

export const C = {
  ink0: '#030D14',
  ink1: '#061A24',
  ink2: '#0B2B38',
  ink3: '#123E4E',
  glass: '#8FF0DC',
  cyan: '#4FD8E8',
  mist: '#E3F6F4',
  dim: '#7FA9B3',
  amber: '#F2C94C',
  speakers: ['#8FF0DC', '#4FD8E8', '#B9ADFF', '#FFC98B'],
} as const;

export const FONT_SANS = 'Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
export const FONT_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';

export const MARGIN = 96;
