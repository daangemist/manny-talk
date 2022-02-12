import Debug from 'debug';
import { Brain } from '../types';

const debug = Debug('manny-talk:core:brainSelector:default');

const createDefaultBrain = async (defaultBrain: string) =>
  async function (brains: Record<string, Brain>) {
    if (brains[defaultBrain]) {
      debug('Resolving brain resolution to %s', defaultBrain);
      return { brain: brains[defaultBrain] };
    }

    debug('Default brain not found in list of brains.');
    throw new Error('Default brain not found in list of brains');
  };

export default async function getDefaultBrainSelector(
  configuredDefaultBrain: string
) {
  return createDefaultBrain(configuredDefaultBrain);
}
