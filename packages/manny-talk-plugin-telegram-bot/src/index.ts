import { TelegramClient, TelegramTypes } from 'messaging-api-telegram';
import {
  OutgoingMessage,
  LoadedPlugin,
  Client,
  ClientStart,
} from '@manny-talk/manny-talk';
import Debug from 'debug';
import { Config } from './types';
import { delay } from './utils';

const debug = Debug('manny-talk:plugin:telelegram-bot');

let bot: TelegramClient;
const allowedChatIds: Record<string, boolean> = {};
let passwordRequired = false;
let configuredPassword: string;
let clientStart: ClientStart;
let lastUpdate: number | undefined = undefined;

function getBot(): TelegramClient {
  if (!bot) {
    throw new Error('Bot is not initialized.');
  }
  return bot;
}

function isChatIdAllowed(chatId: string) {
  return allowedChatIds[chatId] === true;
}

function isChattingAllowed(chatId: string): boolean {
  return !passwordRequired || isChatIdAllowed(chatId);
}

function allowChatId(chatId: string): void {
  allowedChatIds[chatId] = true;
}

async function processTelegramTextMessage(message: TelegramTypes.Message) {
  const chatId = `${message.chat.id}`;
  const heard = message.text ?? ''; // the captured "input"

  if (passwordRequired && heard === configuredPassword) {
    allowChatId(chatId);
    getBot().sendMessage(chatId, 'Access is granted.');
    return;
  }

  const allowed = await isChattingAllowed(chatId);
  if (!allowed) {
    getBot().sendMessage(chatId, 'Please send me the password first.');
    return;
  }

  clientStart.heard({
    message: heard,
    profileId: `${message?.from?.id}` ?? '',
    sessionId: chatId,
  });
}

async function speak(message: OutgoingMessage) {
  if (!message.sessionId) {
    throw new Error('No sessionId in the message.');
  }

  bot.sendMessage(message.sessionId ?? '', message.message);
}

async function startUpdateListener(): Promise<void> {
  do {
    try {
      const updates = await getBot().getUpdates({
        allowedUpdates: ['message'],
        offset: typeof lastUpdate === 'undefined' ? undefined : lastUpdate + 1,
      });
      debug('Found %d updates.', updates.length);

      // Display the information
      await Promise.all(
        updates.map((update) => {
          debug(`Incoming update %s: %o.`, update.updateId, update);
          lastUpdate = update.updateId;

          if (!update.message) {
            debug(
              'There was no message property in the update, skipping it. %o',
              update
            );
            return;
          }
          return processTelegramTextMessage(update.message);
        })
      );
      await delay(500);
    } catch (error) {
      debug('Unable to fetch update, trying again: %s', error);
    }
  } while (true);
}

async function start(
  config: Config,
  providedClientStart: ClientStart
): Promise<Client> {
  if (!config.token) {
    throw new Error('No Telegram token provided.');
  }
  if (config.password) {
    passwordRequired = true;
    configuredPassword = config.password;
  }

  if (Array.isArray(config.allowedChatIds)) {
    config.allowedChatIds.forEach((chatId) => {
      allowedChatIds[chatId] = true;
    });
  }
  clientStart = providedClientStart;

  bot = new TelegramClient({
    accessToken: config.token,
  });
  // Check that the token is valid.
  debug('Bot information %o', await bot.getMe());

  startUpdateListener();

  return { speak };
}

const plugin: LoadedPlugin = {
  client: {
    // @ts-expect-error The manny-talk config is not typed.
    start,
  },
};

export default plugin;
