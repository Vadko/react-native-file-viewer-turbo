import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { open as Open } from '../open';

// Jest resolves '../open' to open.native.tsx, so load the web implementation explicitly.
const { open } = jest.requireActual<{ open: typeof Open }>('../open.tsx');

const mockWindowOpen =
  jest.fn<(url: string, target: string) => object | null>();
(globalThis as any).window = { open: mockWindowOpen };

afterEach(() => {
  mockWindowOpen.mockReset();
  jest.useRealTimers();
});

describe('open (web)', () => {
  it('opens the URL in a new tab and calls onDismiss when it is closed', async () => {
    jest.useFakeTimers();
    const viewer = { closed: false, opener: {} };
    mockWindowOpen.mockReturnValue(viewer);
    const onDismiss = jest.fn();

    await open('https://example.com/a.pdf', { onDismiss });

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://example.com/a.pdf',
      '_blank'
    );
    expect(viewer.opener).toBeNull();

    jest.advanceTimersByTime(1000);
    expect(onDismiss).not.toHaveBeenCalled();

    viewer.closed = true;
    jest.advanceTimersByTime(2000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('rejects when the browser blocks the tab', async () => {
    mockWindowOpen.mockReturnValue(null);

    await expect(open('https://example.com/a.pdf')).rejects.toThrow('blocked');
  });

  it('rejects native file paths', async () => {
    await expect(open('file:///tmp/a.pdf')).rejects.toThrow('on web');
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });
});
