import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {C, FONT_MONO, FONT_SANS, MARGIN} from './theme';
import type {Derived} from './derive';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const ease = (frame: number, delay: number, dur = 18) =>
  interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

export const speakerColor = (i: number) => C.speakers[i % C.speakers.length];

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 160);
  return (
    <AbsoluteFill
      style={{background: `linear-gradient(160deg, ${C.ink0} 0%, ${C.ink1} 55%, ${C.ink2} 100%)`}}
    >
      <div
        style={{
          position: 'absolute',
          left: 1050 + drift * 90,
          top: -260,
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.glass}1C 0%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -400 - drift * 60,
          top: 520,
          width: 1100,
          height: 1100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.cyan}16 0%, transparent 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.cyan}0A 1px, transparent 1px), linear-gradient(90deg, ${C.cyan}0A 1px, transparent 1px)`,
          backgroundSize: '96px 96px',
        }}
      />
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at center, transparent 55%, #000000AA 100%)'}}
      />
      <div style={{position: 'absolute', top: 0, left: 0, width: 520, height: 8, background: C.glass}} />
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{
  from: number;
  dur: number;
  index: number;
  name: string;
  fadeIn?: boolean;
  fadeOut?: boolean;
  children: React.ReactNode;
}> = ({from, dur, index, name, fadeIn = true, fadeOut = true, children}) => (
  <Sequence from={from} durationInFrames={dur} name={name}>
    <SceneBody dur={dur} index={index} name={name} fadeIn={fadeIn} fadeOut={fadeOut}>
      {children}
    </SceneBody>
  </Sequence>
);

const SceneBody: React.FC<{
  dur: number;
  index: number;
  name: string;
  fadeIn: boolean;
  fadeOut: boolean;
  children: React.ReactNode;
}> = ({dur, index, name, fadeIn, fadeOut, children}) => {
  const frame = useCurrentFrame();
  const opacity =
    (fadeIn ? interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'}) : 1) *
    (fadeOut ? interpolate(frame, [dur - 12, dur], [1, 0], {extrapolateLeft: 'clamp'}) : 1);
  return (
    <AbsoluteFill style={{opacity, fontFamily: FONT_SANS, color: C.mist}}>
      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 44,
          fontSize: 30,
          letterSpacing: 6,
          fontWeight: 700,
          color: C.glass,
          textTransform: 'uppercase',
        }}
      >
        {String(index).padStart(2, '0')} · {name}
      </div>
      {children}
    </AbsoluteFill>
  );
};

export const PlaceholderBadge: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      right: MARGIN,
      top: 36,
      padding: '8px 22px',
      borderRadius: 999,
      border: `2px solid ${C.amber}`,
      background: `${C.amber}22`,
      color: C.amber,
      fontFamily: FONT_SANS,
      fontWeight: 800,
      fontSize: 28,
      letterSpacing: 2,
    }}
  >
    PLACEHOLDER DATA · NOT A REAL RESULT
  </div>
);

export const Chip: React.FC<{label: string; color: string; size?: number}> = ({
  label,
  color,
  size = 34,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '6px 20px',
      borderRadius: 999,
      background: `${color}22`,
      border: `2px solid ${color}`,
      color,
      fontWeight: 700,
      fontSize: size,
      whiteSpace: 'nowrap',
    }}
  >
    <span style={{width: size * 0.4, height: size * 0.4, borderRadius: '50%', background: color}} />
    {label}
  </span>
);

/** Audio timeline: one tick per word, positioned by real start/end times. */
export const Rail: React.FC<{
  d: Derived;
  playhead: number | null;
  marks?: Set<number>;
  colorBySpeaker?: boolean;
  height?: number;
}> = ({d, playhead, marks, colorBySpeaker = true, height = 56}) => {
  const frame = useCurrentFrame();
  const width = 1920 - MARGIN * 2;
  return (
    <div style={{position: 'relative', width, height: height + 44}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          borderRadius: 12,
          background: '#FFFFFF0A',
          border: `1px solid ${C.cyan}33`,
        }}
      />
      {d.words.map((w, i) => {
        const x = clamp01(w.start / d.duration) * width;
        const wd = Math.max(3, ((w.end - w.start) / d.duration) * width);
        const marked = marks?.has(i) ?? false;
        const revealed = playhead === null || w.start <= playhead;
        const base = colorBySpeaker ? speakerColor(d.wordSpeaker[i]) : C.dim;
        const pulse = marked ? 1 + 0.12 * Math.sin(frame / 5) : 1;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: marks ? (marked ? -8 : 10) : 8,
              width: marked ? Math.max(wd, 8) : wd,
              height: marks ? (marked ? height + 16 : height - 20) : height - 16,
              borderRadius: 3,
              background: marked ? C.glass : base,
              opacity: marks ? (marked ? 1 : 0.28) : revealed ? 0.95 : 0.16,
              boxShadow: marked ? `0 0 ${18 * pulse}px ${C.glass}` : undefined,
            }}
          />
        );
      })}
      {playhead !== null && (
        <div
          style={{
            position: 'absolute',
            left: clamp01(playhead / d.duration) * width - 2,
            top: -14,
            width: 4,
            height: height + 28,
            background: '#FFFFFF',
            boxShadow: `0 0 18px ${C.cyan}`,
            borderRadius: 2,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: height + 8,
          left: 0,
          fontFamily: FONT_MONO,
          fontSize: 28,
          color: C.dim,
        }}
      >
        00:00.00
      </div>
      <div
        style={{
          position: 'absolute',
          top: height + 8,
          right: 0,
          fontFamily: FONT_MONO,
          fontSize: 28,
          color: C.dim,
        }}
      >
        {fmtEnd(d.duration)}
      </div>
    </div>
  );
};

const fmtEnd = (sec: number) => {
  const total = Math.round(sec * 100);
  const cs = total % 100;
  const s = Math.floor(total / 100) % 60;
  const m = Math.floor(total / 6000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};
