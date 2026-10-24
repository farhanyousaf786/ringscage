import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pressFeedback } from '../audio/sounds';
import Portrait from '../characters/Portrait';
import { getHero, getVillain } from '../characters/catalog';
import { ChevronLeft, Lock, Star } from '../components/Icons';
import { LEVELS } from '../game/levels';
import { WORLDS, isBossLevel } from '../game/worlds';
import { useFrame } from '../hooks/useFrame';
import { LIGHT } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import StoryIntro from './StoryIntro';

/** Pastel island cards stay light — always use light ink on them. */
const TINTED = LIGHT;

const ROW = 58;
const PATH_TOP = 18;
const NODE_R = 22;
const BOSS_R = 28;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function nodePos(indexInWorld) {
  const side = indexInWorld % 2 === 0 ? -1 : 1;
  const x = 0.5 + side * (0.22 + (indexInWorld % 3) * 0.02);
  const y = PATH_TOP + indexInWorld * ROW;
  return { x, y };
}

/** Soft S-curve between two zigzag nodes. */
function curveD(ax, ay, bx, by) {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const cx1 = ax + (mx - ax) * 0.35;
  const cy1 = ay + (by - ay) * 0.2;
  const cx2 = bx - (bx - mx) * 0.35;
  const cy2 = by - (by - ay) * 0.2;
  return `M ${ax} ${ay} C ${cx1} ${cy1} ${cx2} ${cy2} ${bx} ${by}`;
}

function approxLen(ax, ay, bx, by) {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2) * 1.12;
}

