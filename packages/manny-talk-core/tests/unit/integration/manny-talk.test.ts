import {
  MannyTalk,
  Config,
  PluginConfig,
  ClientStart,
  IncomingMessage,
} from '../../../build';

const config: Config = {
  defaultBrain: 'test',
  plugins: {
    test: {
      plugin: 'configuration',
    },
  },
};

describe('Manny Talk', () => {
  it('triggers both brain and reply for input.', async () => {
    const brainMock = { process: jest.fn() };
    brainMock.process.mockResolvedValue({ message: 'Great work!' });
    const speak = jest.fn();

    const mannyTalk = new MannyTalk(config);

    let heardFn: undefined | ((input: IncomingMessage) => Promise<void>) =
      undefined;

    // Add the plugin
    mannyTalk.addPlugin('test', {
      brain: {
        start: async () => brainMock,
      },
      client: {
        start: async (
          _pluginConfig: PluginConfig,
          clientStart: ClientStart
        ) => {
          heardFn = clientStart.heard;
          return {
            speak,
          };
        },
      },
    });
    await mannyTalk.start();

    // @ts-expect-error we know its defined.
    await heardFn({ message: 'Hi there' });
    expect(brainMock.process).toBeCalled();
    expect(speak).toBeCalled();
  });
});
