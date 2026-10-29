import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop, PlaceholderBadge, speakerColor} from './components';
import {formatClock, speakerLabel} from './derive';
import {C, FONT_MONO, FONT_SANS, FPS, MARGIN} from './theme';
import type {DemoResult, TranscriptWord} from './types';

export type CaptionClipProps = {
  result: DemoResult;
  source_label: string;
};

type Chunk = {from: number; to: number; start: number; end: number};

const makeChunks = (words: TranscriptWord[]): Chunk[] => {
  const chunks: Chunk[] = [];
  let from = 0;
  for (let i = 0; i < words.length; i++) {
    const next = words[i + 1];
    if (!next || i - from >= 7 || (i - from >= 3 && /[.!?]$/.test(words[i].word))
        || next.speaker !== words[i].speaker || next.start - words[i].end > 0.8) {
      chunks.push({from, to: i, start: words[from].start, end: words[i].end});
      from = i + 1;
    }
  }
  return chunks;
};

export const CaptionClip: React.FC<CaptionClipProps> = ({result, source_label}) => {
  const frame = useCurrentFrame();
  const time = frame / FPS;
  const words = result.words;
  const chunks = useMemo(() => makeChunks(words), [words]);
  let chunkIndex = chunks.findIndex((chunk) => chunk.end >= time);
  if (chunkIndex < 0) chunkIndex = chunks.length - 1;
  const chunk = chunks[Math.max(0, chunkIndex)];
  const active = words.findIndex((word) => time >= word.start && time < word.end + 0.04);
  const speakerIds = [...new Set(words.map((word) => speakerLabel(word.speaker)))];
  const currentSpeaker = speakerLabel(words[chunk?.from ?? 0]?.speaker);
  const speakerIndex = speakerIds.indexOf(currentSpeaker);
  const duration = Math.max(result.audio_duration_seconds, 0.001);

  return (
    <AbsoluteFill style={{fontFamily: FONT_SANS, color: C.mist}}>
      <Backdrop />
      <div style={{position: 'absolute', top: 58, left: MARGIN, color: C.glass, fontSize: 28, fontWeight: 800, letterSpacing: 5}}>
        NEMOTRON 3.5 TRANSCRIBE / REAL MODEL OUTPUT
      </div>
      <div style={{position: 'absolute', top: 150, left: MARGIN, width: 1728, fontSize: 78, fontWeight: 800}}>
        {result.title}
      </div>
      <div style={{position: 'absolute', top: 265, left: MARGIN, color: C.dim, fontSize: 31}}>
        {source_label} · 1 × H100 80 GB · {words.length} CTC-aligned words
      </div>
      <div style={{position: 'absolute', top: 380, left: MARGIN, display: 'flex', gap: 16, alignItems: 'center'}}>
        <span style={{width: 16, height: 16, borderRadius: '50%', background: speakerColor(Math.max(0, speakerIndex))}} />
        <span style={{color: speakerColor(Math.max(0, speakerIndex)), fontSize: 32, fontWeight: 800}}>{currentSpeaker}</span>
      </div>
      <div style={{position: 'absolute', top: 460, left: MARGIN, width: 1728, minHeight: 250, fontSize: 67, fontWeight: 750, lineHeight: 1.3}}>
        {chunk && words.slice(chunk.from, chunk.to + 1).map((word, offset) => {
          const index = chunk.from + offset;
          const isActive = index === active;
          return <span key={index} style={{display: 'inline-block', marginRight: 15, marginBottom: 10, padding: '2px 7px', background: isActive ? C.glass : 'transparent', color: isActive ? C.ink0 : index < active ? C.dim : C.mist}}>{word.word}</span>;
        })}
      </div>
      <div style={{position: 'absolute', top: 815, left: MARGIN, width: 1728, height: 28, background: '#FFFFFF18'}}>
        {words.map((word, index) => <div key={index} style={{position: 'absolute', left: `${(word.start / duration) * 100}%`, width: `${Math.max(0.2, ((word.end - word.start) / duration) * 100)}%`, top: 0, height: 28, background: word.start <= time ? speakerColor(Math.max(0, speakerIds.indexOf(speakerLabel(word.speaker)))) : '#FFFFFF33'}} />)}
        <div style={{position: 'absolute', left: `${Math.min(100, (time / duration) * 100)}%`, top: -10, width: 5, height: 48, background: '#FFFFFF'}} />
      </div>
      <div style={{position: 'absolute', top: 867, left: MARGIN, width: 1728, display: 'flex', justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 34, color: C.dim}}>
        <span>{formatClock(time)}</span><span>{formatClock(duration)}</span>
      </div>
      <div style={{position: 'absolute', top: 984, left: MARGIN, fontSize: 25, color: C.dim}}>
        Actual H100 inference · Original audio and raw response in repository
      </div>
      {!result.is_placeholder && <Audio src={staticFile(result.demo_wav_path)} />}
      {result.is_placeholder && <PlaceholderBadge />}
    </AbsoluteFill>
  );
};
