import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo } from 'react-native';
import { color, type BackColor } from '@/theme/tokens';

export interface Settings {
  readonly sound: boolean;
  readonly haptics: boolean;
  /** Player's own choice. The OS reduce-motion setting is honoured regardless; see `motionReduced`. */
  readonly reduceMotion: boolean;
  /** Whether the guided first game has been completed (or skipped). */
  readonly guidedDone: boolean;
  /** Card back colourway. One pattern, four colours. */
  readonly backColor: BackColor;
  /**
   * The action island above the table (an A/B to settle by play). Off, your
   * panel carries the guide line and the KNOCK / Continue button.
   */
  readonly actionIsland: boolean;
}

const DEFAULTS: Settings = {
  sound: true,
  haptics: true,
  reduceMotion: false,
  guidedDone: false,
  backColor: 'blue',
  actionIsland: true,
};
const STORAGE_KEY = 'thirtyone.settings.v1';

interface SettingsApi {
  readonly settings: Settings;
  /** True once storage has been read; before that, defaults are in effect. */
  readonly loaded: boolean;
  /** Reduce motion in effect: the player's setting or the OS one. */
  readonly motionReduced: boolean;
  update(patch: Partial<Settings>): void;
}

const Ctx = createContext<SettingsApi>({
  settings: DEFAULTS,
  loaded: false,
  motionReduced: false,
  update: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [osReduceMotion, setOsReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const stored = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
            if (!(stored.backColor in color.back)) stored.backColor = DEFAULTS.backColor;
            setSettings(stored);
          } catch {
            // Corrupt value: fall back to defaults and overwrite on the next change.
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    AccessibilityInfo.isReduceMotionEnabled().then((on) => {
      if (!cancelled) setOsReduceMotion(on);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOsReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<SettingsApi>(
    () => ({ settings, loaded, motionReduced: settings.reduceMotion || osReduceMotion, update }),
    [settings, loaded, osReduceMotion, update],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsApi {
  return useContext(Ctx);
}
