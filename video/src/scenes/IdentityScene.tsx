import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_MONO, MARGIN} from '../theme';
import {formatSeconds} from '../derive';
import {ease} from '../components';
import type {DemoProps} from '../types';

const Stat: React.FC<{label: string; value: string; delay: number}> = ({label, value, delay}) => {
  const frame = useCurrentFrame();
  const e = ease(frame, delay);
  return (
    <div
      style={{
        width: 836,
        padding: '16px 30px',
        borderRadius: 8,
        background: '#FFFFFF0C',
        border: `2px solid ${C.cyan}44`,
        opacity: e,
        transform: `translateY(${(1 - e) * 24}px)`,
      }}
    >
      <div style={{fontSize: 30, letterSpacing: 4, color: C.dim, fontWeight: 700}}>{label}</div>
      <div style={{fontSize: 68, fontWeight: 800, fontFamily: FONT_MONO, color: C.glass}}>{value}</div>
    </div>
  );
};

const ChipGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const e = ease(frame, 6, 30);
  const cells = 6;
  return (
    <div
      style={{
        width: 560,
        height: 560,
        padding: 40,
        borderRadius: 16,
        background: `linear-gradient(145deg, ${C.ink3}, ${C.ink1})`,
        border: `3px solid ${C.glass}88`,
        boxShadow: `0 0 90px ${C.glass}33`,
        display: 'grid',
        gridTemplateColumns: `repeat(${cells}, 1fr)`,
        gap: 14,
        opacity: e,
        transform: `scale(${0.92 + 0.08 * e})`,
      }}
    >
      {Array.from({length: cells * cells}, (_, i) => {
        const r = Math.floor(i / cells);
        const c = i % cells;
        const lit = 0.5 + 0.5 * Math.sin(frame / 9 - (r + c) * 0.7);
        return (
          <div
            key={i}
            style={{
              borderRadius: 3,
              background: i % 2 ? C.glass : C.cyan,
              opacity: 0.14 + 0.8 * lit * lit,
            }}
          />
        );
      })}
    </div>
  );
};

const Node: React.FC<{label: string; sub: string; litAt: number; mono?: boolean}> = ({
  label,
  sub,
  litAt,
  mono,
}) => {
  const frame = useCurrentFrame();
  const lit = interpolate(frame, [litAt, litAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        flex: 1,
        height: 150,
        borderRadius: 8,
        padding: '18px 28px',
        background: `rgba(118,185,0,${0.05 + 0.13 * lit})`,
        border: `2px solid ${lit > 0.5 ? C.glass : C.cyan + '44'}`,
        boxShadow: lit > 0.5 ? `0 0 40px ${C.glass}44` : undefined,
        overflow: 'hidden',
      }}
    >
      <div style={{fontSize: 30, color: C.dim, fontWeight: 700, letterSpacing: 3}}>{sub}</div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          fontFamily: mono ? FONT_MONO : undefined,
          marginTop: 6,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Arrow: React.FC<{litAt: number}> = ({litAt}) => {
  const frame = useCurrentFrame();
  const e = interpolate(frame, [litAt, litAt + 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{width: 90, display: 'flex', justifyContent: 'center', color: C.glass, fontSize: 64, opacity: 0.25 + 0.75 * e}}>
      →
    </div>
  );
};

export const IdentityScene: React.FC<{props: DemoProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {result} = props;
  const hardware = props.hardware ?? 'NVIDIA H100';
  const count = ease(frame, 60, 50);
  const modelIn = ease(frame, 4, 22);
  const hwIn = ease(frame, 26, 22);
  return (
    <>
      <div style={{position: 'absolute', left: MARGIN, top: 140, width: 1040, zIndex: 10, background: '#FFFFFF01'}}>
        <div style={{fontSize: 32, letterSpacing: 5, color: C.dim, fontWeight: 700, opacity: modelIn}}>MODEL</div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.06,
            marginTop: 8,
            opacity: modelIn,
            transform: `translateX(${(1 - modelIn) * -40}px)`,
          }}
        >
          Nemotron 3.5<br />Transcribe
        </div>
        <div style={{fontSize: 28, color: C.dim, marginTop: 20, opacity: modelIn}}>
          {result.model}
        </div>
        <div style={{fontSize: 32, letterSpacing: 5, color: C.dim, fontWeight: 700, marginTop: 38, opacity: hwIn}}>
          RUNNING ON
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            color: C.glass,
            marginTop: 4,
            opacity: hwIn,
            transform: `translateX(${(1 - hwIn) * -40}px)`,
          }}
        >
          {hardware.replace('NVIDIA ', '')}
        </div>
      </div>
      <div style={{position: 'absolute', right: MARGIN + 40, top: 130}}>
        <ChipGraphic />
      </div>
      <div style={{position: 'absolute', left: MARGIN, top: 690, width: 1728, display: 'flex', alignItems: 'center'}}>
        <Node sub="INPUT" label={`${formatSeconds(result.audio_duration_seconds)} WAV`} litAt={40} mono />
        <Arrow litAt={55} />
        <Node sub="TRANSCRIBE" label="Nemotron 3.5" litAt={70} />
        <Arrow litAt={85} />
        <Node sub="OUTPUT" label="Words · time · voices" litAt={100} />
      </div>
      <div style={{position: 'absolute', left: MARGIN, top: 870, display: 'flex', gap: 56}}>
        <Stat label="AUDIO LENGTH" value={formatSeconds(result.audio_duration_seconds * count)} delay={110} />
        <Stat label="REQUEST TIME" value={formatSeconds(result.request_seconds * count)} delay={125} />
      </div>
    </>
  );
};
