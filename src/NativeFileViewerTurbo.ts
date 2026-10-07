import {
  TurboModuleRegistry,
  type EventSubscription,
  type TurboModule,
} from 'react-native';

type EventEmitter<T> = (
  handler: (arg: T) => void | Promise<void>
) => EventSubscription;

export enum DoneButtonPosition {
  left = 'left',
  right = 'right',
}

export type Options = {
  displayName?: string;
  doneButtonTitle?: string;
  showOpenWithDialog?: boolean;
  showAppsSuggestions?: boolean;
  doneButtonPosition?: DoneButtonPosition;
};

export interface Spec extends TurboModule {
  open(path: string, options: Options): Promise<void>;
  readonly onViewerDidDismiss: EventEmitter<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FileViewerTurbo');
