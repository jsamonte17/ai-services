import { Wit, log } from 'node-wit';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('Bot');
const sessions = {};

export function findOrCreateSession(fbid: string): Promise<any> {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach((k) => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });

  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = { fbid: fbid, context: {} };
  }

  return sessionId;
}

export function getWit(configService: ConfigService) {
  const WIT_TOKEN = configService.get('WIT_TOKEN');
  logger.log(WIT_TOKEN, log.INFO);

  const actions = {
    hello(contextMap) {
      console.log({ contextMap });
      return { context_map: { ...contextMap, order_confirmation: 'PIZZA42' } };
    },
  };
  console.log({ actions });
  return new Wit({
    accessToken: WIT_TOKEN,
    actions,
    logger,
  });
}

export function message(params, configService: ConfigService) {
  return new Promise((resolve, reject) => {
    try {
      const WIT_TOKEN = configService.get('WIT_TOKEN');
      logger.log(WIT_TOKEN, log.INFO);

      const actions = {
        conversation_started(contextMap) {
          console.dir(contextMap, { depth: null });
          return {
            context_map: { ...contextMap, greetings: 'PIZZA42' },
          };
        },
      };
      console.log({ actions });
      const client = new Wit({
        accessToken: WIT_TOKEN,
        actions,
        logger: new log.Logger(log.DEBUG), // optional
      });

      const result = client.message('set an alarm tomorrow at 7am');

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}
