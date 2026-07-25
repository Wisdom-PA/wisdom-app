import type { ChatMessage, ChatResponse } from '../api/types.ts';

export type AnswerSource = 'on-device' | 'online';

export interface ChatThreadMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Echo of the allowInternet flag sent with this user message. */
  allowInternet?: boolean;
  usedInternet?: boolean;
  privacyMode?: ChatResponse['privacyMode'];
}

const MAX_CHAT_TEXT = 2000;

export function canSendChatText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_CHAT_TEXT;
}

export function buildChatMessage(input: {
  text: string;
  allowInternet: boolean;
  profileId?: string | null;
}): ChatMessage {
  const profileId = input.profileId?.trim() || null;
  return {
    text: input.text.trim(),
    allowInternet: input.allowInternet,
    profileId,
  };
}

export function answerSource(usedInternet: boolean): AnswerSource {
  return usedInternet ? 'online' : 'on-device';
}

export function answerSourceLabel(usedInternet: boolean): string {
  return usedInternet ? 'Online' : 'On-device';
}

export function privacyModeLabel(mode: ChatResponse['privacyMode']): string {
  return mode === 'paranoid' ? 'Paranoid' : 'Normal';
}

/** Compact meta line for assistant bubbles (source + privacy). */
export function formatAnswerMeta(response: Pick<ChatResponse, 'usedInternet' | 'privacyMode'>): string {
  return `${answerSourceLabel(response.usedInternet)} · Privacy: ${privacyModeLabel(response.privacyMode)}`;
}

export function appendUserMessage(
  thread: ChatThreadMessage[],
  input: { id: string; text: string; allowInternet: boolean }
): ChatThreadMessage[] {
  return [
    ...thread,
    {
      id: input.id,
      role: 'user',
      text: input.text.trim(),
      allowInternet: input.allowInternet,
    },
  ];
}

export function appendAssistantMessage(
  thread: ChatThreadMessage[],
  input: { id: string; response: ChatResponse }
): ChatThreadMessage[] {
  return [
    ...thread,
    {
      id: input.id,
      role: 'assistant',
      text: input.response.reply,
      usedInternet: input.response.usedInternet,
      privacyMode: input.response.privacyMode,
    },
  ];
}
