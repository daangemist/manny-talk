import Debug from 'debug';
import {
  Brain,
  IncomingMessage,
  BrainSelector as BrainSelectorType,
  isError,
  BrainSelectorResult,
  IncomingMessageCore,
} from '../types';
import getDefaultSelector from './default';

const debug = Debug('manny-talk:core:brainSelector');

/**
 * Class that enables plugins to influence which brains
 * gets selected on input. It is first set up, and when configured
 * an input message can be handled.
 * Before invoking getBrainForInput, all available brains must be set
 * via setBrains().
 */
export default class BrainSelector {
  private defaultSelector: BrainSelectorType;
  private selectors: Record<string, BrainSelectorType>;
  private lastSelectedBrainsPerClient: Record<
    string,
    { time: Date; brain: Brain }
  >;
  private brains: Record<string, Brain> = {};

  constructor(
    private readonly defaultBrain: string,
    private readonly brainStickiness: number // The time a brain selected for a certain client is used as the default
  ) {
    this.selectors = {};
    this.lastSelectedBrainsPerClient = {};
    this.defaultBrain = defaultBrain;
    this.defaultSelector = getDefaultSelector(this.defaultBrain);
  }

  /**
   * The selector is a function which returns a promise. If the selector
   * selects the brain, it must resolve with an object with at least 1 attribute:
   * brain. If the selector also manipulates the received input message, the altered
   * version of the input should be returned in the input attribute.
   */
  use(label: string, selector: BrainSelectorType) {
    if (typeof selector !== 'function') {
      throw new Error('Selector is not a function.');
    }
    debug('Adding selector %s in use()', label);
    this.selectors[label] = selector;
  }

  /**
   * @param Object brains An object where the key is the name of the plugin, and brain
   * is the function to invoke when the brain is selected.
   * @return Promise
   */
  setBrains(brains: Record<string, Brain>) {
    this.brains = brains;
  }

  /**
   * @param Object input An object with an attribute 'message' which contains the text input.
   * @return Promise
   */
  async getBrainForInput(
    input: IncomingMessageCore
  ): Promise<BrainSelectorResult> {
    if (this.selectors === {}) {
      return this.getDefaultSelectorResult(input);
    }

    const promises: Promise<
      { plugin: string; result: BrainSelectorResult } | false
    >[] = [];

    debug(
      'Using selectors %s for getting brain for input.',
      Object.keys(this.selectors)
    );
    Object.entries(this.selectors).forEach(([plugin, selector]) => {
      promises.push(
        selector(this.brains, input).then((selectorResult) => {
          if (selectorResult === false) {
            return false;
          }

          return {
            plugin,
            result: selectorResult,
          };
        })
      );
    });

    try {
      const brainSelectorResults = await Promise.all(promises);
      const brainSelectorResult = brainSelectorResults.find(
        (result) => result !== false
      );
      if (typeof brainSelectorResult === 'undefined') {
        debug('No selector returned a valid result.');
        throw new Error(
          'No selector returned a result, need to fallback to default.'
        );
      }

      const castResult = brainSelectorResult as {
        plugin: string;
        result: BrainSelectorResult;
      };
      debug('Found a valid result from selector %s.', castResult.plugin);

      // Set the lastSelectedBrainsPerClient value for this client (plugin).
      this.lastSelectedBrainsPerClient[input.plugin] = {
        time: new Date(),
        brain: castResult.result.brain,
      };
      return castResult.result;
    } catch (err) {
      // No selector took it, fallback to the last selected brain, or the default if there isn't one.
      if (this.lastSelectedBrainsPerClient[input.plugin]) {
        const selectedInfo = this.lastSelectedBrainsPerClient[input.plugin];
        const now = new Date();

        if (
          (now.getTime() - selectedInfo.time.getTime()) / 1000 <
          this.brainStickiness
        ) {
          selectedInfo.time = now;
          // Re-initialize the last selected time for this brain
          this.lastSelectedBrainsPerClient[input.plugin] = selectedInfo;
          debug(
            'Selected brain %s because of its stickiness.',
            selectedInfo.brain
          );
          return { brain: selectedInfo.brain };
        }
      }

      debug(
        'Falling back to the default brain selector',
        isError(err) ? err.message : err
      );

      return this.getDefaultSelectorResult(input);
    }
  }

  private async getDefaultSelectorResult(
    input: IncomingMessage
  ): Promise<BrainSelectorResult> {
    const result = await this.defaultSelector(this.brains, input);
    if (result === false) {
      throw new Error(
        'No selectors found, and default selector could also not generate a result.'
      );
    }
    return result;
  }
}
