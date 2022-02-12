import Debug from 'debug';
import {
  Brain,
  IncomingMessage,
  BrainSelector as BrainSelectorType,
  isError,
  BrainSelectorResult,
} from '../types';
import getDefaultSelector from './default';

const debug = Debug('genie-router:brainSelector');

/**
 * Class that enables plugins to influence which brains
 * gets selected on input. It is first set up, and when configured
 * an input message can be handled.
 * Before invoking getBrainForInput, all available brains must be set
 * via setBrains().
 */
export default class BrainSelector {
  private defaultSelector: BrainSelectorType | null = null;
  private selectors: BrainSelectorType[];
  private lastSelectedBrainsPerClient: Record<
    string,
    { time: Date; brain: Brain }
  >;
  private brains: Record<string, Brain> = {};

  constructor(
    private readonly defaultBrain: string,
    private readonly brainStickiness: number // The time a brain selected for a certain client is used as the default
  ) {
    this.selectors = [];
    this.lastSelectedBrainsPerClient = {};
    this.defaultBrain = defaultBrain;
    getDefaultSelector(this.defaultBrain).then((defaultSelector) => {
      this.defaultSelector = defaultSelector;
    });
  }

  /**
   * The selector is a function which returns a promise. If the selector
   * selects the brain, it must resolve with an object with at least 1 attribute:
   * brain. If the selector also manipulates the received input message, the altered
   * version of the input should be returned in the input attribute.
   */
  use(label: string, selector: BrainSelector) {
    if (typeof selector !== 'function') {
      throw new Error('Selector is not a function.');
    }
    debug('Adding selector %s', label);
    this.selectors.push(selector);
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
  async getBrainForInput(input: IncomingMessage): Promise<BrainSelectorResult> {
    const promises: Promise<BrainSelectorResult>[] = [];

    this.selectors.forEach((selector) => {
      promises.push(selector(this.brains, input));
    });

    if (promises.length === 0) {
      if (this.defaultSelector === null) {
        throw new Error('The default selector has not been initialized.');
      }
      return await this.defaultSelector(this.brains, input);
    }

    try {
      const brainSelectorResult = await Promise.any(promises);
      // Set the lastSelectedBrainsPerClient value for this client (plugin).
      this.lastSelectedBrainsPerClient[input.plugin] = {
        time: new Date(),
        brain: brainSelectorResult.brain,
      };
      return brainSelectorResult;
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
          debug('Selected brain because of its stickiness.');
          return selectedInfo;
        }
      }

      debug(
        'Falling back to the default brain selector',
        isError(err) ? err.message : err
      );

      if (this.defaultSelector === null) {
        throw new Error('The default brain selector is not set.');
      }
      const defaultResult = await this.defaultSelector(this.brains, input);
      return defaultResult;
    }
  }
}
