import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdBanner } from '../ads/ads';
import { pressFeedback } from '../audio/sounds';
import Portrait from '../characters/Portrait';
import EarnCoinsSheet from '../components/EarnCoinsSheet';
import { Coin, CoinBag, Gear, Lock, NestGift, Play, Shield } from '../components/Icons';
import RemoveAdsSheet from '../components/RemoveAdsSheet';
import RingShape from '../components/RingShape';
import { COIN_REWARDS, REMOVE_ADS, VIDEO_COINS, todayKey, videosLeft } from '../game/economy';
import { GAP, LEVELS } from '../game/levels';
import { WORLDS } from '../game/worlds';
import { useFrame } from '../hooks/useFrame';
import { useTheme } from '../theme/ThemeContext';
import { LIGHT, RING_COLORS } from '../theme';

/** Pastel world cards keep light ink so dark mode text stays readable. */
const TINTED = LIGHT;

const CAGE_KIDS = ['seal', 'kitty', 'bun'];
const PREVIEW_COUNT = 4; // 2 rows × 2 cols

function Link({ x0, x1, y, holder }) {
  const w = 3.2;
  const cw = 9;
  const ch = 6;
  return (
    <>
      <Rect x={x0} y={y - w / 2} width={x1 - x0} height={w} rx={w / 2} fill={holder.dark} />
      <Rect x={x0} y={y - w / 4} width={x1 - x0} height={w / 2} rx={w / 4} fill={holder.main} />
      <Rect x={x1 - cw / 2} y={y - ch / 2} width={cw} height={ch} rx={2} fill={holder.dark} />
      <Rect
        x={x1 - cw / 2 + 1}
        y={y - ch / 2 + 1}
        width={cw - 2}
        height={ch - 2}
        rx={1.5}
        fill={holder.main}
      />
    </>
  );
}

/** Compact logical cages: openings up, slight bob, one slow spin. */
function CageStage({ colors: C }) {
  const [, force] = useReducer((n) => n + 1, 0);
  const t = useRef(0);
  useFrame((dt) => {
    t.current += dt;
    force();
  });
  const time = t.current;
  const VB_W = 280;
  const VB_H = 88;
  const R = 26;
  const T = 9;
  const gap = R * 0.55;
  const d = 2 * R + gap;
  const cy = 46;
  const startX = (VB_W - 2 * d) / 2;
  const xs = [startX, startX + d, startX + 2 * d];
  const bob = (s, amp = 1.2) => Math.sin(time * 1.3 + s) * amp;
  const flutter = (s) => Math.sin(time * 3.6 + s) * 2;
  const palettes = [RING_COLORS.blue, RING_COLORS.orange, RING_COLORS.green];
  // Openings face up; only right ring slowly rotates (demo)
  const ringAngle = (i) => {
    if (i === 2) return -Math.PI / 2 + time * 0.55;
    return -Math.PI / 2 + Math.sin(time * 0.45 + i) * 0.06;
  };

  return (
    <View style={[styles.stage, { backgroundColor: C.stageBg, borderColor: C.panelBorder }]}>
      <View style={styles.cageBox}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
          {xs.map((x, i) => (
            <RingShape
              key={`ring-${i}`}
              x={x}
              y={cy + bob(i)}
              R={R}
              T={T}
              gap={GAP}
              angle={ringAngle(i)}
              palette={palettes[i]}
              glow={0.08 + 0.06 * Math.sin(time * 2.2 + i)}
            />
          ))}
          <Link
            x0={xs[0] + R}
            x1={xs[1] - R}
            y={cy + (bob(0) + bob(1)) / 2}
            holder={RING_COLORS.blue}
          />
          <Link
            x0={xs[1] + R}
            x1={xs[2] - R}
            y={cy + (bob(1) + bob(2)) / 2}
            holder={RING_COLORS.orange}
          />
        </Svg>

        {CAGE_KIDS.map((id, i) => (
          <View
            key={id}
            style={[
              styles.peepPin,
              {
                left: `${(xs[i] / VB_W) * 100}%`,
                top: `${((cy + bob(i, 0.8)) / VB_H) * 100}%`,
                transform: [
                  { translateX: -14 },
                  { translateY: -22 + flutter(i) },
                  { rotate: `${Math.sin(time * 2.8 + i) * 5}deg` },
                ],
              },
            ]}
          >
            <Portrait kind="kid" id={id} size={22} expr="happy" />
          </View>
        ))}
      </View>
    </View>
  );
}

