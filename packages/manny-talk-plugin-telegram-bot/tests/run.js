const { MannyTalk } = require('@manny-talk/manny-talk');
const telegramPlugin = require(`${__dirname}/../build`);

console.log('telegramPlugin', telegramPlugin);

async function main() {
  const mannyTalk = new MannyTalk({
    defaultBrain: 'echo',
    plugins: {
      echo: {},
    },
  });

  let inputCount = 1;
  mannyTalk.addPlugin('telegram', telegramPlugin.default, {
    passwordRequired: false,
    token: process.env.TOKEN,
  });
  mannyTalk.addPlugin('echo', {
    brain: {
      start: async function () {
        return {
          process: async function (input) {
            inputCount += 1;
            return {
              messages: [input.message],
              quickReplies:
                inputCount % 2 // only every one in 2 messages has quick replies
                  ? [
                      { label: 'Option A', speak: 'A' },
                      { label: 'Option B', speak: 'B' },
                      { label: 'Option C', speak: 'C' },
                    ]
                  : undefined,
            };
          },
        };
      },
    },
  });
  await mannyTalk.start();
}

if (!process.env.TOKEN) {
  console.log('Set the env variable TOKEN to a valid Telegram bot token.');
  process.exit(1);
}

main();
