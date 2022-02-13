import BrainSelector from '../../../src/brain-selector';
import { Brain } from '../../../src/types';

jest.useFakeTimers();

/**
 * TODO replace the as unknown notations and casts with actual Jest generics,
 * so that it is more readable.
 */

function setupBrainSelector(stickyness = 120): BrainSelector {
  const brainSelector = new BrainSelector('default', stickyness);

  return brainSelector;
}

describe('getBrainForInput', () => {
  it('should fallback to the default brain', async () => {
    const brainSelector = setupBrainSelector();

    const brainMock = { process: jest.fn() };
    brainSelector.setBrains({ default: brainMock });

    const { brain } = await brainSelector.getBrainForInput({
      message: 'heard',
      plugin: 'test',
    });
    expect(brain).toBe(brainMock);
  });

  it('should use a sticky brain if there is one for the client', async () => {
    const stickyBrain: Brain = { process: jest.fn() };

    const stickySelector = jest.fn();
    stickySelector.mockResolvedValue({ brain: stickyBrain });

    // Make sure that one the second invocation sticky brain is not selected by this selector.
    // stickySelector.mockImplementation(() => {
    //   throw new Error('Not selected.');
    // });

    const brainSelector = setupBrainSelector();

    brainSelector.use('sticky', stickySelector as unknown as BrainSelector);

    const defaultBrain: Brain = { process: jest.fn() };
    brainSelector.setBrains({ default: defaultBrain, sticky: stickyBrain });

    // Query the first input, this makes the sticky brain sticky for 120 seconds.
    const { brain } = await brainSelector.getBrainForInput({
      message: 'heard',
      plugin: 'test',
    });
    expect(stickySelector).toBeCalled();
    expect(brain).toBe(stickyBrain);

    // Query the second input, this should return the sticky brain again.
    const { brain: secondBrain } = await brainSelector.getBrainForInput({
      message: 'heard 2',
      plugin: 'test',
    });
    expect(secondBrain).toEqual(stickyBrain);
    expect(stickySelector).toHaveBeenCalledTimes(2);
  });

  it('should not use a sticky brain if it is outdated', async () => {
    const stickyBrain: Brain = { process: jest.fn() };

    const stickySelector = jest.fn();
    stickySelector.mockResolvedValueOnce({ brain: stickyBrain });

    // Make sure that one the second invocation sticky brain is not selected by this selector.
    stickySelector.mockResolvedValue(false);

    const brainSelector = setupBrainSelector(-1);

    brainSelector.use('sticky', stickySelector as unknown as BrainSelector);

    const defaultBrain: Brain = { process: jest.fn() };
    brainSelector.setBrains({ default: defaultBrain, sticky: stickyBrain });

    // Query the first input, this makes the sticky brain sticky for 120 seconds.
    const { brain } = await brainSelector.getBrainForInput({
      message: 'heard',
      plugin: 'test',
    });
    expect(brain).toEqual(stickyBrain);

    // Query the second input, this should default brain again.
    const { brain: secondBrain } = await brainSelector.getBrainForInput({
      message: 'heard 2',
      plugin: 'test',
    });
    expect(secondBrain).toEqual(defaultBrain);
    expect(stickySelector).toHaveBeenCalledTimes(2);
  });
});
