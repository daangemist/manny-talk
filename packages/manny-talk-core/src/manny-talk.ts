import Debug from 'debug';
import EventEmitter from 'events';
import http from './http';
import BrainSelector from './brain-selector';
import { Loader as PluginLoader } from './plugins';
import {
  ClientStart,
  Config,
  IncomingMessage,
  IncomingMessageCore,
  LoadedPlugin,
  OutgoingMessage,
} from './types';
import { INPUT_HEARD, OUTPUT_REPLY } from './constants/events';

const debug = Debug('manny-talk:core');

export class MannyTalk {
  private httpEnabled = false;
  private brainSelector: BrainSelector;
  private eventEmitter: EventEmitter;
  private pluginLoader: PluginLoader;

  constructor(private readonly config: Config) {
    this.httpEnabled = false;
    this.brainSelector = new BrainSelector(
      config.defaultBrain,
      config.brainStickiness ?? 120
    );
    this.eventEmitter = new EventEmitter();
    this.pluginLoader = new PluginLoader(
      config,
      this.getClientStartObjects.bind(this),
      this.brainSelector,
      this.eventEmitter
    );
  }

  public addPlugin(
    name: string,
    plugin: LoadedPlugin,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config?: Record<string, any>
  ): MannyTalk {
    this.pluginLoader.addPlugin(name, plugin, config);
    return this;
  }

  public async start(usePluginStore = false) {
    try {
      await this.startHttp();
      await this.pluginLoader.setHttpEnabled(this.httpEnabled);
      await this.pluginLoader.startPlugins(usePluginStore);
    } catch (err) {
      console.error('Error initializing', err); // eslint-disable-line no-console
      process.exit(10);
    }
  }

  public async speak(
    plugin: string,
    replyMessage: OutgoingMessage
  ): Promise<void> {
    this.eventEmitter.emit(OUTPUT_REPLY, plugin, replyMessage);
    await this.pluginLoader.getClients()[plugin].speak(replyMessage);
  }

  private getClientStartObjects(clientPluginName: string) {
    const clientStart: ClientStart = {
      heard: async (message: IncomingMessage) => {
        const reply = await this.processHeardInput({
          ...message,
          plugin: clientPluginName,
        });

        await this.speak(clientPluginName, reply);
      },
      speak: (reply: OutgoingMessage) => this.speak(clientPluginName, reply),
    };
    return clientStart;
  }

  private async processHeardInput(input: IncomingMessageCore) {
    this.eventEmitter.emit(INPUT_HEARD, input);

    try {
      const selectedInfo = await this.brainSelector.getBrainForInput(input);

      let updatedInput = input;
      if (selectedInfo.updatedInput) {
        debug('Brain overrides the input.');
        updatedInput = selectedInfo.updatedInput;
      }

      const output = {
        ...(await selectedInfo.brain.process(updatedInput)),
        plugin: input.plugin,
      };

      const outputClone = { ...output }; // A shallow copy
      outputClone.metadata = updatedInput.metadata;
      outputClone.sessionId = updatedInput.sessionId;
      outputClone.profileId = updatedInput.profileId;

      return outputClone;
    } catch (err) {
      debug('Unable to process input %s: %s', JSON.stringify(input), `${err}`);
      return {
        message: 'Could not process input. Try again.',
        plugin: 'manny-talk-core',
      };
    }
  }

  /**
   * Start the HTTP Api, if enabled.
   */
  private async startHttp(): Promise<void> {
    this.httpEnabled = this.config?.http?.enabled ?? false;
    if (!this.httpEnabled) {
      return;
    }

    await http(this.config?.http || { enabled: true });
  }
}
