import {
  IncomingMessage,
  OutgoingMessage,
  LoadedPlugin,
} from '@manny-talk/manny-talk';

async function process(message: IncomingMessage): Promise<OutgoingMessage> {
  return { message: `ECHO ${message.message}` };
}

async function start() {
  return { process };
}

export default async function (): Promise<LoadedPlugin> {
  return {
    brain: {
      start,
    },
  };
}
