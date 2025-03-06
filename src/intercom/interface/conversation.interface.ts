import { MessageType, ReplyToConversationMessageType } from 'intercom-client';
import { ContactType } from 'intercom-client/dist/conversation/conversation.types';

export interface CreateConversationInterface {
  contactId: string;
  type?: ContactType;
  body: string;
  messageType?: MessageType;
  attachmentUrls?: string[];
}

export interface ReplyToConversationInterface {
  id: string;
  body: string;
  intercomUserId?: string;
  email?: string;
  attachmentUrls?: string[];
}

export interface AdminReplyToConversationInterface {
  id: string;
  adminId: string;
  messageType: ReplyToConversationMessageType;
  body: string;
  attachmentUrls?: Array<string>;
}

export interface SendConversationMessageInterface {
  recipientPageId: string;
  senderPsid: string;
  contactId: string;
  body: string;
  attachmentUrls?: Array<string>;
}

export interface LiveAgentRepliedHookInterface {
  conversationId: string;
  adminId: string;
  messageText: string;
}

export interface ConversationAssignedToInterface {
  conversationId: string;
  assignedTo: string;
}
