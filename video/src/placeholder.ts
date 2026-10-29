import type {DemoResult, TranscriptWord} from './types';

// DEVELOPMENT PLACEHOLDER ONLY.
// Nothing below is a real transcript, timing, or measurement. It exists so the
// layout can be previewed before the real result object is available. The
// video shows a "PLACEHOLDER DATA" badge for as long as is_placeholder is true.
const FILLER = [
  'Placeholder',
  'transcript',
  'words',
  'appear',
  'here',
  'only',
  'for',
  'layout',
  'testing.',
];

const PLACEHOLDER_WORDS: TranscriptWord[] = Array.from({length: 72}, (_, i) => ({
  word: FILLER[i % FILLER.length],
  start: i * 0.45,
  end: i * 0.45 + 0.38,
  speaker: Math.floor(i / 18) % 2 === 0 ? 'Speaker A' : 'Speaker B',
}));

export const PLACEHOLDER_RESULT: DemoResult = {
  title: 'Placeholder title',
  model: 'NVIDIA Nemotron 3.5 Transcribe',
  request_seconds: 1,
  audio_duration_seconds: 34,
  words: PLACEHOLDER_WORDS,
  demo_wav_path: 'placeholder-demo.wav',
  is_placeholder: true,
};
