import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Switch, Text, TextInput, View } from 'react-native';
import {
  appendAssistantMessage,
  appendUserMessage,
  buildChatMessage,
  type ChatThreadMessage,
  canSendChatText,
  formatAnswerMeta,
} from '../src/chat/chat-helpers.ts';
import { demoCubeClient } from '../src/demo/demo-services.ts';
import { colors, ui } from './ui.ts';

let messageSeq = 0;
function nextId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}-${messageSeq}`;
}

export default function ChatScreen() {
  const [thread, setThread] = useState<ChatThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [allowInternet, setAllowInternet] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async () => {
    if (!canSendChatText(draft) || sending) return;

    const text = draft.trim();
    const userId = nextId('user');
    setDraft('');
    setError(null);
    setSending(true);
    setThread((prev) => appendUserMessage(prev, { id: userId, text, allowInternet }));

    try {
      const response = await demoCubeClient.chat(buildChatMessage({ text, allowInternet, profileId: null }));
      setThread((prev) => appendAssistantMessage(prev, { id: nextId('assistant'), response }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }, [allowInternet, draft, sending]);

  return (
    <View style={[ui.screen, { padding: 16 }]}>
      <Text style={ui.title} accessibilityRole="header">
        Chat
      </Text>
      <Text style={ui.subtitle}>
        Text chat with the cube via CubeClient.chat. Phone mic/speaker satellite is deferred (human-blocked).
      </Text>

      <FlatList
        style={{ flex: 1 }}
        data={thread}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
        ListEmptyComponent={<Text style={ui.muted}>No messages yet — ask the cube something.</Text>}
        renderItem={({ item }) => (
          <View
            style={[ui.row, item.role === 'user' ? { borderColor: colors.primary } : null]}
            accessibilityLabel={
              item.role === 'user'
                ? `You: ${item.text}`
                : `Cube: ${item.text}. ${formatAnswerMeta({
                    usedInternet: item.usedInternet ?? false,
                    privacyMode: item.privacyMode ?? 'paranoid',
                  })}`
            }
          >
            <Text style={ui.rowTitle}>{item.role === 'user' ? 'You' : 'Cube'}</Text>
            <Text style={ui.statusLine}>{item.text}</Text>
            {item.role === 'user' && item.allowInternet ? <Text style={ui.rowMeta}>Allow internet: on</Text> : null}
            {item.role === 'assistant' && item.usedInternet !== undefined && item.privacyMode ? (
              <Text style={ui.rowMeta}>
                {formatAnswerMeta({ usedInternet: item.usedInternet, privacyMode: item.privacyMode })}
              </Text>
            ) : null}
          </View>
        )}
      />

      <View style={ui.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={ui.rowTitle}>Allow internet</Text>
            <Text style={ui.rowMeta}>Same rules as the cube — only forwards allowInternet.</Text>
          </View>
          <Switch
            value={allowInternet}
            onValueChange={setAllowInternet}
            accessibilityLabel="Allow internet for next message"
          />
        </View>

        <TextInput
          style={ui.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message the cube…"
          editable={!sending}
          accessibilityLabel="Chat message"
          onSubmitEditing={() => void send()}
          returnKeyType="send"
        />

        <Pressable
          style={[ui.button, (!canSendChatText(draft) || sending) && { opacity: 0.5 }]}
          onPress={() => void send()}
          disabled={!canSendChatText(draft) || sending}
          accessibilityRole="button"
          accessibilityLabel="Send chat message"
        >
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={ui.buttonText}>Send</Text>}
        </Pressable>

        {error ? <Text style={ui.error}>{error}</Text> : null}
      </View>
    </View>
  );
}