function WorldCard({ world, open, current, colors: C, onPress }) {
  const short = world.name
    .replace(/^Nest |^Dewdrop |^Berry |^Cloud |^Crystal |^Ember |^Tide |^Frost |^Briar |^Star /, '')
    .trim();
  return (
    <Pressable
      onPressIn={() => {
        if (open) pressFeedback();
      }}
      onPress={() => {
        if (!open) return;
        onPress?.(world);
      }}
      style={({ pressed }) => [
        styles.worldCard,
        { backgroundColor: world.tint },
        current && { borderWidth: 2.5, borderColor: C.accent },
        !open && styles.worldCardLocked,
        open && pressed && styles.pressed,
      ]}
    >
      <View style={styles.worldKids}>
        {(world.kids || []).slice(0, 2).map((id) => (
          <Portrait key={id} kind="kid" id={id} size={20} expr={open ? 'happy' : 'sad'} />
        ))}
      </View>
      <Text style={[styles.worldCardTitle, { color: TINTED.ink }]} numberOfLines={1}>
        {short}
      </Text>
      <Text style={[styles.worldCardRange, { color: TINTED.inkSoft }]}>
        {world.levelFrom}–{world.levelTo}
      </Text>
      {!open ? (
        <Lock size={12} color={TINTED.inkFaint} />
      ) : current ? (
        <Text style={[styles.worldNow, { color: C.accent }]}>Now</Text>
      ) : null}
    </Pressable>
  );
}

/** Last active stage; if every level is cleared, highlight the first stage. */
function selectedWorld(unlocked) {
  if (unlocked > LEVELS.length) return WORLDS[0];
  return (
    WORLDS.find((w) => unlocked >= w.levelFrom && unlocked <= w.levelTo) ||
    WORLDS[WORLDS.length - 1]
  );
}

