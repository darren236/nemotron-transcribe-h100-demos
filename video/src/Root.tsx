import React from 'react';
import {Composition} from 'remotion';
import {CaptionClip} from './CaptionClip';
import {PLACEHOLDER_RESULT} from './placeholder';
import {DURATION, FPS, HEIGHT, WIDTH} from './theme';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NemotronCaptionClip"
    component={CaptionClip}
    durationInFrames={DURATION}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{result: {...PLACEHOLDER_RESULT, demo_wav_path: 'demo_conversation.wav'}, source_label: 'Preview'}}
    calculateMetadata={({props}) => ({durationInFrames: Math.ceil((props.result.audio_duration_seconds + 0.4) * FPS)})}
  />
);
