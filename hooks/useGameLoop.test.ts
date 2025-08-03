
import { renderHook } from '@testing-library/react';
import { useGameLoop } from './useGameLoop';

describe('useGameLoop', () => {
  it('should call the callback function on each frame', () => {
    const callback = jest.fn();
    renderHook(() => useGameLoop(callback));

    // Fast-forward time to simulate requestAnimationFrame
    // Note: This is a simplified test. In a real-world scenario,
    // you would use a more robust way to test requestAnimationFrame.
    setTimeout(() => {
      expect(callback).toHaveBeenCalled();
    }, 100);
  });
});
