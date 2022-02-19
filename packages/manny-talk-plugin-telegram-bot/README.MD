# Manny Talk Plugin Telegram Bot

This is a plugin for the [https://github.com/daangemist/manny-talk](manny-talk)
project. The [Telegram bot API](https://core.telegram.org/bots/api) is used as a client for input.

# Configuration

Follow the instructions on the Telegram bot API explanation page to acquire a token for your bot. Place that token in your plugin configuration, for example:

```json
{
  "token": "<token goes here>",
  "password": "genie"
}
```

If you use the Manny Talk global configuration, use:

```json
{
  "plugins": {
    "telegram": {
      "token": "..."
    }
  }
}
```

The password configuration attribute is optional, and can be used to require a password
before someone can send input via the Telegram bot.

To not require a password, simply remove the attribute or set it to null.

### All options

| Attribute        | Type     | Required | Description                                                                                                                                                                                                  |
| ---------------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| token            | string   | yes      | The Telegram bot token to connect to the bot API.                                                                                                                                                            |
| password         | string   | no       | Require a password from someone before input is accepted.                                                                                                                                                    |
| allowedChatIds   | string[] | no       | Pre allow specific chat Identifiers, they do not require a password. Only works in combination with the `password` attribute.                                                                                |
| maxKeyboardWidth | number   | no       | The maximum number of characters allowed in the horizontal row of an Inline Keyboard. Is used for quick replies. If this number of characters is reached a new row will be created. Default value is **25**. |

# Setup

Manny Talk can run both standalone of as part of an existing application as a module.

## Module

When using Manny Talk as a module, do:

    npm i --save @manny-talk/manny-talk-plugin-telegram-bot

Then, in your application do:

```typescript
import telegramBot from '@manny-talk/manny-talk-plugin-telegram-bot';

// ... other code, initialization of Manny Talk as `const mannyTalk = ...`
mannyTalk.addPlugin('plugin', telegramPlugin);

// Or if you do not have the configuration in the global Manny Talk configuration at initialization:
mannyTalk.addPlugin('plugin', telegramPlugin);
```

In plain javascript:

```javascript
const telegramBot = require('@manny-talk/manny-talk-plugin-telegram-bot');

// ... other code, initialization of Manny Talk as `const mannyTalk = .
mannyTalk.addPlugin('plugin', telegramPlugin.default);
```

## Standalone

When running Manny Talk as a standalone server install the plugin at the
plugin location. At the plugin location (`$HOME/.manny-talk` by default), execute:

    npm install --save @manny-talk/manny-talk-plugin-telegram-bot

Then, add the `telegram` configuration in the `plugins` attribute of
the Manny Talk configuration and restart the server.

# Troubleshooting

This plugin uses [debug](https://www.npmjs.com/package/debug) to log
debug output. The prefix used is `manny-talk:plugin:telelegram-bot`. To see
the output, set the environment variable `DEBUG=manny-talk:plugin:telelegram-bot:*`.

# Development

This plugin is part of the Manny Talk mono repo at [github](https://github.com/daangemist/manny-talk).

To build this plugin, run: `npm run build`. To continuously build this plugin, run `npm run watch`.

To test whether it's working, configure an environment variable TOKEN that contains
the Telegram bot token to test with. For example:

```bash
export TOKEN=466931xxx:AAGKPfVjWyEOq3kIqIO1BP3u8Uxxx
npm run test
```

## Docker

When using the `docker-compose.yml` in the repository root, run that using: `docker-compose up`.
This will start up `npm run watch` for the `manny-talk-core` package. Open a second shell and run
`docker-compose exec node bash` to open a shell into the running container. Use
`cd packages/manny-talk-plugin-telegram-bot` to be able to execute command on this plugin.

# Contributing

Contributions are welcome. This does not necessarily have to be code, it can also be updated documentation, tutorials, bug reports or pull requests.

Please create an [Issue](https://github.com/daangemist/manny-talk/issues/new/choose) to propose a feature you want to implement, so that the details can be discussed in advance.