function ActionBtn({ label, sub, onPress, primary, colors: C, icon, iconBg, muted }) {
  const ink = primary ? '#fff' : C.ink;
  const soft = primary ? 'rgba(255,255,255,0.88)' : C.inkSoft;
  return (
    <Pressable
      onPressIn={() => pressFeedback()}
      onPress={() => onPress?.()}
      style={({ pressed }) => [
        styles.actionBtn,
        primary
          ? { backgroundColor: C.good, borderColor: C.goodDark || C.good }
          : { backgroundColor: C.card, borderColor: C.panelBorder },
        muted && styles.actionMuted,
        pressed && styles.pressedStrong,
      ]}
    >
      <View
        style={[
          styles.actionIconWrap,
          { backgroundColor: iconBg || (primary ? 'rgba(255,255,255,0.22)' : C.panel) },
        ]}
      >
        {icon}
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionLabel, { color: ink }]} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={[styles.actionSub, { color: soft }]} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function HomeScreen({
  progress,
  onPlay,
  onSettings,
  onShop,
  onClaimDaily,
  onVideoReward,
  onBuyRemoveAds,
  onRemoveAdsPromptShown,
}) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const [showAll, setShowAll] = useState(false);
  const [earnOpen, setEarnOpen] = useState(false);
  const [removeAdsOpen, setRemoveAdsOpen] = useState(false);
  const title = useRef(new Animated.Value(0)).current;
  const sub = useRef(new Animated.Value(0)).current;
  const coins = progress.coins ?? 0;
  const currentWorld = selectedWorld(progress.unlocked);
  const dailyTaken = progress.dailyClaimDate === todayKey();
  const vidsLeft = videosLeft(progress);
  const today = todayKey();

  // Once per day: offer remove-ads popup (if not already purchased).
  useEffect(() => {
    if (progress.noAds) return undefined;
    if (progress.removeAdsPromptDate === today) return undefined;
    const t = setTimeout(() => {
      setRemoveAdsOpen(true);
      onRemoveAdsPromptShown?.(today);
    }, 900);
    return () => clearTimeout(t);
  }, [progress.noAds, progress.removeAdsPromptDate, today, onRemoveAdsPromptShown]);

  const visibleWorlds = useMemo(
    () => (showAll ? WORLDS : WORLDS.slice(0, PREVIEW_COUNT)),
    [showAll]
  );

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(title, { toValue: 1, useNativeDriver: true, friction: 5, tension: 90 }),
      Animated.timing(sub, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [title, sub]);

  const stylesDyn = {
    root: { flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 4 },
  };

  return (
    <View style={stylesDyn.root}>
      <View style={styles.topBar}>
        <Pressable
          onPressIn={() => pressFeedback()}
          onPress={onShop}
          style={({ pressed }) => [
            styles.coinBtn,
            { backgroundColor: C.card, borderColor: C.panelBorder },
            pressed && styles.pressed,
          ]}
        >
          <Coin size={16} />
          <Text style={[styles.coinBtnText, { color: C.ink }]}>{coins}</Text>
          <View style={[styles.coinPlus, { backgroundColor: C.gold }]}>
            <Text style={styles.coinPlusText}>+</Text>
          </View>
        </Pressable>
        <Pressable
          onPressIn={() => pressFeedback()}
          onPress={onSettings}
          hitSlop={10}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: C.card, borderColor: C.panelBorder },
            pressed && styles.pressed,
          ]}
        >
          <Gear size={20} color={C.ink} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 14) + 10,
          paddingHorizontal: 16,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.Text
          style={[
            styles.title,
            {
              color: C.accent,
              textShadowColor: C.accentDark,
              opacity: title,
              transform: [{ scale: title.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
            },
          ]}
        >
          Rings Cage
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { color: C.inkSoft, opacity: sub }]}>
          Free the peeps from the cages
        </Animated.Text>

        <Animated.View style={{ opacity: sub, width: '100%', marginTop: 10 }}>
          <CageStage colors={C} />
        </Animated.View>

        <Animated.View style={{ opacity: sub, width: '100%', marginTop: 14 }}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: C.ink }]}>Stages</Text>
            <Text style={[styles.sectionMeta, { color: C.inkSoft }]}>
              {Math.min(progress.unlocked, LEVELS.length)} / {LEVELS.length}
            </Text>
          </View>

          <View style={styles.worldGrid}>
            {visibleWorlds.map((w) => (
              <WorldCard
                key={w.id}
                world={w}
                open={progress.unlocked >= w.levelFrom}
                current={w.id === currentWorld.id}
                colors={C}
                onPress={(world) => onPlay?.(world)}
              />
            ))}
          </View>

          {WORLDS.length > PREVIEW_COUNT ? (
            <Pressable
              onPressIn={() => pressFeedback()}
              onPress={() => setShowAll((v) => !v)}
              style={({ pressed }) => [
                styles.showAllBtn,
                { borderColor: C.panelBorder, backgroundColor: C.card },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.showAllText, { color: C.accent }]}>
                {showAll ? 'Show less' : `Show all · ${WORLDS.length} worlds`}
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>

        <Animated.View style={{ opacity: sub, width: '100%', maxWidth: 340, marginTop: 16, gap: 10 }}>
          <ActionBtn
            colors={C}
            primary
            icon={<Play size={20} color="#fff" />}
            label="Watch ad for coins"
            sub={
              vidsLeft > 0
                ? `Short ad · +${VIDEO_COINS} · ${vidsLeft} left today`
                : 'Come back tomorrow for more ads'
            }
            onPress={() => setEarnOpen(true)}
          />
          <ActionBtn
            colors={C}
            muted={dailyTaken}
            icon={<NestGift size={20} color={dailyTaken ? C.inkFaint : C.accent} />}
            iconBg={dailyTaken ? C.panel : C.accentLight || C.panel}
            label={dailyTaken ? 'Daily nest claimed' : 'Daily nest gift'}
            sub={
              dailyTaken
                ? 'Come back tomorrow'
                : `+${COIN_REWARDS.dailyNest} coins · once a day`
            }
            onPress={async () => {
              if (dailyTaken) return;
              await onClaimDaily?.();
            }}
          />
          {!progress.noAds ? (
            <ActionBtn
              colors={C}
              icon={<Shield size={20} color={C.goldDark || C.gold} />}
              iconBg={C.gold + '33'}
              label="Remove all ads"
              sub={`No banners or win ads · ${REMOVE_ADS.priceLabel}`}
              onPress={() => setRemoveAdsOpen(true)}
            />
          ) : (
            <ActionBtn
              colors={C}
              icon={<Shield size={20} color={C.good} />}
              iconBg={C.good + '33'}
              label="Ads removed"
              sub="Thanks for supporting the flock"
              onPress={() => setRemoveAdsOpen(true)}
            />
          )}
          <ActionBtn
            colors={C}
            icon={<CoinBag size={20} color={C.accent} />}
            iconBg={C.accentLight || C.panel}
            label="Coin nest"
            sub="Bags of coins · shop"
            onPress={onShop}
          />
        </Animated.View>
      </ScrollView>

      <AdBanner noAds={!!progress.noAds} />

      {earnOpen ? (
        <EarnCoinsSheet
          progress={progress}
          onClose={() => setEarnOpen(false)}
          onEarned={(n) => onVideoReward?.(n)}
        />
      ) : null}

      {removeAdsOpen ? (
        <RemoveAdsSheet
          owned={!!progress.noAds}
          onClose={() => setRemoveAdsOpen(false)}
          onBuy={async () => {
            const ok = await onBuyRemoveAds?.();
            if (ok) setRemoveAdsOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.94 }],
  },
  pressedStrong: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 44,
  },
  coinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 5,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    borderWidth: 2,
  },
  coinBtnText: { fontWeight: '900', fontSize: 14 },
  coinPlus: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinPlusText: { fontWeight: '900', color: '#fff', fontSize: 14, marginTop: -1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  stage: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cageBox: {
    width: '100%',
    aspectRatio: 280 / 88,
    position: 'relative',
  },
  peepPin: {
    position: 'absolute',
    width: 28,
    height: 32,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  sectionMeta: { fontSize: 12, fontWeight: '800' },
  worldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  worldCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 92,
  },
  worldCardLocked: { opacity: 0.48 },
  worldKids: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 28,
  },
  worldCardTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '900',
  },
  worldCardRange: {
    fontSize: 11,
    fontWeight: '800',
  },
  worldNow: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '900',
  },
  showAllBtn: {
    marginTop: 10,
    height: 40,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showAllText: { fontSize: 14, fontWeight: '900' },
  actionBtn: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionMuted: { opacity: 0.72 },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: { flex: 1, paddingRight: 4 },
  actionLabel: { fontSize: 16, fontWeight: '900' },
  actionSub: { marginTop: 2, fontSize: 12, fontWeight: '700' },
});
