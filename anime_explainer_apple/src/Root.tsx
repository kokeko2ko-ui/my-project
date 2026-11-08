import React from 'react';
import {Composition} from 'remotion';
import {Video, VideoProps} from './Video';
import {CharacterSheet, CharacterSheetSimple} from './CharacterSheet';

const FPS = 30;
const defaults: VideoProps = {
  simple: true,
  timings: {sentences: [{i: 0, text: '', start: 0, end: 8}]},
  storyboard: {cuts: [{s: 0, type: 'title', line1: '', line2: ''}]},
  envelope: [],
};

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Video as any} width={1920} height={1080} fps={FPS} durationInFrames={300} defaultProps={defaults as any}
      calculateMetadata={({props}: any) => {
        const s = props.timings.sentences;
        return {durationInFrames: Math.ceil((s[s.length - 1].end + 2) * FPS)};
      }} />
    <Composition id="SheetSimple" component={CharacterSheetSimple} width={1920} height={1080} fps={FPS} durationInFrames={30} />
    <Composition id="Sheet" component={CharacterSheet} width={1920} height={1080} fps={FPS} durationInFrames={30} />
  </>
);
