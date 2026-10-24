import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, preloadSounds, pressFeedback, startBgm } from '../audio/sounds';
import HeroSprite from '../characters/HeroSprite';
import KidSprite from '../characters/KidSprite';
import VillainSprite from '../characters/VillainSprite';
import { useTheme } from '../theme/ThemeContext';

/** Short first-run story — 3 slides, soft motion. */
const SLIDES = [
  {
    title: 'Happy nest',
    speaker: 'Mama',
    sfx: 'chirp1',
    line: 'In Nest Meadow, Mama and Papa watched their peeps play in the sun.',
    cast: [
      { kind: 'hero', id: 'nova', size: 72, expr: 'happy', cheer: 0.7 },
      { kind: 'kid', id: 'seal', size: 34, expr: 'happy' },
      { kind: 'kid', id: 'kitty', size: 34, expr: 'happy' },
      { kind: 'kid', id: 'bun', size: 34, expr: 'happy' },
      { kind: 'hero', id: 'volt', size: 64, expr: 'happy', cheer: 0.5 },
    ],
  },
  {
    title: 'Cages!',
    speaker: 'Grim',
    sfx: 'locked',
    line: 'Then Grim locked every fluffball in spinning ring-cages and flew away.',
    cast: [
      { kind: 'villain', id: 'grim', size: 88, expr: 'happy', cheer: 0.45 },
      { kind: 'kid', id: 'seal', size: 30, expr: 'sad' },
      { kind: 'kid', id: 'kitty', size: 30, expr: 'sad' },
      { kind: 'kid', id: 'bun', size: 30, expr: 'sad' },
    ],
  },
  {
    title: 'Rescue time',
    speaker: 'Together',
    sfx: 'happy',
    line: 'Hold on, peeps! Mama and Papa are coming. Free every cage — bring them home.',
    cast: [
      { kind: 'hero', id: 'nova', size: 80, expr: 'happy', cheer: 0.95 },
      { kind: 'hero', id: 'volt', size: 72, expr: 'happy', cheer: 0.7 },
    ],
  },
];

function Sprite({ spec, index, appear, bob }) {
  const box = spec.size + 24;
  const delay = index * 0.1;
  return (
    <Animated.View
      style={{
        opacity: appear.interpolate({
          inputRange: [0, delay, Math.min(1, delay + 0.35), 1],
          outputRange: [0, 0, 1, 1],
        }),
        transform: [
          {
            translateY: Animated.add(
              appear.interpolate({
                inputRange: [0, delay, Math.min(1, delay + 0.4), 1],
                outputRange: [28, 28, 0, 0],
              }),
              bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, index % 2 === 0 ? -6 : -3],
              })
            ),
          },
          {
            scale: appear.interpolate({
              inputRange: [0, delay, Math.min(1, delay + 0.4), 1],
              outputRange: [0.72, 0.72, 1, 1],
            }),
          },
        ],
      }}
    >
      <Svg width={box} height={box} viewBox={`0 0 ${box} ${box}`}>
        <G transform={`translate(${box / 2} ${box - 8})`}>
          {spec.kind === 'hero' ? (
            <HeroSprite id={spec.id} size={spec.size} bob={0} cheer={spec.cheer || 0} expr={spec.expr} wave={0} />
          ) : null}
          {spec.kind === 'villain' ? (
            <VillainSprite id={spec.id} size={spec.size} bob={0} cheer={spec.cheer || 0} expr={spec.expr} wave={0} />
          ) : null}
          {spec.kind === 'kid' ? (
            <KidSprite id={spec.id} size={spec.size} bob={0} expr={spec.expr} wave={0} />
          ) : null}
        </G>
      </Svg>
    </Animated.View>
  );
}

export default function WelcomeStory({ onDone }) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const [step, setStep] = useState(0);
  const appear = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;
  const titlePop = useRef(new Animated.Value(0)).current;
  const slide = SLIDES[step];
  const last = step >= SLIDES.length - 1;

  useEffect(() => {
    preloadSounds().then(() => startBgm());
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  useEffect(() => {
    if (slide.sfx) playSound(slide.sfx);
    appear.setValue(0);
    bubble.setValue(0);
    titlePop.setValue(0);
    Animated.parallel([
      Animated.spring(titlePop, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(appear, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(220),
        Animated.spring(bubble, { toValue: 1, friction: 7, tension: 85, useNativeDriver: true }),
      ]),
    ]).start();
  }, [step, slide.sfx, appear, bubble, titlePop]);

  const next = () => {
    pressFeedback();
    if (last) onDone();
    else setStep((s) => s + 1);
  };

  const skip = () => {
    pressFeedback();
    onDone();
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: C.bg,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: C.inkFaint },
                i === step && { width: 22, backgroundColor: C.accent },
                i < step && { backgroundColor: C.accentLight },
              ]}
            />
          ))}
        </View>
        <Pressable
          onPress={skip}
          hitSlop={10}
          style={[styles.skipBtn, { backgroundColor: C.card, borderColor: C.panelBorder }]}
        >
          <Text style={[styles.skipText, { color: C.inkSoft }]}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.middle}>
        <Animated.View
          style={{
            opacity: titlePop,
            transform: [
              {
                scale: titlePop.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }),
              },
            ],
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={[styles.eyebrow, { color: C.inkSoft }]}>Once upon a flock</Text>
          <Text style={[styles.title, { color: C.ink }]}>{slide.title}</Text>
        </Animated.View>

        <View style={styles.cast}>
          {slide.cast.map((spec, i) => (
            <Sprite key={`${slide.title}-${spec.id}-${i}`} spec={spec} index={i} appear={appear} bob={bob} />
          ))}
        </View>

        <Animated.View
          style={{
            width: '100%',
            alignItems: 'center',
            opacity: bubble,
            transform: [
              { translateY: bubble.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              { scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
            ],
          }}
        >
          <Text style={[styles.speaker, { color: C.accent }]}>{slide.speaker}</Text>
          <View style={[styles.bubble, { backgroundColor: C.panel, borderColor: C.panelBorder }]}>
            <Text style={[styles.bubbleText, { color: C.ink }]}>{slide.line}</Text>
          </View>
        </Animated.View>
      </View>

      <Pressable onPress={next} style={[styles.nextBtn, { backgroundColor: C.good }]}>
        <Text style={styles.nextText}>{last ? 'Let’s play' : 'Next'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
  },
  skipText: { fontSize: 15, fontWeight: '900' },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 18,
  },
  cast: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 14,
    minHeight: 120,
  },
  speaker: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  bubble: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  bubbleText: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  nextBtn: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 280,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { color: '#fff', fontSize: 19, fontWeight: '900' },
});
