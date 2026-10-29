import React from 'react';
import {Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useAudioData, visualizeAudio} from '@remotion/media-utils';
import {C, FONT_MONO, MARGIN} from '../theme';
import {basename, formatSeconds, type Derived} from '../derive';
import {ease} from '../components';
import type {DemoProps} from '../types';

export const resolveAudioSrc = (p: string): string =>
  /^(https?:|data:|blob:)/.test(p) ? p : staticFile(p.replace(/^\/+/, ''));

const noise = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const BAR_AREA = {width: 1920 - MARGIN * 2, height: 420};

const Bars: React.FC<{amps: number[]}> = ({amps}) => {
  const frame = useCurrentFrame();
  const n = amps.length;
  const slot = BAR_AREA.width / n;
  return (
    <div style={{position: 'relative', width: BAR_AREA.width, height: BAR_AREA.height}}>
      {amps.map((a, i) => {
        const grow = ease(frame, Math.abs(i - n / 2) * 0.4, 22);
        const h = Math.max(8, a * BAR_AREA.height * grow);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * slot + slot * 0.15,
              width: slot * 0.7,
              top: (BAR_AREA.height - h) / 2,
              height: h,
              borderRadius: slot,
              background: `linear-gradient(180deg, ${C.glass}, ${C.cyan})`,
              opacity: 0.55 + 0.45 * a,
            }}
          />
        );
      })}
    </div>
  );
};

const energy = (d: Derived, t: number): number => {
  const tick = Math.floor(t * 14);
  for (let i = 0; i < d.words.length; i++) {
    const w = d.words[i];
    if (t >= w.start && t <= w.end) return 0.42 + 0.58 * noise(i * 7.1 + tick);
    if (w.start > t) break;
  }
  return 0.06 + 0.05 * noise(tick);
};

/** Fallback when no WAV is available: activity envelope from word timings. */
const WordBars: React.FC<{d: Derived}> = ({d}) => {
  const frame = useCurrentFrame();
  const n = 96;
  const windowSec = Math.min(d.duration, 8);
  const centre = (frame / 180) * d.duration;
  const amps = Array.from({length: n}, (_, i) => energy(d, centre + ((i - n / 2) / n) * windowSec));
  return <Bars amps={amps} />;
};

/** Spectrum of the supplied WAV. */
const WavBars: React.FC<{src: string; d: Derived}> = ({src, d}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(src);
  if (!audioData) return <WordBars d={d} />;
  const spectrum = visualizeAudio({fps, frame, audioData, numberOfSamples: 128});
  const half = spectrum.slice(0, 64).map((v) => Math.min(1, Math.pow(v * 6, 0.6)));
  return <Bars amps={[...half].reverse().concat(half)} />;
};

export const SignalScene: React.FC<{d: Derived; props: DemoProps}> = ({d, props}) => {
  const frame = useCurrentFrame();
  const {result} = props;
  const useWav = !result.is_placeholder;
  const src = resolveAudioSrc(result.demo_wav_path);
  const titleIn = ease(frame, 50, 24);
  return (
    <>
      <div style={{position: 'absolute', left: MARGIN, top: 150}}>
        <div style={{fontSize: 40, fontWeight: 700, color: C.dim, opacity: ease(frame, 4)}}>
          Audio in · {formatSeconds(result.audio_duration_seconds)}
        </div>
      </div>
      <div style={{position: 'absolute', left: MARGIN, top: 230}}>
        {useWav ? <WavBars src={src} d={d} /> : <WordBars d={d} />}
      </div>
      <div
        style={{
          position: 'absolute',
          left: MARGIN,
          top: 670,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 30}px)`,
          maxWidth: 1728,
        }}
      >
        <div style={{fontSize: 92, fontWeight: 800, lineHeight: 1.08}}>{result.title}</div>
        <div style={{fontFamily: FONT_MONO, fontSize: 36, color: C.glass, marginTop: 22}}>
          {basename(result.demo_wav_path)}
        </div>
        <div style={{fontSize: 30, color: C.dim, marginTop: 10}}>
          {useWav ? 'Live spectrum of the demo WAV' : 'Placeholder: activity envelope drawn from word timings'}
        </div>
      </div>
      {props.play_audio && useWav && (
        <Audio
          src={src}
          volume={(f) => interpolate(f, [0, 15, 150, 180], [0, 0.9, 0.9, 0], {extrapolateRight: 'clamp'})}
        />
      )}
    </>
  );
};
