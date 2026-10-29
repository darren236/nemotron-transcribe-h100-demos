import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_SANS, MARGIN} from './theme';

export const speakerColor = (i: number) => C.speakers[i % C.speakers.length];

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 160);
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${C.ink0} 0%, ${C.ink1} 55%, ${C.ink2} 100%)`}}>
      <div style={{position: 'absolute', left: 1050 + drift * 90, top: -260, width: 1200, height: 1200, borderRadius: '50%', background: `radial-gradient(circle, ${C.glass}1C 0%, transparent 62%)`}} />
      <div style={{position: 'absolute', left: -400 - drift * 60, top: 520, width: 1100, height: 1100, borderRadius: '50%', background: `radial-gradient(circle, ${C.cyan}16 0%, transparent 62%)`}} />
      <AbsoluteFill style={{backgroundImage: `linear-gradient(${C.cyan}0A 1px, transparent 1px), linear-gradient(90deg, ${C.cyan}0A 1px, transparent 1px)`, backgroundSize: '96px 96px'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, #000000AA 100%)'}} />
      <div style={{position: 'absolute', top: 0, left: 0, width: 520, height: 8, background: C.glass}} />
    </AbsoluteFill>
  );
};

export const PlaceholderBadge: React.FC = () => (
  <div style={{position: 'absolute', right: MARGIN, top: 36, padding: '8px 22px', borderRadius: 999, border: `2px solid ${C.amber}`, background: `${C.amber}22`, color: C.amber, fontFamily: FONT_SANS, fontWeight: 800, fontSize: 28, letterSpacing: 2}}>
    PLACEHOLDER DATA · NOT A REAL RESULT
  </div>
);
