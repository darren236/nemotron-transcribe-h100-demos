import React from 'react';
import {Composition} from 'remotion';
import {NemotronDemo} from './NemotronDemo';
import {PLACEHOLDER_RESULT} from './placeholder';
import {DURATION, FPS, HEIGHT, WIDTH} from './theme';
import type {DemoProps} from './types';

// Studio defaults use the clearly labelled placeholder. Real data is passed with
// --props (see README). Because `result` is replaced as a whole, the placeholder
// flag disappears with it.
const defaultProps: DemoProps = {
  result: PLACEHOLDER_RESULT,
  hardware: 'NVIDIA H100',
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NemotronTranscribeDemo"
    component={NemotronDemo}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={defaultProps}
  />
);
