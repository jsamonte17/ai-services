import { RequestOptions } from 'openai/core';
import { RunCreateParamsBaseStream } from 'openai/lib/AssistantStream';
import { MessageCreateParams } from 'openai/resources/beta/threads/messages';
import { ThreadCreateParams } from 'openai/resources/beta/threads/threads';

export interface AssistantInterface {
  conversationId: string;
  threadId?: string;
  body: MessageCreateParams;
  options?: RequestOptions;
}

export interface CreateThreadInterface {
  conversationId: string;
  body: ThreadCreateParams;
  options?: RequestOptions;
}

export interface CreateARunInterface {
  threadId: string;
  body: RunCreateParamsBaseStream;
  options?: RequestOptions;
}

export interface RetrieveARunInterface {
  threadId: string;
  runId: string;
}

export interface QueueAiReplyInterface {
  conversationId: string;
  threadId: string;
  body: MessageCreateParams;
  senderPsid: string;
  recipientPageId: string;
}
