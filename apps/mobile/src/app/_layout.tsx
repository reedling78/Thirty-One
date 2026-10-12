import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { DevSettingsProvider } from '@/settings/DevSettings';
import { SettingsProvider } from '@/settings/Settings';
import { FONTS } from '@/theme/fonts';
import { scaledType, useFontScale } from '@/theme/text';
import { color } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const scale = useFontScale();
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  const title = scaledType('title', scale);
  return (
    <SettingsProvider>
      <DevSettingsProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerTitleAlign: 'center',
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: { backgroundColor: color.baize },
            headerTintColor: color.onBaize,
            headerShadowVisible: false,
            headerTitleStyle: { fontFamily: title.fontFamily, fontSize: title.fontSize },
            contentStyle: { backgroundColor: color.baize },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'ThirtyOne', headerShown: false }} />
          <Stack.Screen name="practice" options={{ title: 'Practice' }} />
          <Stack.Screen name="rules" options={{ title: 'How to play' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="dev-cards" options={{ title: 'Card sheet' }} />
        </Stack>
      </DevSettingsProvider>
    </SettingsProvider>
  );
}
