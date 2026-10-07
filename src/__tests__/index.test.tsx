import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { open } from '../index';

const mockHandlers = new Set<() => void>();
const mockOpen = jest.fn<(path: string, options: object) => Promise<void>>();

jest.mock('../NativeFileViewerTurbo', () => ({
  __esModule: true,
  default: {
    open: (path: string, options: object) => mockOpen(path, options),
    onViewerDidDismiss: (handler: () => void) => {
      mockHandlers.add(handler);
      return { remove: () => mockHandlers.delete(handler) };
    },
  },
}));

const dismiss = () => [...mockHandlers].forEach((handler) => handler());

beforeEach(() => {
  mockHandlers.clear();
  mockOpen.mockReset();
  mockOpen.mockResolvedValue(undefined);
});

describe('open', () => {
  it.each([
    ['file:///tmp/My%20File.pdf', '/tmp/My File.pdf'],
    ['file:///tmp/Invoice%20%231.pdf', '/tmp/Invoice #1.pdf'],
    [
      'content://com.example.provider/doc%3A1',
      'content://com.example.provider/doc%3A1',
    ],
  ])('normalizes %s', async (path, expected) => {
    await open(path);

    expect(mockOpen).toHaveBeenCalledWith(expected, {});
  });

  it('calls onDismiss once and does not pass it to native', async () => {
    const onDismiss = jest.fn();

    await open('/tmp/a.pdf', { displayName: 'A', onDismiss });
    dismiss();
    dismiss();

    expect(mockOpen).toHaveBeenCalledWith('/tmp/a.pdf', { displayName: 'A' });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('removes the listener when native open rejects', async () => {
    const onDismiss = jest.fn();
    mockOpen.mockRejectedValueOnce(new Error('File not supported'));

    await expect(open('/tmp/a.pdf', { onDismiss })).rejects.toThrow();
    dismiss();

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('drops the listener of a previous open()', async () => {
    const first = jest.fn();
    const second = jest.fn();

    await open('/tmp/a.pdf', { onDismiss: first });
    await open('/tmp/b.pdf', { onDismiss: second });
    dismiss();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
