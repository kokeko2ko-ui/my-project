import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {CharacterSheet, CharacterSheetSimple} from './CharacterSheet';
import timings from '../timings.json';

const FPS = 30;
export const TOTAL = Math.ceil((timings.sentences[timings.sentences.length - 1].end + 2) * FPS);

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Video} width={1920} height={1080} fps={FPS} durationInFrames={TOTAL} defaultProps={{simple: false}} />
    <Composition id="SheetSimple" component={CharacterSheetSimple} width={1920} height={1080} fps={FPS} durationInFrames={30} />
    <Composition id="Sheet" component={CharacterSheet} width={1920} height={1080} fps={FPS} durationInFrames={30} />
  </>
);
