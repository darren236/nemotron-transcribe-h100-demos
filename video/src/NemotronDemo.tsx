import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop, PlaceholderBadge, Scene} from './components';
import {derive} from './derive';
import {AuditScene} from './scenes/AuditScene';
import {IdentityScene} from './scenes/IdentityScene';
import {SearchScene} from './scenes/SearchScene';
import {SignalScene} from './scenes/SignalScene';
import {SrtScene} from './scenes/SrtScene';
import {TranscriptScene} from './scenes/TranscriptScene';
import {C, DURATION, SCENES} from './theme';
import type {DemoProps} from './types';

export const NemotronDemo: React.FC<DemoProps> = (props) => {
  const frame = useCurrentFrame();
  const d = useMemo(() => derive(props), [props]);
  const S = SCENES;

  return (
    <AbsoluteFill>
      <Backdrop />
      <Scene {...S.signal} index={1} name="Signal" fadeIn={false}>
        <SignalScene d={d} props={props} />
      </Scene>
      <Scene {...S.identity} index={2} name="Model on H100">
        <IdentityScene props={props} />
      </Scene>
      <Scene {...S.transcript} index={3} name="Transcript">
        <TranscriptScene d={d} />
      </Scene>
      <Scene {...S.search} index={4} name="Search">
        <SearchScene d={d} />
      </Scene>
      <Scene {...S.srt} index={5} name="SRT export">
        <SrtScene d={d} />
      </Scene>
      <Scene {...S.audit} index={6} name="Audit" fadeOut={false}>
        <AuditScene d={d} props={props} />
      </Scene>
      {!props.result.is_placeholder && ([
        ['identity', S.identity],
        ['transcript', S.transcript],
        ['search', S.search],
        ['srt', S.srt],
        ['audit', S.audit],
      ] as const).map(([name, scene]) => (
        <Sequence key={name} from={scene.from} durationInFrames={scene.dur} name={`${name} narration`}>
          <Audio src={staticFile(`narration/${name}.wav`)} volume={0.92} />
        </Sequence>
      ))}
      {props.result.is_placeholder && <PlaceholderBadge />}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: 6,
          width: `${(frame / DURATION) * 100}%`,
          background: `linear-gradient(90deg, ${C.cyan}, ${C.glass})`,
        }}
      />
    </AbsoluteFill>
  );
};
