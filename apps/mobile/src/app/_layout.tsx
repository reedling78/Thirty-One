import { Stack } from 'expo-router';
import { DevSettingsProvider } from '@/settings/DevSettings';
import { SettingsProvider } from '@/settings/Settings';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <DevSettingsProvider>
        <Stack
          screenOptions={{ headerTitleAlign: 'center', headerBackButtonDisplayMode: 'minimal' }}
        >
          <Stack.Screen name="index" options={{ title: 'ThirtyOne' }} />
          <Stack.Screen name="practice" options={{ title: 'Practice' }} />
          <Stack.Screen name="rules" options={{ title: 'How to play' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </DevSettingsProvider>
    </SettingsProvider>
  );
}
