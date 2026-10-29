import type {DemoProps, SpeakerId, TranscriptWord} from './types';

export const speakerLabel = (s: SpeakerId | undefined): string => {
  if (s === null || s === undefined || s === '') return 'Speaker';
  if (typeof s === 'string') {
    const match = /^(?:<?spk:)?(\d+)>?$/.exec(s);
    if (match) return `Speaker ${Number(match[1]) + 1}`;
  }
  return typeof s === 'number' ? `Speaker ${s + 1}` : s;
};

export const normToken = (w: string): string =>
  w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

export const basename = (p: string): string => p.split(/[\\/]/).pop() ?? p;

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** SRT timecode: HH:MM:SS,mmm */
export const formatSrtTime = (sec: number): string => {
  const total = Math.max(0, Math.round(sec * 1000));
  const ms = total % 1000;
  const s = Math.floor(total / 1000) % 60;
  const m = Math.floor(total / 60000) % 60;
  const h = Math.floor(total / 3600000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
};

/** On-screen clock: MM:SS.cc */
export const formatClock = (sec: number): string => {
  const total = Math.max(0, Math.round(sec * 100));
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
};

export const formatSeconds = (v: number): string =>
  `${v < 10 ? v.toFixed(2) : v.toFixed(1)} s`;

export type Turn = {
  speaker: string;
  speakerIndex: number;
  /** Inclusive word indices. */
  from: number;
  to: number;
  start: number;
  end: number;
};

export type Match = {index: number; length: number; start: number; end: number};

export type Cue = {
  index: number;
  start: number;
  end: number;
  text: string;
};

export type Derived = {
  words: TranscriptWord[];
  duration: number;
  speakers: string[];
  wordSpeaker: number[];
  turns: Turn[];
  turnOfWord: number[];
  query: string | null;
  queryAuto: boolean;
  matches: Match[];
  cues: Cue[];
};

const pickQuery = (words: TranscriptWord[]): string | null => {
  const counts = new Map<string, number>();
  for (const w of words) {
    const t = normToken(w.word);
    if (t.length >= 4) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [t, c] of counts) {
    if (c > bestCount) {
      best = t;
      bestCount = c;
    }
  }
  if (best) return best;
  const first = words.map((w) => normToken(w.word)).find(Boolean);
  return first ?? null;
};

const findMatches = (words: TranscriptWord[], query: string | null): Match[] => {
  if (!query) return [];
  const tokens = query.split(/\s+/).map(normToken).filter(Boolean);
  if (!tokens.length) return [];
  const norm = words.map((w) => normToken(w.word));
  const out: Match[] = [];
  for (let i = 0; i + tokens.length <= words.length; i++) {
    if (tokens.every((t, k) => norm[i + k] === t)) {
      out.push({
        index: i,
        length: tokens.length,
        start: words[i].start,
        end: words[i + tokens.length - 1].end,
      });
      i += tokens.length - 1;
    }
  }
  return out;
};

// Cue rule (disclosed on screen): break at speaker change, pause > 0.8 s,
// 8 words, 4 s, or sentence-final punctuation.
const buildCues = (words: TranscriptWord[], wordSpeaker: number[]): Cue[] => {
  const cues: Cue[] = [];
  let cur: number[] = [];
  const flush = () => {
    if (!cur.length) return;
    const first = words[cur[0]];
    const last = words[cur[cur.length - 1]];
    cues.push({
      index: cues.length + 1,
      start: first.start,
      end: Math.max(last.end, first.start + 0.001),
      text: cur.map((i) => words[i].word).join(' '),
    });
    cur = [];
  };
  for (let i = 0; i < words.length; i++) {
    if (cur.length) {
      const first = words[cur[0]];
      const prev = words[cur[cur.length - 1]];
      if (
        wordSpeaker[i] !== wordSpeaker[cur[0]] ||
        words[i].start - prev.end > 0.8 ||
        cur.length >= 8 ||
        words[i].end - first.start > 4 ||
        /[.!?]$/.test(prev.word)
      ) {
        flush();
      }
    }
    cur.push(i);
  }
  flush();
  return cues;
};

export const derive = (props: DemoProps): Derived => {
  const {result} = props;
  const words = [...result.words].sort((a, b) => a.start - b.start);
  const duration = Math.max(result.audio_duration_seconds, 0.001);

  const speakers: string[] = [];
  const wordSpeaker = words.map((w) => {
    const label = speakerLabel(w.speaker);
    let idx = speakers.indexOf(label);
    if (idx < 0) {
      speakers.push(label);
      idx = speakers.length - 1;
    }
    return idx;
  });

  const turns: Turn[] = [];
  const turnOfWord: number[] = [];
  words.forEach((w, i) => {
    const last = turns[turns.length - 1];
    if (last && last.speakerIndex === wordSpeaker[i]) {
      last.to = i;
      last.end = w.end;
    } else {
      turns.push({
        speaker: speakers[wordSpeaker[i]],
        speakerIndex: wordSpeaker[i],
        from: i,
        to: i,
        start: w.start,
        end: w.end,
      });
    }
    turnOfWord.push(turns.length - 1);
  });

  const explicit = props.search_query?.trim();
  const query = explicit ? explicit : pickQuery(words);
  const queryAuto = !explicit;

  return {
    words,
    duration,
    speakers,
    wordSpeaker,
    turns,
    turnOfWord,
    query,
    queryAuto,
    matches: findMatches(words, query),
    cues: buildCues(words, wordSpeaker),
  };
};
