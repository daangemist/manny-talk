const { MannyTalk } = require('@manny-talk/manny-talk-core');
const telegramPlugin = require(`${__dirname}/../build`);

console.log('telegramPlugin', telegramPlugin);

async function main() {
  const mannyTalk = new MannyTalk({
    defaultBrain: 'echo',
    plugins: {
      echo: {},
      telegram: {
        passwordRequired: false,
        token: process.env.TOKEN,
      },
    },
  });

  mannyTalk.addPlugin('telegram', telegramPlugin.default);
  mannyTalk.addPlugin('echo', {
    brain: {
      start: async function () {
        return {
          process: async function (input) {
            return {
              message: input.message,
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
