import type { Options as NativeOptions } from './NativeFileViewerTurbo';

export type Options = Omit<NativeOptions, 'doneButtonPosition'> & {
  doneButtonPosition?: 'left' | 'right';
  onDismiss?: () => void;
};
