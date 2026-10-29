import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_MONO, MARGIN} from '../theme';
import {formatClock, type Derived} from '../derive';
import {ease, Rail, speakerColor} from '../components';

const CONTEXT = 3;
const MAX_CARDS = 3;

export const SearchScene: React.FC<{d: Derived}> = ({d}) => {
  const f = useCurrentFrame();
  const query = d.query ?? '';
  const typed = Math.floor(
    interpolate(f, [20, 20 + Math.max(1, query.length) * 3], [0, query.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const caret = Math.floor(f / 15) % 2 === 0;
  const countIn = ease(f, 80);
  const marks = new Set<number>();
  d.matches.forEach((m) => {
    for (let k = 0; k < m.length; k++) marks.add(m.index + k);
  });
  const railIn = ease(f, 70);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 130,
          width: 1728,
          height: 130,
          borderRadius: 28,
          background: C.ink2,
          border: `3px solid ${C.glass}`,
          boxShadow: `0 0 50px ${C.glass}33`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 36px',
          gap: 28,
          opacity: ease(f, 0),
        }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={C.glass} strokeWidth="2.4" strokeLinecap="round">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <line x1="15.5" y1="15.5" x2="21" y2="21" />
        </svg>
        <div style={{fontFamily: FONT_MONO, fontSize: 72, fontWeight: 700, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden'}}>
          {query.slice(0, typed)}
          <span style={{opacity: caret ? 1 : 0, color: C.glass}}>|</span>
        </div>
        <div style={{fontSize: 56, fontWeight: 800, color: C.glass, opacity: countIn, whiteSpace: 'nowrap'}}>
          {d.query
            ? `${d.matches.length} ${d.matches.length === 1 ? 'match' : 'matches'}`
            : 'No words to search'}
        </div>
      </div>

      <div style={{position: 'absolute', left: MARGIN, top: 276, fontSize: 30, color: C.dim, opacity: ease(f, 50)}}>
        {d.queryAuto
          ? 'Query auto-selected: most frequent word of 4+ letters in this transcript'
          : 'Search term supplied with the result'}
      </div>

      <div style={{position: 'absolute', left: MARGIN, top: 360, opacity: railIn}}>
        <Rail d={d} playhead={null} marks={marks} colorBySpeaker={false} />
      </div>

      <div style={{position: 'absolute', left: MARGIN, top: 520, width: 1728, display: 'flex', flexDirection: 'column', gap: 18}}>
        {d.matches.slice(0, MAX_CARDS).map((m, k) => {
          const e = ease(f, 90 + k * 16);
          const from = Math.max(0, m.index - CONTEXT);
          const to = Math.min(d.words.length - 1, m.index + m.length - 1 + CONTEXT);
          const color = speakerColor(d.wordSpeaker[m.index]);
          return (
            <div
              key={m.index}
              style={{
                height: 124,
                borderRadius: 22,
                padding: '0 32px',
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                background: '#FFFFFF0C',
                borderLeft: `10px solid ${color}`,
                opacity: e,
                transform: `translateX(${(1 - e) * 60}px)`,
              }}
            >
              <div style={{fontFamily: FONT_MONO, fontSize: 40, fontWeight: 700, color: C.glass, width: 200}}>
                {formatClock(m.start)}
              </div>
              <div style={{fontSize: 44, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1}}>
                {Array.from({length: to - from + 1}, (_, j) => from + j).map((i) => {
                  const hit = marks.has(i);
                  return (
                    <span
                      key={i}
                      style={{
                        marginRight: 14,
                        padding: hit ? '2px 10px' : 0,
                        borderRadius: 10,
                        background: hit ? C.glass : 'transparent',
                        color: hit ? C.ink0 : C.dim,
                        fontWeight: hit ? 800 : 500,
                      }}
                    >
                      {d.words[i].word}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
        {d.matches.length > MAX_CARDS && (
          <div style={{fontSize: 34, color: C.dim, opacity: ease(f, 90 + MAX_CARDS * 16)}}>
            + {d.matches.length - MAX_CARDS} more on the timeline
          </div>
        )}
      </div>
    </>
  );
};
