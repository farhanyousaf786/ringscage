import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pressFeedback } from '../audio/sounds';
import Portrait from '../characters/Portrait';
import RingShape from '../components/RingShape';
import { GAP } from '../game/levels';
import { useFrame } from '../hooks/useFrame';
import { RING_COLORS } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const POLICY_URL = 'https://www.switchtofuture.com/ringcage/privacy-policy';

/** Tiny linked rings floating between Mama & Papa (game motion). */
function MiniRings() {
  const [, force] = useReducer((n) => n + 1, 0);
  const t = useRef(0);
  useFrame((dt) => {
    t.current += dt;
    force();
  });
  const time = t.current;
  const VB_W = 140;
  const VB_H = 70;
  const R = 18;
  const T = 7;
  const d = 2 * R + 4;
  const cy = 36;
  const xs = [28, 28 + d];
  const colors = [RING_COLORS.blue, RING_COLORS.orange];

  return (
    <View style={styles.miniRings}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {xs.map((x, i) => (
          <RingShape
            key={i}
            x={x}
            y={cy + Math.sin(time * 2 + i) * 2}
            R={R}
            T={T}
            gap={GAP}
            angle={-Math.PI / 2 + (i === 0 ? time * 1.2 : -time * 0.9)}
            palette={colors[i]}
            glow={0.2}
          />
        ))}
        <Rect
          x={xs[0] + R}
          y={cy - 2}
          width={xs[1] - xs[0] - 2 * R}
          height={4}
          rx={2}
          fill={RING_COLORS.blue.main}
        />
      </Svg>
    </View>
  );
}

function Bob({ children, delay = 0, amp = 6 }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [y, delay]);
  return (
    <Animated.View
      style={{
        transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, -amp] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function CheckRow({ checked, onToggle, label }) {
  const { colors: C } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (checked) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }
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
  }, [checked, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.checkRow, pressed && { opacity: 0.85 }]}
    >
      <Animated.View
        style={[!checked && { transform: [{ scale }], opacity: glow }]}
      >
        <View
          style={[
            styles.box,
            checked
              ? { backgroundColor: C.gold, borderColor: C.goldDark }
              : {
                  borderColor: C.accent,
                  backgroundColor:
                    C.mode === 'dark' ? 'rgba(240, 160, 74, 0.18)' : 'rgba(232, 135, 42, 0.12)',
                },
          ]}
        >
          {checked ? <Text style={[styles.checkMark, { color: C.ink }]}>✓</Text> : null}
        </View>
      </Animated.View>
      {label}
    </Pressable>
  );
}

/**
 * First-launch gate — Break Buddies Welcome style:
 * big title, animated cast, agree checkbox, Continue.
 */
export default function PrivacyScreen({ onContinue }) {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const [agreed, setAgreed] = useState(false);
  const titlePop = useRef(new Animated.Value(0)).current;
  const castPop = useRef(new Animated.Value(0)).current;
  const cardPop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(titlePop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.spring(castPop, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.spring(cardPop, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [titlePop, castPop, cardPop]);

  const openPolicy = () => {
    pressFeedback();
    Linking.openURL(POLICY_URL).catch(() => {});
  };

  const go = () => {
    if (!agreed) {
      pressFeedback();
      return;
    }
    pressFeedback();
    onContinue({ privacyAccepted: true });
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View
        style={[
          styles.blobA,
          {
            backgroundColor:
              C.mode === 'dark' ? 'rgba(240, 160, 74, 0.12)' : 'rgba(232, 135, 42, 0.14)',
          },
        ]}
      />
      <View
        style={[
          styles.blobB,
          {
            backgroundColor:
              C.mode === 'dark' ? 'rgba(61, 155, 216, 0.1)' : 'rgba(61, 155, 216, 0.12)',
          },
        ]}
      />


      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.titleWrap,
            {
              opacity: titlePop,
              transform: [
                { scale: titlePop.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) },
              ],
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: C.inkSoft }]}>Welcome to</Text>
          <Text
            style={[
              styles.title,
              { color: C.accent, textShadowColor: C.accentDark },
            ]}
          >
            RING
          </Text>
          <Text
            style={[
              styles.title,
              styles.titleSub,
              { color: C.ink, textShadowColor: C.inkSoft },
            ]}
          >
            CAGE!
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.cast,
            {
              opacity: castPop,
              transform: [
                {
                  translateY: castPop.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }),
                },
              ],
            },
          ]}
        >
          <Bob delay={0} amp={7}>
            <Portrait kind="hero" id="nova" size={92} expr="happy" cheer={0.85} />
          </Bob>
          <View style={styles.castMid}>
            <MiniRings />
            <View style={styles.peeps}>
              <Portrait kind="kid" id="seal" size={28} expr="happy" />
              <Portrait kind="kid" id="kitty" size={28} expr="happy" />
              <Portrait kind="kid" id="bun" size={28} expr="happy" />
            </View>
          </View>
          <Bob delay={180} amp={7}>
            <Portrait kind="hero" id="volt" size={88} expr="happy" cheer={0.7} />
          </Bob>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: C.card,
              borderColor: C.panelBorder,
              opacity: cardPop,
              transform: [
                {
                  translateY: cardPop.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: C.ink }]}>Before you play</Text>
          <Text style={[styles.cardSub, { color: C.inkSoft }]}>
            Tap the box to agree — then continue.
          </Text>

          <CheckRow
            checked={agreed}
            onToggle={() => {
              pressFeedback();
              setAgreed((v) => !v);
            }}
            label={
              <Text style={[styles.checkLabel, { color: C.inkSoft }]}>
                I agree to the{' '}
                <Text style={[styles.link, { color: C.accent }]} onPress={openPolicy}>
                  Privacy Policy
                </Text>
              </Text>
            }
          />
        </Animated.View>

        <Pressable
          onPress={go}
          disabled={!agreed}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: C.good },
            !agreed && styles.ctaOff,
            pressed && agreed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
        {!agreed ? (
          <Text style={[styles.hint, { color: C.inkFaint }]}>
            Tap the empty box above to check it.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  blobA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -70,
    right: -90,
  },
  blobB: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: 80,
    left: -100,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 14,
  },
  titleWrap: { alignItems: 'center' },
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 0,
  },
  titleSub: {
    fontSize: 36,
    lineHeight: 42,
  },
  cast: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    minHeight: 120,
  },
  castMid: {
    alignItems: 'center',
    marginBottom: 8,
    width: 120,
  },
  miniRings: {
    width: 120,
    height: 58,
  },
  peeps: {
    flexDirection: 'row',
    gap: 2,
    marginTop: -4,
  },
  card: {
    alignSelf: 'stretch',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontWeight: '900', fontSize: 16, marginTop: -1 },
  checkLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  link: {
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  cta: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaOff: { opacity: 0.4 },
  ctaText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  hint: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
