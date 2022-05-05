import EventEmitter from 'events';

export const isError = (tbd?: unknown): tbd is Error =>
  typeof tbd === 'object' &&
  // @ts-expect-error When checking message is an attribute of object({}) ts does not allow to check if .message exists.
  typeof tbd.message !== 'undefined';

export const isErrorWithCode = (tbd?: unknown): tbd is ErrorWithCode =>
  // @ts-expect-error When checking message is an attribute of object({}) ts does not allow to check if .message exists.
  isError(tbd) && typeof tbd.code !== 'undefined';

export function isDefaultExport<T>(tbd?: unknown): tbd is { default: T } {
  // @ts-expect-error When checking the type typescript does not allow to check if tbd has an attribute .default.
  return typeof tbd.default !== 'undefined';
}

export type Config = {
  plugins: Record<string, PluginConfig>;
  pluginStore?: {
    location?: string;
  };
  defaultBrain: string;
  brainStickiness?: number;
  http?: {
    enabled: boolean;
    port?: number;
  };
};

export interface ErrorWithCode extends Error {
  code: string;
}

export type Plugin = () => Promise<LoadedPlugin>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PluginConfig = Record<string, any>;

export type LoadedPlugin = {
  brain?: PluginBrain;
  brainSelector?: PluginBrainSelector;
  client?: PluginClient;
  http?: PluginHttp;
  listener?: PluginListener;
};

export type PluginBrain = {
  start: (config: PluginConfig) => Promise<Brain>;
};

export type Brain = {
  process: (input: IncomingMessageCore) => Promise<OutgoingMessage>;
};

export type PluginClient = {
  start: (config: PluginConfig, clientStart: ClientStart) => Promise<Client>;
};
export type Client = {
  speak: (message: OutgoingMessage) => Promise<void>;
};
export type ClientStart = {
  heard: (message: IncomingMessage) => Promise<void>;
  // Clients should use speak even when sending their own output, because of event listeners which also should be invoked.
  speak: (reply: OutgoingMessage) => Promise<void>;
};

export type PluginBrainSelector = {
  start: (config: PluginConfig) => Promise<BrainSelector>;
};

export type BrainSelector = (
  brains: Record<string, Brain>,
  input: IncomingMessageCore
) => Promise<BrainSelectorResult | false>;

export type BrainSelectorResult = {
  brain: Brain;
  updatedInput?: IncomingMessageCore;
};

// TODO fix this type when we get to enabling HTTP
export type PluginHttp = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  start: any;
};

export type PluginListener = {
  start: (config: PluginConfig, eventEmitter: EventEmitter) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Metadata = Record<string, any>;

export type IncomingMessage = {
  message: string;
  metadata?: Metadata;
  sessionId?: string;
  profileId?: string;
};

export interface IncomingMessageCore extends IncomingMessage {
  plugin: string;
}

export type OutgoingMessage = {
  messages: string[];
  metadata?: Metadata;
  sessionId?: string;
  profileId?: string;
  quickReplies?: QuickReply[];
};

export type QuickReply = {
  label?: string;
  speak: string;
};

export interface OutgoingMessageCore extends OutgoingMessage {
  plugin: string;
}
