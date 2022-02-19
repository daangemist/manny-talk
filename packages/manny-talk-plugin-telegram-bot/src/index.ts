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
import generateReplyMarkup from './reply-markup';

const DEFAULT_KEYBOARD_WIDTH = 25;

const debug = Debug('manny-talk:plugin:telelegram-bot');

let bot: TelegramClient;
const allowedChatIds: Record<string, boolean> = {};
let passwordRequired = false;
let configuredPassword: string;
let clientStart: ClientStart;
let lastUpdate: number | undefined = undefined;
let keyboardMaxWidth = DEFAULT_KEYBOARD_WIDTH;

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

async function processTelegramTextMessage(
  message: TelegramTypes.Message,
  overriddenInput?: string // for a callbackQuery, there is a message, but the text attribute of the message is not the input.
) {
  const chatId = `${message.chat.id}`;
  const heard = overriddenInput ?? message.text ?? ''; // the captured "input"

  if (passwordRequired && heard === configuredPassword) {
    allowChatId(chatId);
    await getBot().sendMessage(chatId, 'Access is granted.');
    return;
  }

  const allowed = await isChattingAllowed(chatId);
  if (!allowed) {
    await getBot().sendMessage(chatId, 'Please send me the password first.');
    return;
  }

  await clientStart.heard({
    message: heard,
    profileId: `${message?.from?.id}` ?? '',
    sessionId: chatId,
  });
  if (message.replyMarkup) {
    // there was an inline keyboard set, remove it from the message.
    await getBot().editMessageReplyMarkup(
      {
        inlineKeyboard: [],
      },
      { messageId: message.messageId, chatId }
    );
  }
}

async function speak(message: OutgoingMessage) {
  if (!message.sessionId) {
    throw new Error('No sessionId in the message.');
  }

  if (!message.quickReplies) {
    bot.sendMessage(message.sessionId ?? '', message.message);
    return;
  }

  bot.sendMessage(message.sessionId ?? '', message.message, {
    replyMarkup: generateReplyMarkup(keyboardMaxWidth, message.quickReplies),
  });
}

async function startUpdateListener(): Promise<void> {
  do {
    try {
      const updates = await getBot().getUpdates({
        allowedUpdates: ['message', 'callback_query'],
        offset: typeof lastUpdate === 'undefined' ? undefined : lastUpdate + 1,
      });
      if (updates.length > 0) {
        debug('Found %d updates.', updates.length);
      }

      // Display the information
      await Promise.all(
        updates.map((update) => {
          debug(`Incoming update %s: %o.`, update.updateId, update);
          lastUpdate = update.updateId;

          const message =
            typeof update.callbackQuery?.message !== 'undefined'
              ? update.callbackQuery.message
              : update.message;
          if (!message) {
            debug(
              'There was no message property in the update, skipping it. %o',
              update
            );
            return;
          }
          return processTelegramTextMessage(
            message,
            // If this is a call back query,
            update.callbackQuery ? update.callbackQuery.data : undefined
          );
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
  keyboardMaxWidth = config.maxKeyboardWidth ?? DEFAULT_KEYBOARD_WIDTH;
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
