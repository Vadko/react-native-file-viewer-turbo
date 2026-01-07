import { TurboModuleRegistry, type TurboModule } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export type Options = {
  displayName?: string;
  doneButtonTitle?: string;
  showOpenWithDialog?: boolean;
  showAppsSuggestions?: boolean;
  doneButtonPosition?: 'left' | 'right';
};

export interface Spec extends TurboModule {
  open(path: string, options: Options): Promise<void>;
  readonly onViewerDidDismiss: EventEmitter<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FileViewerTurbo');
