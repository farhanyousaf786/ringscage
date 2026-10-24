import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  pauseAllSounds,
  setAudioPrefs,
  startBgm,
  stopBgm,
  unloadSounds,
} from './src/audio/sounds';
import { COIN_PRICES, COIN_REWARDS, todayKey, winCoinReward } from './src/game/economy';
import { LEVELS } from './src/game/levels';
import { DEFAULT_PROGRESS, loadProgress, saveProgress } from './src/game/progress';
import { isBossLevel, worldForLevel } from './src/game/worlds';
import GameScreen from './src/screens/GameScreen';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import OpeningStory from './src/screens/OpeningStory';
import PrivacyScreen from './src/screens/PrivacyScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ShopScreen from './src/screens/ShopScreen';
import WelcomeStory from './src/screens/WelcomeStory';
import { paletteFor } from './src/theme';
import { ThemeProvider } from './src/theme/ThemeContext';

function FadeIn({ children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.fade, { opacity: v }]}>{children}</Animated.View>
  );
}

export default function App() {
  const [screen, setScreen] = useState('boot');
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [replayFromSettings, setReplayFromSettings] = useState(false);

  useEffect(() => {
    let alive = true;
    loadProgress().then((p) => {
      if (!alive) return;
      setProgress(p);
      if (!p.onboardingDone) setScreen('privacy');
      else setScreen('home');
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveProgress(progress);
  }, [progress, ready]);

  useEffect(() => {
    setAudioPrefs({
      sfx: progress.sfxOn !== false,
      music: progress.musicOn !== false,
      vibrate: progress.vibrateOn !== false,
    });
    if (progress.musicOn === false) stopBgm();
  }, [progress.sfxOn, progress.musicOn, progress.vibrateOn]);

  const addCoins = useCallback((n) => {
    setProgress((p) => ({ ...p, coins: Math.max(0, (p.coins || 0) + n) }));
  }, []);

  const spendCoins = useCallback((cost) => {
    let ok = false;
    setProgress((p) => {
      if ((p.coins || 0) < cost) return p;
      ok = true;
      return { ...p, coins: p.coins - cost };
    });
    return ok;
  }, []);

  const goMap = useCallback(() => {
    setScreen('map');
    startBgm();
  }, []);

  const onPrivacyContinue = useCallback(({ privacyAccepted }) => {
    setProgress((p) => ({
      ...p,
      privacyAccepted: !!privacyAccepted,
    }));
    setScreen('welcome');
  }, []);

  const onWelcomeDone = useCallback(() => {
    setProgress((p) => ({
      ...p,
      onboardingDone: true,
      seenOpening: true,
      seenStory: { ...p.seenStory, 1: true },
    }));
    stopBgm();
    setScreen('home');
  }, []);

  const onOpeningDone = useCallback(() => {
    setProgress((p) => ({
      ...p,
      seenOpening: true,
      seenStory: { ...p.seenStory, 1: true },
    }));
    if (replayFromSettings) {
      setReplayFromSettings(false);
      stopBgm();
      setScreen('settings');
      return;
    }
    setScreen('map');
    startBgm();
  }, [replayFromSettings]);

  const onCleared = useCallback((id, stars) => {
    setProgress((p) => {
      const nextUnlock = Math.max(p.unlocked, Math.min(id + 1, LEVELS.length + 1));
      const prevStars = p.stars[id] || 0;
      const best = Math.max(prevStars, stars);
      const firstOrBetter = best > prevStars || prevStars === 0;
      const gain = firstOrBetter ? winCoinReward(best, isBossLevel(id)) : 3;
      return {
        ...p,
        unlocked: nextUnlock,
        stars: { ...p.stars, [id]: best },
        coins: (p.coins || 0) + gain,
      };
    });
  }, []);

  const onStorySeen = useCallback((worldId) => {
    setProgress((p) => ({
      ...p,
      seenStory: { ...p.seenStory, [worldId]: true },
    }));
  }, []);

  const trySpendHint = useCallback(() => {
    if ((progress.coins || 0) < COIN_PRICES.hint) {
      Alert.alert('Need more coins', `Hints cost ✦ ${COIN_PRICES.hint}. Earn some in the Coin nest.`, [
        { text: 'Shop', onPress: () => setScreen('shop') },
        { text: 'OK', style: 'cancel' },
      ]);
      return false;
    }
    return spendCoins(COIN_PRICES.hint);
  }, [progress.coins, spendCoins]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pauseAllSounds();
    });
    return () => {
      sub.remove();
      unloadSounds();
    };
  }, []);

  const themeMode = progress.theme === 'dark' ? 'dark' : 'light';
  const themeColors = paletteFor(themeMode);
  const onThemeChange = useCallback((mode) => {
    setProgress((p) => ({ ...p, theme: mode === 'dark' ? 'dark' : 'light' }));
  }, []);

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={[styles.root, { backgroundColor: themeColors.bg }]} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider mode={themeMode} onChange={onThemeChange}>
      <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        {screen === 'home' ? (
          <FadeIn key="home">
            <HomeScreen
              progress={progress}
              onPlay={goMap}
              onSettings={() => setScreen('settings')}
              onShop={() => setScreen('shop')}
              onContinue={() => {
                stopBgm();
                setScreen(Math.min(progress.unlocked, LEVELS.length));
              }}
            />
          </FadeIn>
        ) : null}
        {screen === 'shop' ? (
          <FadeIn key="shop">
            <ShopScreen
              progress={progress}
              onBack={() => setScreen('home')}
              onClaimDaily={async () => {
                const key = todayKey();
                let ok = false;
                setProgress((p) => {
                  if (p.dailyClaimDate === key) return p;
                  ok = true;
                  return {
                    ...p,
                    dailyClaimDate: key,
                    coins: (p.coins || 0) + COIN_REWARDS.dailyNest,
                  };
                });
                return ok;
              }}
              onWatchAd={async () => {
                addCoins(COIN_REWARDS.watchAd);
              }}
              onBuyPack={() => {}}
            />
          </FadeIn>
        ) : null}
        {screen === 'settings' ? (
          <FadeIn key="settings">
            <SettingsScreen
              progress={progress}
              onBack={() => setScreen('home')}
              onUpdatePrefs={(partial) => {
                setProgress((p) => {
                  const next = { ...p, ...partial };
                  setAudioPrefs({
                    sfx: next.sfxOn !== false,
                    music: next.musicOn !== false,
                    vibrate: next.vibrateOn !== false,
                  });
                  if (next.musicOn === false) stopBgm();
                  return next;
                });
              }}
              onWatchStory={() => {
                setReplayFromSettings(true);
                setScreen('opening');
              }}
              onOpenShop={() => setScreen('shop')}
              onUnlockAll={() => {
                setProgress((p) => {
                  const seenStory = { ...p.seenStory };
                  for (let w = 1; w <= 10; w += 1) seenStory[w] = true;
                  return {
                    ...p,
                    unlocked: LEVELS.length,
                    seenOpening: true,
                    onboardingDone: true,
                    privacyAccepted: true,
                    seenStory,
                  };
                });
              }}
            />
          </FadeIn>
        ) : null}
        {screen === 'privacy' ? (
          <FadeIn key="privacy">
            <PrivacyScreen onContinue={onPrivacyContinue} />
          </FadeIn>
        ) : null}
        {screen === 'welcome' ? (
          <FadeIn key="welcome">
            <WelcomeStory onDone={onWelcomeDone} />
          </FadeIn>
        ) : null}
        {screen === 'opening' ? (
          <FadeIn key="opening">
            <OpeningStory onDone={onOpeningDone} />
          </FadeIn>
        ) : null}
        {screen === 'map' ? (
          <FadeIn key="map">
            <MapScreen
              progress={progress}
              onPlay={(id) => {
                stopBgm();
                setScreen(id);
              }}
              onBack={() => {
                stopBgm();
                setScreen('home');
              }}
              onShop={() => setScreen('shop')}
              onStorySeen={onStorySeen}
            />
          </FadeIn>
        ) : null}
        {typeof screen === 'number' ? (
          <FadeIn key={`level-${screen}`}>
            <GameScreen
              levelId={screen}
              isLast={screen === LEVELS.length}
              coins={progress.coins}
              hintCost={COIN_PRICES.hint}
              onSpendHint={trySpendHint}
              onBack={() => {
                setScreen('map');
                startBgm();
              }}
              onNext={() =>
                setScreen((l) => {
                  const n = Math.min(l + 1, LEVELS.length);
                  const curW = worldForLevel(l);
                  const nextW = worldForLevel(n);
                  if (nextW.id !== curW.id && !progress.seenStory?.[nextW.id]) {
                    startBgm();
                    return 'map';
                  }
                  return n;
                })
              }
              onCleared={onCleared}
            />
          </FadeIn>
        ) : null}
      </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fade: { flex: 1 },
});
