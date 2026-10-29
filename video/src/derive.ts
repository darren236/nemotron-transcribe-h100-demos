import type {SpeakerId} from './types';

export const speakerLabel = (s: SpeakerId | undefined): string => {
  if (s === null || s === undefined || s === '') return 'Speaker';
  if (typeof s === 'string') {
    const match = /^(?:<?spk:)?(\d+)>?$/.exec(s);
    if (match) return `Speaker ${Number(match[1]) + 1}`;
  }
  return typeof s === 'number' ? `Speaker ${s + 1}` : s;
};

/** On-screen clock: MM:SS.cc */
export const formatClock = (sec: number): string => {
  const total = Math.max(0, Math.round(sec * 100));
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};
