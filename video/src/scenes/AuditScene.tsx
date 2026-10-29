import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, FONT_MONO, MARGIN} from '../theme';
import {basename, formatSeconds, type Derived} from '../derive';
import {ease} from '../components';
import type {DemoProps} from '../types';

const Fact: React.FC<{label: string; value: string; delay: number; mono?: boolean; small?: boolean}> = ({
  label,
  value,
  delay,
  mono,
  small,
}) => {
  const f = useCurrentFrame();
  const e = ease(f, delay);
  return (
    <div
      style={{
        width: 552,
        height: 150,
        boxSizing: 'border-box',
        padding: '16px 28px',
        borderRadius: 22,
        background: '#FFFFFF0C',
        border: `2px solid ${C.cyan}33`,
        opacity: e,
        transform: `translateY(${(1 - e) * 24}px)`,
        overflow: 'hidden',
      }}
    >
      <div style={{fontSize: 28, letterSpacing: 4, fontWeight: 700, color: C.dim}}>{label}</div>
      <div
        style={{
          fontSize: small ? 40 : 62,
          fontWeight: 800,
          marginTop: 6,
          fontFamily: mono ? FONT_MONO : undefined,
          color: mono ? C.glass : C.mist,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const AuditScene: React.FC<{d: Derived; props: DemoProps}> = ({d, props}) => {
  const f = useCurrentFrame();
  const {result} = props;
  const hardware = props.hardware ?? 'NVIDIA H100';
  const ratio =
    result.request_seconds > 0 ? `${(result.audio_duration_seconds / result.request_seconds).toFixed(1)}×` : 'n/a';
  const note =
    props.audit_note ??
    'Every figure on screen comes from the supplied result object. Derived values are labelled. Transcript text and timings are shown as supplied.';

  return (
    <>
      <div style={{position: 'absolute', left: MARGIN, top: 120, fontSize: 76, fontWeight: 800, opacity: ease(f, 0)}}>
        Audit note
      </div>
      <div style={{position: 'absolute', left: MARGIN, top: 240, width: 1728, display: 'flex', flexWrap: 'wrap', gap: 36}}>
        <Fact label="MODEL" value={result.model} delay={8} small />
        <Fact label="HARDWARE" value={hardware} delay={14} small />
        <Fact label="DEMO WAV" value={basename(result.demo_wav_path)} delay={20} small mono />
        <Fact label="AUDIO LENGTH" value={formatSeconds(result.audio_duration_seconds)} delay={26} mono />
        <Fact label="REQUEST TIME" value={formatSeconds(result.request_seconds)} delay={32} mono />
        <Fact label="WORDS · SPEAKERS" value={`${d.words.length} · ${d.speakers.length}`} delay={38} mono />
      </div>
      <div style={{position: 'absolute', left: MARGIN, top: 620, width: 1728, opacity: ease(f, 56)}}>
        <div style={{fontSize: 44, fontWeight: 700}}>
          Audio ÷ request time: <span style={{fontFamily: FONT_MONO, color: C.glass}}>{ratio}</span>
          <span style={{fontSize: 30, color: C.dim, fontWeight: 500}}>  (derived from the two figures above)</span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 730,
          width: 1728,
          boxSizing: 'border-box',
          padding: '28px 40px',
          borderRadius: 24,
          borderLeft: `10px solid ${C.glass}`,
          background: '#8FF0DC12',
          fontSize: 42,
          lineHeight: 1.35,
          opacity: ease(f, 72),
        }}
      >
        {note}
      </div>
      {result.is_placeholder && (
        <div style={{position: 'absolute', left: MARGIN, top: 960, fontSize: 36, fontWeight: 800, color: C.amber, opacity: ease(f, 90)}}>
          Placeholder data. Replace with the real result before publishing.
        </div>
      )}
    </>
  );
};
