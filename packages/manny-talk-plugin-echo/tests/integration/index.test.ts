import { MannyTalk } from '@manny-talk/manny-talk-core';
import echoPlugin from '../../build';

async function delay(delay: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay);
  });
}

describe('echo', () => {
  it('echoes the incoming message', async () => {
    const mannyTalk = new MannyTalk({
      defaultBrain: 'echo',
      plugins: { echo: {} },
    });

    const speak = jest.fn();

    mannyTalk.addPlugin('echo', await echoPlugin());
    mannyTalk.addPlugin('client', {
      client: {
        start: async (_config, clientStart) => {
          // send a message
          setTimeout(() => clientStart.heard({ message: 'Echo test' }), 10);
          return {
            speak,
          };
        },
      },
    });
    await mannyTalk.start();
    await delay(15);
    expect(speak).toBeCalled();
    expect(speak).toBeCalledWith(
      expect.objectContaining({ message: 'ECHO Echo test' })
    );
  });
});
