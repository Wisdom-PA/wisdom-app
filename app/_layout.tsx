import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="pairing" options={{ title: 'Pair cube', presentation: 'card' }} />
        <Stack.Screen name="wifi" options={{ title: 'Wi-Fi setup', presentation: 'card' }} />
      </Stack>
    </>
  );
}
