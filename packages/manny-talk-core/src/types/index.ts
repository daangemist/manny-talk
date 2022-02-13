export const isError = (tbd?: unknown): tbd is Error =>
  typeof tbd === 'object' &&
  // @ts-expect-error When checking message is an attribute of object({}) ts does not allow to check if .message exists.
  typeof tbd.message !== 'undefined';

export const isErrorWithCode = (tbd?: unknown): tbd is ErrorWithCode =>
  // @ts-expect-error When checking message is an attribute of object({}) ts does not allow to check if .message exists.
  isError(tbd) && typeof tbd.code !== 'undefined';

export type Config = {
  plugins: Record<string, Record<string, any>>;
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

export type Plugin = () => Promise<StartedPlugin>;

export type StartedPlugin = {
  // TODO: add types here.
  brain?: PluginBrain;
  brainSelector?: PluginBrainSelector;
  client?: PluginClient;
  http: PluginHttp;
  listener: PluginListener;
};

export type PluginBrain = {
  start: any;
};

export type Brain = {
  process: any;
};

export type PluginClient = {
  start: any;
};
export type Client = any;

export type PluginBrainSelector = {
  start: any;
};

export type BrainSelector = (
  brains: Record<string, Brain>,
  input: IncomingMessage
) => Promise<BrainSelectorResult | false>;

export type BrainSelectorResult = {
  brain: Brain;
  updatedInput?: IncomingMessage;
};

export type PluginHttp = {
  start: any;
};

export type PluginListener = {
  start: any;
};

export type IncomingMessage = {
  plugin: string;
  message: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  profileId?: string;
};

export type OutgoingMessage = any;

export type SpeakCallback = (
  outgoingMessage: OutgoingMessage
) => Promise<void> | void;
