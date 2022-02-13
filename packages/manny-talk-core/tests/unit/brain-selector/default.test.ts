import defaultFn from '../../../src/brain-selector/default';

describe('initialize', () => {
  it('should return a Promise that resolves to a function', async () => {
    const defaultSelector = await defaultFn('default');

    expect(typeof defaultSelector).toEqual('function');
  });
});

describe('defaultSelector', () => {
  it('should fail on an unknown defaultBrain', async () => {
    const defaultSelector = await defaultFn('default');

    const brain = { process: jest.fn() };
    await expect(
      async () =>
        await defaultSelector(
          { notdefault: brain, othernotdefault: brain },
          { message: 'input', plugin: 'default' }
        )
    ).rejects.toThrowError(/^Default brain/);
  });

  it('should resolve with a result object with a brain attribute', async () => {
    const defaultSelector = await defaultFn('default');
    const brain = { process: jest.fn() };

    const result = await defaultSelector(
      { default: brain },
      { message: 'input', plugin: 'default' }
    );

    expect(result).not.toBe(false);
    // @ts-expect-error The selector can return false or the BrainSelectorResult.
    expect(result.brain).toEqual(brain);
  });
});
