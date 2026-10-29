import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_MONO, MARGIN} from '../theme';
import {formatClock, type Derived} from '../derive';
import {Chip, clamp01, Rail, speakerColor} from '../components';

const LEAD = 30;
const TAIL = 60;

export const TranscriptScene: React.FC<{d: Derived}> = ({d}) => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const span = durationInFrames - LEAD - TAIL;
  const t = clamp01((f - LEAD) / span) * d.duration;
  const playbackRate = d.duration / (span / 30);

  if (!d.words.length) {
    return (
      <div style={{position: 'absolute', left: MARGIN, top: 400, fontSize: 56, color: C.dim}}>
        No words in result
      </div>
    );
  }

  let cur = -1;
  for (let i = 0; i < d.words.length; i++) {
    if (d.words[i].start <= t) cur = i;
    else break;
  }
  const turnIdx = cur >= 0 ? d.turnOfWord[cur] : -1;
  const turn = turnIdx >= 0 ? d.turns[turnIdx] : null;
  const prev = turnIdx > 0 ? d.turns[turnIdx - 1] : null;

  const appearFrame = (i: number) => LEAD + clamp01(d.words[i].start / d.duration) * span;

  const currentWords: number[] = [];
  if (turn) for (let i = Math.max(turn.from, cur - 21); i <= cur; i++) currentWords.push(i);
  const prevWords: number[] = [];
  if (prev) for (let i = Math.max(prev.from, prev.to - 11); i <= prev.to; i++) prevWords.push(i);

  return (
    <>
      <div style={{position: 'absolute', right: MARGIN, top: 118, display: 'flex', gap: 16}}>
        {d.speakers.slice(0, 4).map((s, i) => (
          <Chip key={s} label={s} color={speakerColor(i)} size={30} />
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 190,
          width: 1728,
          height: 210,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 12,
          opacity: 0.45,
          overflow: 'hidden',
        }}
      >
        {prev && (
          <>
            <div>
              <Chip label={prev.speaker} color={speakerColor(prev.speakerIndex)} size={28} />
            </div>
            <div style={{fontSize: 42, lineHeight: 1.3}}>
              {prevWords.map((i) => d.words[i].word).join(' ')}
            </div>
          </>
        )}
      </div>

      <div style={{position: 'absolute', left: MARGIN, top: 420, width: 1728, height: 370}}>
        {turn && (
          <>
            <Chip label={turn.speaker} color={speakerColor(turn.speakerIndex)} />
            <div style={{fontSize: 64, fontWeight: 600, lineHeight: 1.28, marginTop: 20}}>
              {currentWords.map((i) => {
                const a = interpolate(f, [appearFrame(i), appearFrame(i) + 6], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                const isCur = i === cur;
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      marginRight: 16,
                      padding: '0 10px',
                      borderRadius: 12,
                      opacity: a,
                      transform: `translateY(${(1 - a) * 14}px)`,
                      background: isCur ? C.glass : 'transparent',
                      color: isCur ? C.ink0 : C.mist,
                      boxShadow: isCur ? `0 0 36px ${C.glass}88` : undefined,
                    }}
                  >
                    {d.words[i].word}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 800,
          width: 1728,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          fontFamily: FONT_MONO,
        }}
      >
        <div style={{fontSize: 52, fontWeight: 700, color: C.glass}}>
          {cur >= 0
            ? `${formatClock(d.words[cur].start)} → ${formatClock(d.words[cur].end)}`
            : '--:--.-- → --:--.--'}
        </div>
        <div style={{fontSize: 30, color: C.dim}}>
          timeline compressed · {playbackRate.toFixed(1)}× real time
        </div>
      </div>

      <div style={{position: 'absolute', left: MARGIN, top: 890}}>
        <Rail d={d} playhead={t} />
      </div>
    </>
  );
};
