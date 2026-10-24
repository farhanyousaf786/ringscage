import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAds, showAppOpen } from './src/ads/ads';
import {
  pauseAllSounds,
  playSound,
  preloadSounds,
  setAudioPrefs,
  startBgm,
  stopBgm,
  unloadSounds,
} from './src/audio/sounds';
import {
  COIN_PRICES,
  COIN_REWARDS,
  REMOVE_ADS,
  VIDEO_COINS,
  todayKey,
  winCoinReward,
} from './src/game/economy';
import { LEVELS } from './src/game/levels';
import { ensureMapWarmed, isMapWarmed, warmMapData } from './src/game/mapCache';
import { DEFAULT_PROGRESS, loadProgress, saveProgress } from './src/game/progress';
import { worldForLevel } from './src/game/worlds';
import CuteLoader from './src/components/CuteLoader';
import NeedCoinsSheet from './src/components/NeedCoinsSheet';
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

const LOADER_MIN_MS = 280;

export default function App() {
  const [screen, setScreen] = useState('boot');
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [replayFromSettings, setReplayFromSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadLabel, setLoadLabel] = useState('Opening cages…');
  const [mapFocusWorldId, setMapFocusWorldId] = useState(null);
  const [needCoins, setNeedCoins] = useState(null); // { itemLabel, cost } | null
  const loadTimer = useRef(null);
  const screenRef = useRef(screen);
  const historyRef = useRef([]);
  const progressRef = useRef(progress);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  /**
   * Navigate. Keeps a back-stack so Android swipe/back returns to the previous page.
   * opts.replace — don't push current; opts.reset — clear stack (e.g. arriving home).
   */
  const go = useCallback((next, label = 'Opening cages…', opts = {}) => {
    const { replace = false, reset = false } = opts;
    const cur = screenRef.current;
    if (reset || next === 'home') {
      historyRef.current = [];
    } else if (!replace && cur !== 'boot' && cur !== next) {
      historyRef.current.push(cur);
      if (historyRef.current.length > 24) historyRef.current.shift();
    }

    if (loadTimer.current) clearTimeout(loadTimer.current);
    const mapFast = next === 'map' && isMapWarmed();
    if (mapFast) {
      setScreen(next);
      setLoading(false);
      return;
    }
    setLoadLabel(label);
    setLoading(true);
    const started = Date.now();
    loadTimer.current = setTimeout(() => {
      setScreen(next);
      const left = Math.max(60, LOADER_MIN_MS - (Date.now() - started));
      loadTimer.current = setTimeout(() => {
        setLoading(false);
        loadTimer.current = null;
      }, left);
    }, 50);
  }, []);

  /** Android system back / swipe: pop history until empty (then leave app from home). */
  const goBack = useCallback(() => {
    const cur = screenRef.current;
    if (cur === 'boot' || cur === 'privacy' || cur === 'welcome') return true;

    if (historyRef.current.length > 0) {
      const prev = historyRef.current.pop();
      if (typeof prev === 'number') stopBgm();
      else if (prev === 'map') startBgm();
      else if (prev === 'home' || prev === 'settings' || prev === 'shop') stopBgm();
      go(prev, 'Back…', { replace: true });
      return true;
    }

    // No history — sensible fallbacks before exiting
    if (typeof cur === 'number') {
      setMapFocusWorldId(worldForLevel(cur).id);
      startBgm();
      go('map', 'Map…', { replace: true });
      return true;
    }
    if (cur === 'map' || cur === 'shop' || cur === 'settings' || cur === 'opening') {
      stopBgm();
      go('home', 'Home…', { reset: true });
      return true;
    }
    // home (or unknown): allow OS to close the app
    return false;
  }, [go]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [goBack]);

  useEffect(
    () => () => {
      if (loadTimer.current) clearTimeout(loadTimer.current);
    },
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      ensureMapWarmed();
      warmMapData();
      const [p] = await Promise.all([loadProgress(), preloadSounds().catch(() => {})]);
      if (!alive) return;
      // Second pass after progress known (keeps map packs hot for current unlock).
      ensureMapWarmed();
      const launches = (p.appLaunchCount || 0) + 1;
      const next = { ...p, appLaunchCount: launches };
      setProgress(next);
      if (!p.onboardingDone) setScreen('privacy');
      else setScreen('home');
      setReady(true);
      // App-open: skip first install launch; show from 2nd open onward.
      initAds().then(() => {
        if (!alive || next.noAds || launches < 2) return;
        setTimeout(() => showAppOpen(!!next.noAds), 1200);
      });
    })();
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

  const claimDaily = useCallback(async () => {
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
    if (ok) playSound('twinkle');
    return ok;
  }, []);

  const onVideoReward = useCallback((amount = VIDEO_COINS) => {
    const key = todayKey();
    setProgress((p) => {
      const count = p.videoAdsDate === key ? p.videoAdsCount || 0 : 0;
      return {
        ...p,
        videoAdsDate: key,
        videoAdsCount: count + 1,
        coins: (p.coins || 0) + amount,
      };
    });
  }, []);

  const onRemoveAdsPromptShown = useCallback((dateKey) => {
    setProgress((p) => ({ ...p, removeAdsPromptDate: dateKey }));
  }, []);

  /** Stub until Play Console + RevenueCat — grants noAds locally so UI can be tested. */
  const onBuyRemoveAds = useCallback(async () => {
    return new Promise((resolve) => {
      Alert.alert(
        'Remove all ads',
        `${REMOVE_ADS.priceLabel} · one-time. Play Billing / RevenueCat will charge for real later. Unlock ad-free now for testing?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: `Unlock · ${REMOVE_ADS.priceLabel}`,
            onPress: () => {
              setProgress((p) => ({ ...p, noAds: true }));
              playSound('twinkle');
              resolve(true);
            },
          },
        ]
      );
    });
  }, []);

  const goMap = useCallback(
    (worldOrId) => {
      const id =
        typeof worldOrId === 'number'
          ? worldOrId
          : worldOrId?.id != null
            ? worldOrId.id
            : worldForLevel(Math.min(progress.unlocked, LEVELS.length)).id;
      setMapFocusWorldId(id);
      startBgm();
      go('map', 'Map…');
    },
    [go, progress.unlocked]
  );

  const onPrivacyContinue = useCallback(({ privacyAccepted }) => {
    setProgress((p) => ({
      ...p,
      privacyAccepted: !!privacyAccepted,
    }));
    go('welcome', 'Once upon a flock…');
  }, [go]);

  const onWelcomeDone = useCallback(() => {
    setProgress((p) => ({
      ...p,
      onboardingDone: true,
      seenOpening: true,
      seenStory: { ...p.seenStory, 1: true },
    }));
    stopBgm();
    go('home', 'Welcome home…');
  }, [go]);

  const onOpeningDone = useCallback(() => {
    setProgress((p) => ({
      ...p,
      seenOpening: true,
      seenStory: { ...p.seenStory, 1: true },
    }));
    if (replayFromSettings) {
      setReplayFromSettings(false);
      stopBgm();
      go('settings', 'Back to settings…');
      return;
    }
    setMapFocusWorldId(1);
    startBgm();
    go('map', 'Map…');
  }, [replayFromSettings, go]);

  const onCleared = useCallback((id, stars) => {
    const gain = winCoinReward(stars);
    setProgress((p) => {
      const nextUnlock = Math.max(p.unlocked, Math.min(id + 1, LEVELS.length + 1));
      const prevStars = p.stars[id] || 0;
      const best = Math.max(prevStars, stars);
      return {
        ...p,
        unlocked: nextUnlock,
        stars: { ...p.stars, [id]: best },
        coins: (p.coins || 0) + gain,
      };
    });
    return gain;
  }, []);

  const onStorySeen = useCallback((worldId) => {
    setProgress((p) => ({
      ...p,
      seenStory: { ...p.seenStory, [worldId]: true },
    }));
  }, []);

  const offerNeedCoins = useCallback((itemLabel, cost) => {
    setNeedCoins({ itemLabel, cost });
  }, []);

  const trySpendHint = useCallback(() => {
    if ((progress.coins || 0) < COIN_PRICES.hint) {
      offerNeedCoins('Hint', COIN_PRICES.hint);
      return false;
    }
    return spendCoins(COIN_PRICES.hint);
  }, [progress.coins, spendCoins, offerNeedCoins]);

  const trySpendHammer = useCallback(() => {
    if ((progress.coins || 0) < COIN_PRICES.hammer) {
      offerNeedCoins('Hammer', COIN_PRICES.hammer);
      return false;
    }
    return spendCoins(COIN_PRICES.hammer);
  }, [progress.coins, spendCoins, offerNeedCoins]);

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
        <ThemeProvider mode={themeMode} onChange={onThemeChange}>
          <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
            <CuteLoader visible label="Waking the nest…" />
          </View>
        </ThemeProvider>
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
              onSettings={() => go('settings', 'Settings…')}
              onShop={() => go('shop', 'Coin nest…')}
              onClaimDaily={claimDaily}
              onVideoReward={onVideoReward}
              onBuyRemoveAds={onBuyRemoveAds}
              onRemoveAdsPromptShown={onRemoveAdsPromptShown}
            />
          </FadeIn>
        ) : null}
        {screen === 'shop' ? (
          <FadeIn key="shop">
            <ShopScreen
              progress={progress}
              onBack={() => go('home', 'Home…')}
              onClaimDaily={claimDaily}
              onWatchAd={async () => {
                onVideoReward(VIDEO_COINS);
              }}
              onBuyPack={() => {}}
              onBuyRemoveAds={onBuyRemoveAds}
            />
          </FadeIn>
        ) : null}
        {screen === 'settings' ? (
          <FadeIn key="settings">
            <SettingsScreen
              progress={progress}
              onBack={() => go('home', 'Home…')}
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
                go('opening', 'Story time…');
              }}
              onOpenShop={() => go('shop', 'Coin nest…')}
              onUnlockAll={() => {
                setProgress((p) => {
                  const seenStory = { ...p.seenStory };
                  for (let w = 1; w <= 10; w += 1) seenStory[w] = true;
                  return {
                    ...p,
                    unlocked: LEVELS.length + 1,
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
          <FadeIn key={`map-${mapFocusWorldId || 'auto'}`}>
            <MapScreen
              progress={progress}
              focusWorldId={mapFocusWorldId}
              onPlay={(id) => {
                stopBgm();
                go(id, `Level ${id}…`);
              }}
              onBack={() => {
                stopBgm();
                go('home', 'Home…');
              }}
              onShop={() => go('shop', 'Coin nest…')}
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
              hammerCost={COIN_PRICES.hammer}
              onSpendHint={trySpendHint}
              onSpendHammer={trySpendHammer}
              noAds={!!progress.noAds}
              onBack={() => {
                setMapFocusWorldId(worldForLevel(screen).id);
                startBgm();
                go('map', 'Map…');
              }}
              onNext={() => {
                const l = screen;
                const n = Math.min(l + 1, LEVELS.length);
                const curW = worldForLevel(l);
                const nextW = worldForLevel(n);
                if (nextW.id !== curW.id && !progress.seenStory?.[nextW.id]) {
                  setMapFocusWorldId(nextW.id);
                  startBgm();
                  go('map', 'Map…');
                  return;
                }
                go(n, `Level ${n}…`);
              }}
              onCleared={onCleared}
            />
          </FadeIn>
        ) : null}
        <CuteLoader visible={loading} label={loadLabel} />
        <NeedCoinsSheet
          visible={!!needCoins}
          itemLabel={needCoins?.itemLabel}
          cost={needCoins?.cost}
          progress={progress}
          onClose={() => setNeedCoins(null)}
          onEarned={(n) => onVideoReward(n)}
          onBuyCoins={() => {
            setNeedCoins(null);
            go('shop', 'Coin nest…');
          }}
        />
      </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fade: { flex: 1 },
});
