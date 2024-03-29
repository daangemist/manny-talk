# Manny Talk

This is generic platform, build on Node.js that routes commands and conversations from voice or text-based clients to 3rd party or custom backends. Functionality is added via plugins or your own custom handlers (available when running as module).

Checkout the [**Plugins**](#Plugins) section for more information on available plugins and how to implement your own custom code.

This is the core package for Manny Talk. It can be run as a stand-alone server,
or be used as a module within your own application.

# Setup

There are two different ways of using Manny Talk. It can be integrated into your application
as a module, or run as a standalone server.

## Module

You can import the `@manny-talk/manny-talk` module into your application, together with any
plugins you want.

    npm i @manny-talk/manny-talk

In the initialization part of your app initialize Manny Talk:

```typescript
import { MannyTalk } from '@manny-talk/manny-talk';
import telegramBot from '@manny-talk/manny-talk-plugin-telegram-bot';

const mannyTalk = new MannyTalk({
  defaultBrain: 'echo',
  plugins: {
    echo: {},
  },
});
mannyTalk.addPlugin('telegram', telegramBot, {
  token: process.env.TELEGRAM_TOKEN,
});
mannyTalk.addPlugin('echo', {
  brain: {
    start: async function () {
      return {
        process: async function (input) {
          return {
            messages: [input.message],
          };
        },
      };
    },
  },
});
```

The example above shows:

- The creation of a Manny Talk instance, with a plugin called `echo` as the default _brain_.
  The brain is a function which processes the input generated by a _client_ and returns a
  response.
- The use of the Telegram bot plugin to act as a _client_, which means that it will handle input and output.
- The `defaultBrain` in the configuration is set to `echo` which means that if none of the configured _brainSelectors_ have a reply, this _brain_ will give the reply. (There are no brainSelectors configured in this example, and what it is is explained later in this README).
- A custom plugin is added, that registers a _brain_. Its only function is to take the input
  and echo it back.
- Note that there are two ways to provide the configuration for a plugin, in the global Manny Talk
  configuration, in the `plugins` object. Or when registering the `plugin`.

## Standalone

This method of running Manny is currently in beta. It _should_ work by executing:

```bash
npm i -g @manny-talk/manny-talk
manny-talk -c config.json
```

See [config.json.dist](config.json.dist) for more details on the configuration to
provide.

# Plugins

Plugins can be installed by running npm install --save <plugin-package-name> (either for your project, or in the plugins folder in standalone mode). Then create an entry in the `config.json` file in the `plugins` attribute with the key of the plugin. Include any additional configuration information as explained in the plugin readme.

Implementing your own is simple plugin. You need to implement a npm module which exports an object with a client, brain, listener or brainSelector attribute, which is a function. See the existing [plugins](https://github.com/daangemist/manny-talk/tree/main/packages) for reference.

## Overview

| Name         | Type   | Key      | Description                                               | Installation                                             | URL                                                                                                                          |
| ------------ | ------ | -------- | --------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Telegram Bot | Client | telegram | Enables a bot with the Telegram Bot API for input/output. | `npm install @manny-talk/manny-talk-plugin-telegram-bot` | [manny-talk-plugin-telegram-bot](https://github.com/daangemist/manny-talk/tree/main/packages/manny-talk-plugin-telegram-bot) |

## Implementing your own

### The basics

A plugin is represented by an object with one or more function. Possible values are:

- client
- brain
- brainSelector
- listener
- http

Each of these types is expected to be an object with an attribute `start` which should be a function that initializes/starts the plugin and return a promise.

More explanation is needed on the topic, but the Typescript types might already explain some inner workings.

### Types

```typescript
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
  speak: (reply: OutgoingMessage) => Promise<void>;
};

export type PluginBrainSelector = {
  start: (config: PluginConfig) => Promise<BrainSelector>;
};

export type BrainSelector = (
  brains: Record<string, Brain>,
  input: IncomingMessage
) => Promise<BrainSelectorResult | false>;

export type PluginListener = {
  start: (config: PluginConfig, eventEmitter: EventEmitter) => Promise<void>;
};
```

# Contributing

Contributions are welcome. This does not necessarily have to be code, it can also be updated documentation, tutorials, bug reports or pull requests.

Please create an [issue](https://github.com/daangemist/manny-talk/issues/new/choose) to propose a feature you want to implement, so that the details can be discussed in advance.
