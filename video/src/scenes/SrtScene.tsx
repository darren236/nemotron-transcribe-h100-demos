import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_MONO, MARGIN} from '../theme';
import {formatSrtTime, type Derived} from '../derive';
import {ease} from '../components';

const SHOWN_CUES = 3;
const LINE_STEP = 6;

export const SrtScene: React.FC<{d: Derived}> = ({d}) => {
  const f = useCurrentFrame();
  const cues = d.cues.slice(0, SHOWN_CUES);

  // Flatten to lines so they can reveal one after another.
  const lines: {text: string; kind: 'index' | 'time' | 'text' | 'blank'}[] = [];
  cues.forEach((c, k) => {
    lines.push({text: String(c.index), kind: 'index'});
    lines.push({text: `${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}`, kind: 'time'});
    lines.push({text: c.text, kind: 'text'});
    if (k < cues.length - 1) lines.push({text: '', kind: 'blank'});
  });

  return (
    <>
      <div style={{position: 'absolute', left: MARGIN, top: 120, display: 'flex', alignItems: 'center', gap: 24, opacity: ease(f, 0)}}>
        <div style={{fontSize: 76, fontWeight: 800}}>Export as SRT</div>
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 36,
            padding: '6px 22px',
            borderRadius: 14,
            background: `${C.glass}22`,
            border: `2px solid ${C.glass}`,
            color: C.glass,
          }}
        >
          transcript.srt
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 250,
          width: 1728,
          height: 560,
          borderRadius: 28,
          background: '#020A10',
          border: `2px solid ${C.cyan}44`,
          padding: '30px 44px',
          boxSizing: 'border-box',
          fontFamily: FONT_MONO,
          fontSize: 42,
          lineHeight: 1.36,
          opacity: ease(f, 6),
          overflow: 'hidden',
        }}
      >
        {lines.map((l, i) => {
          const e = ease(f, 24 + i * LINE_STEP, 10);
          const color = l.kind === 'time' ? C.glass : l.kind === 'index' ? C.dim : C.mist;
          return (
            <div
              key={i}
              style={{
                height: l.kind === 'blank' ? 28 : undefined,
                color,
                opacity: e,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transform: `translateX(${(1 - e) * 24}px)`,
              }}
            >
              {l.text}
            </div>
          );
        })}
        {!cues.length && <div style={{color: C.dim}}>No words to export</div>}
      </div>

      <div style={{position: 'absolute', left: MARGIN, top: 850, width: 1728, opacity: ease(f, 24 + lines.length * LINE_STEP)}}>
        <div style={{fontSize: 56, fontWeight: 800, color: C.glass}}>
          {d.cues.length} cues from {d.words.length} timed words
        </div>
        <div style={{fontSize: 30, color: C.dim, marginTop: 10}}>
          Cue rule: new cue at speaker change, pause over 0.8 s, 8 words, 4 s, or sentence end. Timecodes are the word start and end times.
        </div>
      </div>
    </>
  );
};
