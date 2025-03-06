import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAi from 'openai';

const logger = new Logger('OpenAI');
const sessions = {};
const openai = new OpenAi();

export function chat(messages) {
  return new Promise(async (resolve, reject) => {
    // console.log({ openai });
    // console.dir(messages, { depth: null });
    // console.log('Replied to question');
    try {
      const completion = await openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo',
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;

      console.log('Sucessfully replied to question');
      console.log({ result });
      resolve(result);
    } catch (err) {
      console.log({ err });
      reject(err);
    }
  });
}
