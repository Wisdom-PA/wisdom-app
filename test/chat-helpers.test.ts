import { describe, expect, it } from 'vitest';
import type { ChatResponse } from '../src/api/types.ts';
import {
  answerSource,
  answerSourceLabel,
  appendAssistantMessage,
  appendUserMessage,
  buildChatMessage,
  canSendChatText,
  formatAnswerMeta,
  privacyModeLabel,
} from '../src/chat/chat-helpers.ts';

const sampleResponse: ChatResponse = {
  chainId: 'chain-1',
  reply: 'Hello from the cube',
  usedInternet: false,
  privacyMode: 'paranoid',
  actions: [],
};

describe('chat helpers', () => {
  describe('canSendChatText', () => {
    it('rejects blank and whitespace-only text', () => {
      expect(canSendChatText('')).toBe(false);
      expect(canSendChatText('   ')).toBe(false);
    });

    it('accepts trimmed non-empty text within length', () => {
      expect(canSendChatText('  hi  ')).toBe(true);
      expect(canSendChatText('a'.repeat(2000))).toBe(true);
    });

    it('rejects text over 2000 chars', () => {
      expect(canSendChatText('a'.repeat(2001))).toBe(false);
    });
  });

  describe('buildChatMessage', () => {
    it('trims text and forwards allowInternet', () => {
      expect(buildChatMessage({ text: '  lights on  ', allowInternet: true, profileId: 'p1' })).toEqual({
        text: 'lights on',
        allowInternet: true,
        profileId: 'p1',
      });
    });

    it('normalises empty profileId to null', () => {
      expect(buildChatMessage({ text: 'hi', allowInternet: false, profileId: '  ' })).toEqual({
        text: 'hi',
        allowInternet: false,
        profileId: null,
      });
      expect(buildChatMessage({ text: 'hi', allowInternet: false })).toEqual({
        text: 'hi',
        allowInternet: false,
        profileId: null,
      });
    });
  });

  describe('source and privacy labels', () => {
    it('maps usedInternet to source labels', () => {
      expect(answerSource(false)).toBe('on-device');
      expect(answerSource(true)).toBe('online');
      expect(answerSourceLabel(false)).toBe('On-device');
      expect(answerSourceLabel(true)).toBe('Online');
    });

    it('labels privacy modes', () => {
      expect(privacyModeLabel('paranoid')).toBe('Paranoid');
      expect(privacyModeLabel('normal')).toBe('Normal');
    });

    it('formats answer meta for UI', () => {
      expect(formatAnswerMeta(sampleResponse)).toBe('On-device · Privacy: Paranoid');
      expect(formatAnswerMeta({ ...sampleResponse, usedInternet: true, privacyMode: 'normal' })).toBe(
        'Online · Privacy: Normal'
      );
    });
  });

  describe('thread append', () => {
    it('appends user then assistant messages', () => {
      const withUser = appendUserMessage([], { id: 'u1', text: '  hello  ', allowInternet: true });
      expect(withUser).toEqual([{ id: 'u1', role: 'user', text: 'hello', allowInternet: true }]);

      const withAssistant = appendAssistantMessage(withUser, {
        id: 'a1',
        response: { ...sampleResponse, usedInternet: true, privacyMode: 'normal' },
      });
      expect(withAssistant).toHaveLength(2);
      expect(withAssistant[1]).toEqual({
        id: 'a1',
        role: 'assistant',
        text: 'Hello from the cube',
        usedInternet: true,
        privacyMode: 'normal',
      });
    });
  });
});
