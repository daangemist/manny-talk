import Debug from 'debug';
import EventEmitter from 'events';
import { readFromObject } from './utils';
import http from './http';
import BrainSelector from './brain-selector';
import { Loader as PluginLoader } from './plugins';
import {
  Config,
  IncomingMessage,
  OutgoingMessage,
  SpeakCallback,
} from './types';
import { INPUT_HEARD } from './constants/events';

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
      readFromObject<number>(config, 'brainStickiness', 120)
    );
    this.eventEmitter = new EventEmitter();
    this.pluginLoader = new PluginLoader(
      config,
      this.getClientStartObjects.bind(this),
      this.brainSelector,
      this.eventEmitter
    );
  }

  public async start() {
    try {
      await this.startHttp();
      await this.pluginLoader.setHttpEnabled(this.httpEnabled);
      await this.pluginLoader.startPlugins();
    } catch (err) {
      console.error('Error initializing', err); // eslint-disable-line no-console
      process.exit(10);
    }
  }

  private getClientStartObjects(clientPluginName: string) {
    return {
      // TODO create an object model
      heard: (message: IncomingMessage) => {
        this.processHeardInput(message, (replyMessage: OutgoingMessage) => {
          // We cannot use this function directly, because the object this.clients[clientPluginName]
          // is not set yet when we create this startObject.
          this.eventEmitter.emit(
            'output.reply',
            clientPluginName,
            replyMessage
          );
          this.pluginLoader.getClients()[clientPluginName].speak(replyMessage);
        });
      },
    };
  }

  private async processHeardInput(
    input: IncomingMessage,
    speakCallback: SpeakCallback
  ) {
    this.eventEmitter.emit(INPUT_HEARD, input.plugin, input.message);

    try {
      const selectedInfo = await this.brainSelector.getBrainForInput(input);

      const { brain } = selectedInfo;
      let updatedInput = input;
      if (selectedInfo.updatedInput) {
        // the brain overrides the input
        updatedInput = selectedInfo.updatedInput;
      }

      const output = await brain.process(updatedInput);

      const outputClone = Object.assign({}, output);
      outputClone.metadata = updatedInput.metadata;
      outputClone.sessionId = updatedInput.sessionId
        ? updatedInput.sessionId
        : null;
      outputClone.profileId = updatedInput.profileId
        ? updatedInput.profileId
        : null;
      await speakCallback(outputClone);
    } catch (err) {
      debug('Unable to process input %s: %s', JSON.stringify(input), `${err}`);
    }
  }

  /**
   * Start the HTTP Api, if enabled.
   */
  private async startHttp(): Promise<void> {
    this.httpEnabled = readFromObject<boolean>(
      this.config,
      'http.enabled',
      false
    );
    if (!this.httpEnabled) {
      return;
    }

    await http(this.config?.http || { enabled: true });
  }
}
