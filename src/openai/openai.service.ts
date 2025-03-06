import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAi from 'openai';
import {
  AssistantInterface,
  CreateARunInterface,
  CreateThreadInterface,
  QueueAiReplyInterface,
  RetrieveARunInterface,
} from './interface/assistant.interface';
import { ConversationsModel } from '@modules/models/conversations.model';
import { Thread } from 'openai/resources/beta/threads/threads';
import { LeadsModel } from '@modules/models/leads.model';
import { SyncAiLeadInterface } from './interface/syncLead.interface';
import { IntercomService } from '@modules/intercom/intercom.service';
import { UpdateIntercomLeadInterface } from '@modules/intercom/interface/update.lead.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const logger = new Logger('OpenAI');

@Injectable()
export class OpenaiService {
  private openai = new OpenAi({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  constructor(
    private readonly configService: ConfigService,
    private readonly intercomService: IntercomService,
    @InjectQueue('queueOpenAiReply') private readonly queueOpenAiReply: Queue,
  ) {}

  assistantService(data: AssistantInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      logger.log(
        `Asking bot to reply to question with data: ${JSON.stringify(data)}`,
      );
      try {
        const { conversationId, body, options } = data;
        let threadId = data.threadId;
        const assistantId = this.configService.get('OPENAI_ASSISTANT_ID');
        const vectorStoreId = this.configService.get('OPENAI_VECTOR_STORE_ID');

        // @Todo: check if threadId still valid

        if (!threadId) {
          const threadPayload: CreateThreadInterface = {
            conversationId,
            body: {
              tool_resources: {
                file_search: {
                  vector_store_ids: [
                    this.configService.get('OPENAI_VECTOR_STORE_ID'),
                  ],
                },
              },
            },
            options,
          };

          const thread = await this.assistantCreateThreadService(threadPayload);

          threadId = thread.id;
        }

        await this.openai.beta.threads.messages
          .create(threadId, body, options)
          .catch((err) => {
            logger.error(
              `Error in this.openai.beta.threads.messages.create: ${err}`,
            );
            throw err;
          });

        const runPayload: CreateARunInterface = {
          threadId,
          // this is not being use anymore since the options.body overrides the assistant_id but still required by the function proceed
          body: {
            assistant_id: assistantId,
          },
          // work around to attach vector store id. Setting verctor store id is not working in assistantCreateThreadService
          options: {
            body: {
              assistant_id: assistantId,
              tool_resources: {
                file_search: {
                  vector_store_ids: [vectorStoreId],
                },
              },
              // max_completion_tokens: 1500,
            },
          },
        };
        const run = await this.createARunService(runPayload);

        // retrieve a run and wait for it to complete
        const runId = run.id;
        await this.retrieveARunService({
          threadId,
          runId,
        });

        // get message from response
        const messages = await this.listMessagesService(threadId);

        // Extract the assistant's reply from the response
        const aiReply = messages.data[0].content[0].text.value;
        logger.log(`Ai replied: ${aiReply.substring(0, 100)}`);
        resolve(aiReply);
      } catch (err) {
        logger.error(
          `Error in assistantService: ${JSON.stringify(err, null, 2)}`,
        );

        reject(err);
      }
    });
  }

