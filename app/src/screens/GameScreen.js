import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { maybeShowInterstitial, noteResult } from '../ads/ads';
import {
  buzz,
  playSound,
  preloadSounds,
  pressFeedback,
  startRotateSlide,
  stopRotateSlide,
} from '../audio/sounds';
import { FailOverlay } from '../characters';
import Board from '../components/Board';
import { Bulb, ChevronLeft, Coin, Hammer, Restart } from '../components/Icons';
import { COIN_PRICES, winCoinReward } from '../game/economy';
import WinOverlay from '../components/WinOverlay';
import { Game } from '../game/engine';
import { LEVELS } from '../game/levels';
import { DIFFICULTY_COLORS } from '../theme';
import { useTheme } from '../theme/ThemeContext';

/** Pop-in word that appears after every released collar. */
function Praise({ text }) {
  const { colors: C } = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 5, tension: 150 }),
      Animated.delay(380),
      Animated.timing(v, { toValue: 2, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.praise,
        {
          backgroundColor: C.accent,
          borderBottomColor: C.accentDark,
          shadowColor: C.accentDark,
          opacity: v.interpolate({ inputRange: [0, 0.35, 1, 2], outputRange: [0, 1, 1, 0] }),
          transform: [
            { scale: v.interpolate({ inputRange: [0, 1, 2], outputRange: [0.4, 1, 1.15] }) },
            { translateY: v.interpolate({ inputRange: [0, 1, 2], outputRange: [14, 0, -26] }) },
          ],
        },
      ]}
    >
      <Text style={styles.praiseText}>{text}</Text>
    </Animated.View>
  );
}

function RoundButton({ label, onPress, children, size = 44 }) {
  const { colors: C } = useTheme();
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) =>
    Animated.spring(s, { toValue: v, useNativeDriver: true, friction: 6, tension: 220 }).start();
  return (
    <Pressable
      onPress={() => {
        pressFeedback();
        onPress?.();
      }}
      onPressIn={() => to(0.92)}
      onPressOut={() => to(1)}
      hitSlop={6}
      style={[styles.roundWrap, label ? styles.roundWrapLabeled : null]}
    >
      <Animated.View
        style={[
          styles.round,
          {
            width: size,
            height: size,
            borderRadius: size * 0.36,
            backgroundColor: C.card,
            borderColor: C.panelBorder,
            shadowColor: C.shadow,
            transform: [{ scale: s }],
          },
        ]}
      >
        {children}
      </Animated.View>
      {label ? <Text style={[styles.roundLabel, { color: C.inkSoft }]}>{label}</Text> : null}
    </Pressable>
  );
}

