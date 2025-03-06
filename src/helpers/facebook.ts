import { Logger } from '@nestjs/common';
import * as Bot from './bot';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('Facebook');

async function fbMessage(id, text, configService: ConfigService) {
  const FB_PAGE_TOKEN = configService.get('FB_PAGE_TOKEN');

  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
    .then((rsp) => rsp.json())
    .then((json) => {
      if (json.error && json.error.message) {
        throw new Error(json.error.message);
      }
      return json;
    });
}

export async function messageHandler(
  data: any,
  configService: ConfigService,
): Promise<any> {
  return new Promise((resolve, reject) => {
    // Parse the Messenger payload
    // See the Webhook reference
    // https://developers.facebook.com/docs/messenger-platform/webhook-reference
    const wit = Bot.getWit(configService);
    // const wit = Bot.message({}, configService);

    try {
      if (data.object === 'page') {
        data.entry.forEach((entry) => {
          entry.messaging.forEach((event) => {
            if (event.message && !event.message.is_echo) {
              // Yay! We got a new message!
              // We retrieve the Facebook user ID of the sender
              const sender = event.sender.id;

              // We could retrieve the user's current session, or create one if it doesn't exist
              // This is useful if we want our bot to figure out the conversation history
              const sessionId = Bot.findOrCreateSession(sender);
              console.log({ sessionId });
              // We retrieve the message content
              const { text, attachments } = event.message;

              if (attachments) {
                // We received an attachment
                // Let's reply with an automatic message
                fbMessage(
                  sender,
                  'Sorry I can only process text messages for now.',
                  configService,
                ).then(() => {
                  resolve(JSON.stringify(event));
                });
              } else if (text) {
                wit
                  .message(text)
                  .then((response) => {
                    // You can customize your response using these
                    logger.log({ response });
                    // For now, let's reply with another automatic message
                    // fbMessage(
                    //   sender,
                    //   `We've received your message: ${text}.`,
                    //   configService,
                    // );
                  })
                  .then(() => {
                    resolve(JSON.stringify(event));
                  })
                  .catch((err) => {
                    throw `Oops! Got an error from Wit: ${err.stack || err}`;
                  });
              }
            } else {
              resolve(JSON.stringify(event));
            }
          });
        });
      }
    } catch (error) {
      reject(error);
    }
  });
}
