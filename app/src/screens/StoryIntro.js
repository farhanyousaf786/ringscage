import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playSound, pressFeedback } from '../audio/sounds';
import HeroSprite from '../characters/HeroSprite';
import KidSprite from '../characters/KidSprite';
import VillainSprite from '../characters/VillainSprite';
import { useTheme } from '../theme/ThemeContext';

const WHO = {
  mama: { label: 'Mama', kind: 'hero', id: 'nova', sfx: 'chirp1' },
  papa: { label: 'Papa', kind: 'hero', id: 'volt', sfx: 'chirp2' },
  grim: { label: 'Grim', kind: 'villain', id: 'grim', sfx: 'locked' },
  hex: { label: 'Hex', kind: 'villain', id: 'hex', sfx: 'locked' },
  snag: { label: 'Snag', kind: 'villain', id: 'snag', sfx: 'locked' },
  kid: { label: 'Peep', kind: 'kid', id: 'seal', sfx: 'chirp3' },
};

export default function StoryIntro({ world, onDone }) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const lines = world.story || [];
  const [step, setStep] = useState(0);
  const appear = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const line = lines[step];
  const last = !lines.length || step >= lines.length - 1;
  const speaker = line ? WHO[line.who] || WHO.mama : null;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  useEffect(() => {
    if (speaker?.sfx) playSound(speaker.sfx);
    appear.setValue(0);
    Animated.spring(appear, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
  }, [step, speaker?.sfx, appear]);

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
          backgroundColor: world.tint || C.bg,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.progress, { color: C.inkSoft }]}>
          {lines.length ? `${step + 1} / ${lines.length}` : ''}
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
        <Text style={[styles.eyebrow, { color: C.inkSoft }]}>Chapter {world.id}</Text>
        <Text style={[styles.title, { color: C.ink }]}>{world.name}</Text>
        <Text style={[styles.tag, { color: C.inkSoft }]}>{world.tagline}</Text>

        {speaker ? (
          <Animated.View
            style={{
              alignItems: 'center',
              marginTop: 16,
              opacity: appear,
              transform: [
                { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
                { scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
              ],
            }}
          >
            <Svg width={120} height={120} viewBox="0 0 120 120">
              <G transform="translate(60 78)">
                {speaker.kind === 'hero' ? (
                  <HeroSprite id={speaker.id} size={70} bob={0} cheer={0.5} expr="happy" wave={0} />
                ) : null}
                {speaker.kind === 'villain' ? (
                  <VillainSprite id={speaker.id} size={70} bob={0} cheer={0.2} expr="angry" wave={0} />
                ) : null}
                {speaker.kind === 'kid' ? (
                  <KidSprite id={speaker.id} size={52} bob={0} expr="sad" wave={0} />
                ) : null}
              </G>
            </Svg>
            <Text style={[styles.speaker, { color: C.accent }]}>{speaker.label}</Text>
          </Animated.View>
        ) : null}

        {line ? (
          <Animated.View
            style={[
              styles.bubble,
              {
                backgroundColor: C.panel,
                borderColor: C.panelBorder,
                opacity: appear,
                transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
              },
            ]}
          >
            <Text style={[styles.bubbleText, { color: C.ink }]}>{line.text}</Text>
          </Animated.View>
        ) : null}
      </View>

      <Pressable onPress={next} style={[styles.nextBtn, { backgroundColor: C.good }]}>
        <Text style={styles.nextText}>{last ? 'Continue' : 'Next'}</Text>
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
  progress: { fontSize: 14, fontWeight: '800' },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
  },
  skipText: { fontSize: 15, fontWeight: '900' },
  middle: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  tag: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
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