/** Draws a trail segment; finished links grow in with a soft dash reveal. */
function TrailLink({ ax, ay, bx, by, color, lit, delay }) {
  const len = approxLen(ax, ay, bx, by);
  const dash = useRef(new Animated.Value(lit ? 0 : len)).current;
  const glow = useRef(new Animated.Value(lit ? 1 : 0)).current;

  useEffect(() => {
    if (!lit) {
      dash.setValue(len);
      glow.setValue(0);
      return undefined;
    }
    dash.setValue(len);
    glow.setValue(0);
    const anim = Animated.parallel([
      Animated.timing(dash, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(glow, {
        toValue: 1,
        duration: 420,
        delay: delay + 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [lit, delay, len, dash, glow]);

  const d = curveD(ax, ay, bx, by);
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;

  if (!lit) {
    return (
      <Path
        d={d}
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
        strokeOpacity={0.22}
        strokeDasharray="5 7"
      />
    );
  }

  return (
    <>
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
        strokeOpacity={glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] })}
      />
      <AnimatedPath
        d={d}
        stroke={color}
        strokeWidth={4.2}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${len} ${len}`}
        strokeDashoffset={dash}
      />
      <AnimatedCircle
        cx={midX}
        cy={midY}
        r={3.2}
        fill={color}
        opacity={glow}
      />
    </>
  );
}

function LevelNode({ level, unlocked, stars, current, villainId, onPress }) {
  const { colors: C } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!current) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [current, pulse]);

  const boss = isBossLevel(level.id);
  const size = boss ? BOSS_R * 2 : NODE_R * 2;

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        transform: [
          {
            scale: current
              ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] })
              : 1,
          },
        ],
      }}
    >
      {current ? (
        <View style={styles.mamaPin}>
          <Portrait kind="hero" id="nova" size={22} expr="happy" cheer={0.7} />
        </View>
      ) : null}
      <Pressable
        disabled={!unlocked}
        onPressIn={() => {
          if (unlocked) pressFeedback();
        }}
        onPress={() => onPress?.()}
        style={({ pressed }) => [
          styles.node,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: unlocked ? (boss ? '#5a3d7a' : C.accent) : C.inkFaint,
          },
          unlocked && pressed && { opacity: 0.82, transform: [{ scale: 0.94 }] },
        ]}
      >
        {boss && unlocked ? (
          <Portrait kind="villain" id={villainId} size={30} expr="angry" cheer={0.35} />
        ) : unlocked ? (
          <Text style={styles.nodeNum}>{level.id}</Text>
        ) : (
          <Lock size={boss ? 18 : 14} color={C.inkSoft} />
        )}
      </Pressable>
      {unlocked && stars > 0 ? (
        <View style={styles.nodeStars}>
          {[0, 1, 2].map((i) => (
            <Star key={i} size={9} filled={i < stars} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

function WorldBanner({ world, locked }) {
  const hero = getHero(world.hero);
  const villain = getVillain(world.villain);
  const [, force] = useReducer((n) => n + 1, 0);
  const t = useRef(0);
  useFrame((dt) => {
    t.current += dt;
    force();
  });
  const bob = Math.sin(t.current * 2.2) * 1.6;

  return (
    <View style={[styles.banner, locked && styles.bannerLocked]}>
      <View style={styles.bannerSide}>
        <Portrait
          kind="hero"
          id={world.hero}
          size={40}
          expr={locked ? 'sad' : 'happy'}
          cheer={0.55}
          bob={bob}
        />
        <Text style={[styles.bannerName, { color: TINTED.ink }]}>{hero.name}</Text>
      </View>

      <View style={styles.bannerMid}>
        <Text style={[styles.islandName, { color: TINTED.ink }]} numberOfLines={1}>
          {world.name}
        </Text>
        <Text style={[styles.islandTag, { color: TINTED.inkSoft }]} numberOfLines={1}>
          {world.tagline}
        </Text>
        <View style={styles.kidRow}>
          {(world.kids || []).map((id) => (
            <Portrait key={id} kind="kid" id={id} size={20} expr={locked ? 'sad' : 'happy'} />
          ))}
        </View>
        <Text style={[styles.islandRange, { color: TINTED.inkFaint }]}>
          Levels {world.levelFrom}–{world.levelTo}
        </Text>
      </View>

      <View style={styles.bannerSide}>
        <Portrait
          kind="villain"
          id={world.villain}
          size={40}
          expr="angry"
          cheer={0.3}
          bob={-bob}
        />
        <Text style={[styles.bannerName, { color: TINTED.warn }]}>{villain.name}</Text>
      </View>
    </View>
  );
}

function WorldIsland({ world, progress, onPlay }) {
  const levels = useMemo(
    () => LEVELS.filter((l) => l.id >= world.levelFrom && l.id <= world.levelTo),
    [world]
  );
  const [boxW, setBoxW] = useState(0);
  const height = PATH_TOP + Math.max(0, levels.length - 1) * ROW + BOSS_R * 2 + 36;
  const locked = progress.unlocked < world.levelFrom;
  const nodeHalf = NODE_R + 4;

  return (
    <View style={[styles.island, { backgroundColor: world.tint }]}>
      <WorldBanner world={world} locked={locked} />

      <View
        style={[styles.pathBox, { height }]}
        onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}
      >
        {boxW > 0 ? (
          <Svg
            width={boxW}
            height={height}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          >
            {levels.slice(0, -1).map((lv, i) => {
              const a = nodePos(i);
              const b = nodePos(i + 1);
              const finished = lv.id < progress.unlocked;
              return (
                <TrailLink
                  key={`trail-${lv.id}`}
                  ax={a.x * boxW}
                  ay={a.y + nodeHalf}
                  bx={b.x * boxW}
                  by={b.y + nodeHalf}
                  color={world.path}
                  lit={finished}
                  delay={i * 70}
                />
              );
            })}
          </Svg>
        ) : null}

        {levels.map((lv, i) => {
          const p = nodePos(i);
          const unlocked = lv.id <= progress.unlocked;
          const boss = isBossLevel(lv.id);
          const half = boss ? BOSS_R : NODE_R;
          return (
            <View
              key={lv.id}
              style={[
                styles.nodeWrap,
                {
                  left: `${p.x * 100}%`,
                  top: p.y,
                  marginLeft: -half - 20,
                  width: (half + 20) * 2,
                },
              ]}
            >
              <LevelNode
                level={lv}
                unlocked={unlocked}
                stars={progress.stars[lv.id] || 0}
                current={lv.id === Math.min(progress.unlocked, LEVELS.length)}
                villainId={world.villain}
                onPress={() => onPlay(lv.id)}
              />
              <Text
                style={[styles.nodeLabel, { color: unlocked ? TINTED.ink : TINTED.inkSoft }]}
                numberOfLines={1}
              >
                {lv.name}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function MapScreen({ progress, onPlay, onBack, onShop, onStorySeen }) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const focusWorld =
    WORLDS.find((w) => progress.unlocked >= w.levelFrom && progress.unlocked <= w.levelTo) ||
    WORLDS[WORLDS.length - 1];
  const needsStory = !progress.seenStory?.[focusWorld.id];
  const [storyWorld, setStoryWorld] = useState(needsStory ? focusWorld : null);

  useEffect(() => {
    if (needsStory && !storyWorld) setStoryWorld(focusWorld);
  }, [needsStory, focusWorld, storyWorld]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPressIn={() => pressFeedback()}
          onPress={onBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: C.card, borderColor: C.panelBorder },
            pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] },
          ]}
        >
          <ChevronLeft size={22} color={C.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.mapTitle, { color: C.accent }]}>Featherlands</Text>
          <Text style={[styles.mapSub, { color: C.inkSoft }]}>
            Rescue trail · Mama vs the cage gang
          </Text>
        </View>
        <Pressable
          onPressIn={() => pressFeedback()}
          onPress={onShop}
          style={({ pressed }) => [
            styles.seedPill,
            { backgroundColor: C.card, borderColor: C.panelBorder },
            pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] },
          ]}
        >
          <Text style={[styles.seedText, { color: C.ink }]}>✦ {progress.coins ?? 0}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 12,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {WORLDS.map((w) => (
          <WorldIsland key={w.id} world={w} progress={progress} onPlay={onPlay} />
        ))}
      </ScrollView>

      {storyWorld ? (
        <StoryIntro
          world={storyWorld}
          onDone={() => {
            onStorySeen(storyWorld.id);
            setStoryWorld(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  mapTitle: { fontSize: 20, fontWeight: '900' },
  mapSub: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  seedPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 2,
  },
  seedText: { fontWeight: '900', fontSize: 13 },
  island: {
    borderRadius: 22,
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  bannerLocked: { opacity: 0.72 },
  bannerSide: { alignItems: 'center', width: 58 },
  bannerMid: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  bannerName: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: -2,
  },
  kidRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 1,
    marginBottom: 1,
  },
  islandName: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  islandTag: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 1,
  },
  islandRange: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  pathBox: { width: '100%', position: 'relative' },
  nodeWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  mamaPin: {
    marginBottom: -4,
    zIndex: 2,
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nodeNum: { color: '#fff', fontSize: 16, fontWeight: '900' },
  nodeStars: { flexDirection: 'row', gap: 0, marginTop: 2 },
  nodeLabel: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '800',
    maxWidth: 88,
    textAlign: 'center',
  },
});
