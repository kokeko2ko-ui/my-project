import React from 'react';
import {Composition} from 'remotion';
import {Video, VideoProps, FPS, TAIL} from './Video';

const defaults: VideoProps = {
  timings: {duration: 8, sentences: [{i: 0, text: '', start: 0, end: 8}]},
  storyboard: {cuts: [{s: 0, type: 'question', text: ''}]},
};

export const Root: React.FC = () => (
  <Composition id="Main" component={Video as any} width={1920} height={1080} fps={FPS} durationInFrames={300} defaultProps={defaults as any}
    calculateMetadata={({props}: any) => {
      const s = props.timings.sentences;
      return {durationInFrames: Math.ceil((s[s.length - 1].end + TAIL) * FPS)};
    }} />
);
