import Debug from 'debug';
import { Brain, BrainSelector, BrainSelectorResult } from '../types';

const debug = Debug('manny-talk:core:brainSelector:default');

const createDefaultBrain = (defaultBrain: string): BrainSelector =>
  async function (brains: Record<string, Brain>): Promise<BrainSelectorResult> {
    if (brains[defaultBrain]) {
      debug('Resolving brain resolution to %s', defaultBrain);
      return { brain: brains[defaultBrain] };
    }

    debug('Default brain not found in list of brains.');
    throw new Error('Default brain not found in list of brains');
  };

export default function getDefaultBrainSelector(
  configuredDefaultBrain: string
): BrainSelector {
  return createDefaultBrain(configuredDefaultBrain);
}