  assistantCreateThreadService(
    payload: CreateThreadInterface,
  ): Promise<Thread> {
    return new Promise(async (resolve, reject) => {
      try {
        const { conversationId, body, options } = payload;

        const thread = await this.openai.beta.threads.create(body, options);

        // save to database
        await ConversationsModel.findOrCreate({
          where: { conversationId },
          defaults: {
            conversationId,
            threadId: thread.id,
          },
        }).then(async ([conversation, created]) => {
          if (!created) {
            conversation.set({ threadId: thread.id });
            await conversation.save();
          }

          return created;
        });

        resolve(thread);
      } catch (err) {
        logger.error(
          `assistantCreateThreadService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  createARunService(data: CreateARunInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { threadId, body, options } = data;

        this.openai.beta.threads.runs
          .create(threadId, body, options)
          .then(resolve);
      } catch (err) {
        logger.error(`createARunService: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  retrieveARunService(data: RetrieveARunInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { threadId, runId } = data;

        return this.openai.beta.threads.runs
          .retrieve(threadId, runId)
          .then(async (response) => {
            const { status } = response;

            if (status !== 'completed' && status !== 'incomplete') {
              setTimeout(async () => {
                await this.retrieveARunService(data).then(resolve);
              }, 1000);
            } else if (status === 'incomplete') {
              throw 'Run incomplete';
            } else {
              resolve(response);
            }
          });
      } catch (err) {
        logger.error(`retrieveARunService: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  listMessagesService(threadId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.openai.beta.threads.messages.list(threadId).then(resolve);
      } catch (err) {
        logger.error(`listMessagesService: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  extractProfileDetailsService(text: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.openai.chat.completions
          .create({
            // @Note: don't use gpt-4o-mini, it can't return null if title not found
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `If the message has a "TITLE: PERSONAL DETAILS" as a signal, then extract profile details in json format. If no title is found, then return null. You need to rename the following: (full_name to fullName, age to age, gender to sex, phone_number to contactNo, current_city to city, employment_sector to employmentSector, email to email). If ever the age is given the exact value, change it to range instead due to privacy concerns (18-24, 25-34, 35-44, 45-54, 55-64, 65 and above, Did not specify).`,
              },
              {
                role: 'user',
                content: text,
              },
            ],
          })
          .then((response) => {
            const { choices } = response;
            const { content } = choices[0].message;
            const jsonContent = content
              .replace('```json\n', '')
              .replace('```', '');

            const data = JSON.parse(jsonContent);

            resolve(data);
          });
      } catch (err) {
        logger.error(
          `extractProfileDetailsService: ${JSON.stringify(err, null, 2)}`,
        );
        reject(err);
      }
    });
  }

  syncAiLeadService(payload: SyncAiLeadInterface): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { senderPsid } = payload;

        return LeadsModel.findOrCreate({
          where: { senderPsid },
          defaults: { ...payload },
        }).then(async ([leadInstance]) => {
          const lead = leadInstance.toJSON();

          // sync lead with intercom
          const updatePayload: UpdateIntercomLeadInterface = {
            id: lead.contactId,
            name: payload.fullName,
            email: payload.email,
            phone: payload.contactNo,
            customAttributes: {
              Age: payload.age,
              Sex: payload.sex,
              City: payload.city,
              'Employment Sector': payload.employmentSector,
              Source: payload.source,
            },
          };

          await this.intercomService.updateIntercomLeadService(updatePayload);

          // save changes into the database
          leadInstance.set({ ...payload });
          await leadInstance.save();

          resolve(leadInstance.toJSON());
        });
      } catch (err) {
        logger.error(`syncAiLeadService: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  htmlParserService(text: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        return this.openai.chat.completions
          .create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Your job is to return a parsed html string. You need to return it as a text with no html tags. It has to preserve new line and other syntax that will be understand by terminal.`,
              },
              {
                role: 'user',
                content: text,
              },
            ],
          })
          .then((response) => {
            const { choices } = response;
            const { content } = choices[0].message;

            resolve(content);
          });
      } catch (err) {
        logger.error(`htmlParser: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }

  queueOpenAiReplyService(payload: QueueAiReplyInterface): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        logger.debug(`queueAiReplyService: ${JSON.stringify(payload)}`);
        this.queueOpenAiReply
          .add('queueOpenAiReply', payload)
          .then(resolve)
          .catch((err) => {
            reject(err);
          });
      } catch (error) {
        logger.error(
          `Error in queueOpenAiReplyService: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  retrieveThreadService(payload: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        logger.debug(`retrieveThreadService: ${JSON.stringify(payload)}`);
        this.openai.beta.threads
          .retrieve(payload.threadId)
          .then(resolve)
          .catch((err) => {
            throw err;
          });
      } catch (error) {
        logger.error(
          `Error in retrieveThreadService: ${JSON.stringify(error, null, 2)}`,
        );
        reject(error);
      }
    });
  }

  openAiExtractCitys(city): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        return this.openai.chat.completions
          .create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Your job is to return the city from address. You need to return it as a text with no html tags. Take note that the same city has to be returned the format. For example: 71 Mulawinan St. Lawang Bato Val. City is equivalent to Valenzuela City.`,
              },
              {
                role: 'user',
                content: city,
              },
            ],
          })
          .then((response) => {
            const { choices } = response;
            const { content } = choices[0].message;

            resolve(content);
          });
      } catch (err) {
        logger.error(`openAiExtractCity: ${JSON.stringify(err, null, 2)}`);
        reject(err);
      }
    });
  }
}
