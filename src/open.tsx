/// <reference lib="dom" />
import type { Options } from './types';

// Web: open the file in a new browser tab. The browser shows what it can (PDF,
// images, video, text) and downloads the rest. Native-only options are ignored.
export async function open(path: string, options: Options = {}): Promise<void> {
  if (/^(file|content):\/\//.test(path)) {
    throw new Error(
      `Cannot open ${path} on web: pass an http(s), blob: or data: URL.`
    );
  }

  const viewer = window.open(path, '_blank');
  if (!viewer) {
    throw new Error(
      'The browser blocked the new tab. Call open() directly from a user action.'
    );
  }
  // Keep the handle to detect closing, but don't let the opened page control this one.
  viewer.opener = null;

  const { onDismiss } = options;
  if (onDismiss) {
    const timer = setInterval(() => {
      if (viewer.closed) {
        clearInterval(timer);
        onDismiss();
      }
    }, 1000);
  }
}
