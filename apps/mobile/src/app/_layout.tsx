import { Stack } from 'expo-router';
import { DevSettingsProvider } from '@/settings/DevSettings';

export default function RootLayout() {
  return (
    <DevSettingsProvider>
      <Stack screenOptions={{ headerTitleAlign: 'center' }}>
        <Stack.Screen name="index" options={{ title: 'ThirtyOne' }} />
        <Stack.Screen name="practice" options={{ title: 'Practice' }} />
        <Stack.Screen name="rules" options={{ title: 'How to play' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </DevSettingsProvider>
  );
}
