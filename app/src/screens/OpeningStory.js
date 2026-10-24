import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, preloadSounds, pressFeedback, startBgm } from '../audio/sounds';
import HeroSprite from '../characters/HeroSprite';
import KidSprite from '../characters/KidSprite';
import VillainSprite from '../characters/VillainSprite';
import { useTheme } from '../theme/ThemeContext';

/** Calm story pages with soft motion — layout stays centered. */
const BEATS = [
  {
    title: 'A happy nest',
    speaker: 'Mama',
    sfx: 'chirp1',
    line: 'In Nest Meadow, Mama watched her peeps play in the sun.',
    cast: [
      { kind: 'hero', id: 'nova', size: 78, expr: 'happy', cheer: 0.6 },
      { kind: 'kid', id: 'seal', size: 36, expr: 'happy' },
      { kind: 'kid', id: 'kitty', size: 36, expr: 'happy' },
      { kind: 'kid', id: 'bun', size: 36, expr: 'happy' },
    ],
  },
  {
    title: 'Papa too',
    speaker: 'Papa',
    sfx: 'chirp2',
    line: 'Papa hummed nearby. Safe nests. Soft feathers. Perfect day.',
    cast: [
      { kind: 'hero', id: 'volt', size: 78, expr: 'happy', cheer: 0.5 },
      { kind: 'kid', id: 'fox', size: 36, expr: 'happy' },
      { kind: 'kid', id: 'cub', size: 36, expr: 'happy' },
    ],
  },
  {
    title: 'Trouble',
    speaker: 'Grim',
    sfx: 'locked',
    line: 'Then Grim arrived. Cute peeps? Perfect for my cages.',
    cast: [{ kind: 'villain', id: 'grim', size: 90, expr: 'happy', cheer: 0.4 }],
  },
  {
    title: 'Taken!',
    speaker: 'Peeps',
    sfx: 'sad',
    line: 'He locked every fluffball in spinning ring-cages and flew away.',
    cast: [
      { kind: 'villain', id: 'grim', size: 72, expr: 'happy', cheer: 0.5 },
      { kind: 'kid', id: 'seal', size: 32, expr: 'sad' },
      { kind: 'kid', id: 'kitty', size: 32, expr: 'sad' },
      { kind: 'kid', id: 'bun', size: 32, expr: 'sad' },
    ],
  },
  {
    title: 'Worried flock',
    speaker: 'Everyone',
    sfx: 'chirp3',
    line: 'Mamas and Papas all over Featherlands were scared and sad.',
    cast: [
      { kind: 'hero', id: 'nova', size: 62, expr: 'sad', cheer: 0 },
      { kind: 'hero', id: 'volt', size: 62, expr: 'sad', cheer: 0 },
      { kind: 'hero', id: 'ruby', size: 62, expr: 'sad', cheer: 0 },
    ],
  },
  {
    title: 'Papa stands up',
    speaker: 'Papa',
    sfx: 'chirp2',
    line: 'I am not staying home. Papas will save our kids too.',
    cast: [{ kind: 'hero', id: 'volt', size: 96, expr: 'happy', cheer: 0.65 }],
  },
  {
    title: 'Ruby joins',
    speaker: 'Ruby',
    sfx: 'chirp1',
    line: 'Count me in! Every peep comes home.',
    cast: [{ kind: 'hero', id: 'ruby', size: 96, expr: 'happy', cheer: 0.7 }],
  },
  {
    title: 'Super Mama',
    speaker: 'Mama',
    sfx: 'happy',
    line: 'Hold on, fluffballs. Mama and Papa are coming. We will get our kids back.',
    cast: [
      { kind: 'hero', id: 'nova', size: 84, expr: 'happy', cheer: 0.95 },
      { kind: 'hero', id: 'volt', size: 68, expr: 'happy', cheer: 0.6 },
    ],
  },
  {
    title: 'The trail',
    speaker: 'Together',
    sfx: 'twinkle',
    line: 'Follow the map. Free every cage. Bring every peep home.',
    cast: [
      { kind: 'hero', id: 'nova', size: 68, expr: 'happy', cheer: 0.8 },
      { kind: 'hero', id: 'volt', size: 68, expr: 'happy', cheer: 0.6 },
      { kind: 'hero', id: 'ruby', size: 68, expr: 'happy', cheer: 0.6 },
    ],
  },
];

function Sprite({ spec, index, appear, bob }) {
  const box = spec.size + 24;
  const delay = index * 0.12;
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
                outputRange: [18, 18, 0, 0],
              }),
              bob.interpolate({
                inputRange: [0, 1],
                outputRange: [0, index % 2 === 0 ? -5 : -3],
              })
            ),
          },
          {
            scale: appear.interpolate({
              inputRange: [0, delay, Math.min(1, delay + 0.4), 1],
              outputRange: [0.86, 0.86, 1, 1],
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

export default function OpeningStory({ onDone }) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const [step, setStep] = useState(0);
  const appear = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;
  const beat = BEATS[step];
  const last = step >= BEATS.length - 1;

  useEffect(() => {
    preloadSounds().then(() => startBgm());
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  useEffect(() => {
    if (beat.sfx) playSound(beat.sfx);
    appear.setValue(0);
    bubble.setValue(0);
    Animated.parallel([
      Animated.timing(appear, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(180),
        Animated.spring(bubble, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [step, beat.sfx, appear, bubble]);

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
        <Text style={[styles.progress, { color: C.inkSoft }]}>
          {step + 1} / {BEATS.length}
        </Text>
        <Pressable
          onPress={skip}
          hitSlop={10}
          style={[styles.skipBtn, { backgroundColor: C.card, borderColor: C.panelBorder }]}
        >
          <Text style={[styles.skipText, { color: C.inkSoft }]}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.middle}>
        <Animated.View style={{ opacity: appear, alignItems: 'center', width: '100%' }}>
          <Text style={[styles.eyebrow, { color: C.inkSoft }]}>Once upon a flock</Text>
          <Text style={[styles.title, { color: C.ink }]}>{beat.title}</Text>
        </Animated.View>

        <View style={styles.cast}>
          {beat.cast.map((spec, i) => (
            <Sprite key={`${beat.title}-${spec.id}-${i}`} spec={spec} index={i} appear={appear} bob={bob} />
          ))}
        </View>

        <Animated.View
          style={{
            width: '100%',
            alignItems: 'center',
            opacity: bubble,
            transform: [
              {
                translateY: bubble.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
              },
              {
                scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
              },
            ],
          }}
        >
          <Text style={[styles.speaker, { color: C.accent }]}>{beat.speaker}</Text>
          <View style={[styles.bubble, { backgroundColor: C.panel, borderColor: C.panelBorder }]}>
            <Text style={[styles.bubbleText, { color: C.ink }]}>{beat.line}</Text>
          </View>
        </Animated.View>
      </View>

      <Pressable onPress={next} style={[styles.nextBtn, { backgroundColor: C.good }]}>
        <Text style={styles.nextText}>{last ? 'Open map' : 'Next'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingHorizontal: 24,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  progress: {
    fontSize: 14,
    fontWeight: '800',
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '900',
  },
  middle: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
  },
  cast: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 16,
  },
  speaker: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  bubble: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: 2,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 108,
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
    marginTop: 8,
  },
  nextText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
  },
});
