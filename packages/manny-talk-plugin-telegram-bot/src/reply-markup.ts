import { QuickReply } from '@manny-talk/manny-talk';
import { TelegramTypes } from 'messaging-api-telegram';

const MAX_HORIZONTAL = 5;

export default function generateReplyMarkup(
  maxCharacterWidth: number,
  quickReplies: QuickReply[]
): TelegramTypes.SendMessageOption['replyMarkup'] {
  const inlineKeyboard: Array<Array<TelegramTypes.InlineKeyboardButton>> = [];

  let row: TelegramTypes.InlineKeyboardButton[] = [];
  let charactersInRow = 0;

  quickReplies.forEach((quickReply) => {
    // Check if we have an existing row, where this reply will be too big for
    const closeRow =
      (charactersInRow > 0 &&
        (quickReply.label ?? quickReply.speak).length + charactersInRow >
          maxCharacterWidth) ||
      row.length >= MAX_HORIZONTAL;

    if (closeRow) {
      inlineKeyboard.push(row);
      row = [];
      charactersInRow = 0;
    }

    row.push({
      text: quickReply.label ?? quickReply.speak,
      callbackData: quickReply.speak,
    });
    charactersInRow += (quickReply.label ?? quickReply.speak).length;
  });

  if (row.length > 0) {
    // add the remaining buttons
    inlineKeyboard.push(row);
  }

  return {
    inlineKeyboard,
    oneTimeKeyboard: true,
  };
}
