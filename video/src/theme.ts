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
  ink0: '#0B0D0B',
  ink1: '#171A16',
  ink2: '#20261D',
  ink3: '#30392B',
  glass: '#76B900',
  cyan: '#A6D542',
  mist: '#F7F8F4',
  dim: '#AAB4A3',
  amber: '#E2C061',
  speakers: ['#A6D542', '#F7F8F4', '#76B900', '#ABB5A1'],
} as const;

export const FONT_SANS = 'Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif';
export const FONT_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';

export const MARGIN = 96;