export default function GameScreen({
  levelId,
  isLast,
  onBack,
  onNext,
  onCleared,
  coins = 0,
  hintCost = COIN_PRICES.hint,
  hammerCost = COIN_PRICES.hammer,
  onSpendHint,
  onSpendHammer,
  noAds = false,
}) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const def = LEVELS[levelId - 1];
  const [runKey, setRunKey] = useState(0);
  const game = useMemo(() => new Game(def), [def, runKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const [hud, setHud] = useState({
    moves: 0,
    left: def.maxMoves,
    done: 0,
    rescued: 0,
  });
  const [praise, setPraise] = useState(null);
  const [lockedMsg, setLockedMsg] = useState(0);
  const [win, setWin] = useState(null);
  const [lost, setLost] = useState(null);
  const [strikeRing, setStrikeRing] = useState(null);
  const strikeRingRef = useRef(null);

  const [, tick] = useState(0);

  useEffect(() => {
    strikeRingRef.current = null;
    setStrikeRing(null);
    game.hammerBusy = false;
  }, [runKey, game]);

  // Safety: never leave hammerBusy stuck if the strike overlay is interrupted.
  useEffect(() => {
    if (strikeRing == null) return undefined;
    const t = setTimeout(() => {
      if (strikeRingRef.current == null) return;
      game.hammerBusy = false;
      strikeRingRef.current = null;
      setStrikeRing(null);
      tick((n) => n + 1);
    }, 1600);
    return () => clearTimeout(t);
  }, [strikeRing, game]);

  const bar = useRef(new Animated.Value(0)).current;
  const toast = useRef(new Animated.Value(0)).current;
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    preloadSounds();
  }, []);

  useEffect(() => {
    setHud({ moves: 0, left: game.maxMoves, done: 0, rescued: 0 });
    setPraise(null);
    setWin(null);
    setLost(null);
    bar.setValue(0);
    intro.setValue(0);
    Animated.timing(intro, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const syncHud = () => {
      setHud({
        moves: game.moves,
        left: game.movesLeft,
        done: game.releasedCollars,
        rescued: game.rescuedCount,
      });
      Animated.timing(bar, {
        toValue: game.totalKids ? game.rescuedCount / game.totalKids : 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };

    game.listener = (type, payload) => {
      // One continuous slide loop while dragging — no short grit ticks (those sound like sss sss).
      if (type === 'rotateStart') startRotateSlide();
      if (type === 'rotateEnd') stopRotateSlide();
      if (type === 'praise') {
        stopRotateSlide();
        playSound('release');
        setPraise({ text: payload, key: Date.now() });
      }
      if (type === 'ringBreak') {
        // Cage shatter — crisp break + light buzz.
        playSound('pop');
        buzz(16);
      }
      if (type === 'kidFree') {
        // Tiny chirp the moment the cage opens (not after the hop to Mama).
        const chirps = ['chirp1', 'chirp2', 'chirp3'];
        playSound(chirps[(payload?.ring ?? 0) % chirps.length]);
      }
      if (type === 'villainBreak') {
        playSound('pop');
        playSound('sad');
        buzz(22);
      }
      if (type === 'beatHit') {
        playSound('pop');
        playSound('chirp2');
      }
      if (type === 'rescue') syncHud();
      if (type === 'hud') syncHud();
      if (type === 'locked') {
        playSound('sad');
        setLockedMsg((n) => n + 1);
        toast.setValue(0);
        Animated.sequence([
          Animated.timing(toast, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.delay(1300),
          Animated.timing(toast, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]).start();
      }
      if (type === 'party') {
        stopRotateSlide();
        playSound('win');
        playSound('twinkle');
      }
      if (type === 'partyBeat') {
        // cute chirps and pops all through the party
        const beats = ['chirp1', 'pop', 'chirp2', 'pop', 'chirp3', 'pop'];
        playSound(beats[payload % beats.length]);
      }
      if (type === 'won') {
        stopRotateSlide();
        noteResult();
        setWin(payload);
        onCleared(levelId, payload.stars);
      }
      if (type === 'lost') {
        stopRotateSlide();
        playSound('lose');
        setLost(payload);
      }
    };
    return () => {
      game.listener = null;
      stopRotateSlide();
    };
  }, [game]); // eslint-disable-line react-hooks/exhaustive-deps

  const diffColor = DIFFICULTY_COLORS[def.difficulty];
  const movesTight = hud.left <= 2;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: C.bg,
          paddingTop: insets.top + 6,
          paddingBottom: Math.max(insets.bottom, 10) + 6,
        },
      ]}
    >
      <Animated.View style={[styles.header, { opacity: intro }]}>
        <RoundButton
          onPress={() => {
            onBack();
          }}
          size={40}
        >
          <ChevronLeft size={20} color={C.ink} />
        </RoundButton>
        <View style={styles.titleBox}>
          <Text style={[styles.levelText, { color: C.ink }]}>Level {levelId}</Text>
          <View style={[styles.diffPill, { backgroundColor: diffColor }]}>
            <Text style={styles.diffText}>{def.difficulty}</Text>
          </View>
        </View>
        <View
          style={[
            styles.movesPill,
            {
              backgroundColor: movesTight ? (C.mode === 'dark' ? '#3a2828' : '#fff5f0') : C.card,
              borderColor: movesTight
                ? C.mode === 'dark'
                  ? '#6a4540'
                  : '#f0b8a0'
                : C.panelBorder,
            },
          ]}
        >
          <Text style={[styles.movesLabel, { color: movesTight ? C.warn : C.inkSoft }]}>LEFT</Text>
          <Text style={[styles.movesValue, { color: movesTight ? C.warn : C.ink }]}>{hud.left}</Text>
        </View>
      </Animated.View>

      <View style={[styles.barTrack, { backgroundColor: C.inkFaint }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: C.gold,
              width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        >
          <View style={styles.barShine} />
        </Animated.View>
      </View>
      <Text style={[styles.barText, { color: C.inkSoft }]}>
        Saved {hud.rescued}/{game.totalKids}  ·  {hud.left} left
      </Text>

      <View style={styles.boardWrap}>
        <Board
          game={game}
          strikeRing={strikeRing}
          onStrikeImpact={() => {
            const idx = strikeRingRef.current;
            if (idx == null) return;
            game.smashRing(idx);
            tick((n) => n + 1);
          }}
          onStrikeDone={() => {
            game.hammerBusy = false;
            strikeRingRef.current = null;
            setStrikeRing(null);
            tick((n) => n + 1);
          }}
          onTick={() => {
            tick((n) => n + 1);
          }}
        />
        {praise && !win ? <Praise key={praise.key} text={praise.text} /> : null}
        {!win ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.toast,
              {
                opacity: toast,
                transform: [
                  {
                    translateY: toast.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.toastText} key={lockedMsg}>
              Locked. Free the cage it is holding first.
            </Text>
          </Animated.View>
        ) : null}
      </View>

      <Animated.View style={[styles.bottom, { opacity: intro }]}>
        <View style={[styles.coinChip, { backgroundColor: C.card, borderColor: C.panelBorder }]}>
          <Coin size={16} />
          <View>
            <Text style={[styles.coinChipLabel, { color: C.inkSoft }]}>Total</Text>
            <Text style={[styles.coinChipText, { color: C.ink }]}>{coins}</Text>
          </View>
        </View>

        <RoundButton
          label={`Hint · ${hintCost}`}
          size={46}
          onPress={() => {
            if (win || lost) return;
            const hasHint = game.rings.some((_, idx) => game.isReady(idx));
            if (!hasHint) return;
            if (onSpendHint && !onSpendHint()) return;
            game.hint();
            tick((n) => n + 1);
          }}
        >
          <Bulb size={22} color={C.accent} />
        </RoundButton>

        <RoundButton
          label={`Hammer · ${hammerCost}`}
          size={46}
          onPress={() => {
            if (win || lost || strikeRing != null || game.hammerBusy) return;
            const target = game.pickHammerTarget();
            if (target < 0) return;
            if (onSpendHammer && !onSpendHammer()) return;
            game.hammerBusy = true;
            strikeRingRef.current = target;
            setStrikeRing(target);
            tick((n) => n + 1);
          }}
        >
          <Hammer size={22} color={C.accent} />
        </RoundButton>

        <RoundButton
          label="Restart"
          size={46}
          onPress={() => {
            setRunKey((k) => k + 1);
          }}
        >
          <Restart size={22} color={C.accent} />
        </RoundButton>
      </Animated.View>

      {win ? (
        <WinOverlay
          stars={win.stars}
          moves={win.moves}
          rescued={win.rescued}
          totalKids={game.totalKids}
          levelName={`Level ${levelId}: ${def.name}`}
          isLast={isLast}
          coinsEarned={winCoinReward(win.stars)}
          onNext={async () => {
            await maybeShowInterstitial(noAds);
            onNext?.();
          }}
          onReplay={() => setRunKey((k) => k + 1)}
          onMenu={async () => {
            await maybeShowInterstitial(noAds);
            onBack?.();
          }}
        />
      ) : null}

      {lost ? (
        <FailOverlay
          heroId={game.heroId}
          rescued={lost.rescued}
          total={lost.total}
          onReplay={() => setRunKey((k) => k + 1)}
          onMenu={onBack}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 12,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginBottom: 8,
    overflow: 'visible',
  },
  titleBox: { alignItems: 'center', paddingHorizontal: 8 },
  levelText: { fontSize: 17, fontWeight: '900' },
  diffPill: { marginTop: 3, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  diffText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  movesPill: {
    minWidth: 52,
    height: 40,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  movesLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  movesValue: { fontSize: 16, fontWeight: '900', marginTop: -1 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3, minWidth: 0 },
  barShine: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  barText: {
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
  },
  boardWrap: { flex: 1, marginTop: 0 },
  praise: {
    position: 'absolute',
    top: '38%',
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderBottomWidth: 3,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  praiseText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 0.4 },
  toast: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(70,42,20,0.92)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  toastText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 4,
    paddingBottom: 4,
    gap: 6,
    overflow: 'visible',
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 46,
    borderRadius: 14,
    borderWidth: 2,
    marginTop: 0,
    minWidth: 72,
    flexShrink: 0,
  },
  coinChipLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3, marginBottom: -1 },
  coinChipText: { fontSize: 14, fontWeight: '900' },
  roundWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  roundWrapLabeled: {
    minWidth: 62,
    minHeight: 68,
  },
  round: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  roundLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
});
