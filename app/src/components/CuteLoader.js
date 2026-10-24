import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import RingShape from './RingShape';
import { GAP } from '../game/levels';
import { RING_COLORS } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const R = 28;
const T = 10;
const VB = 72;

/**
 * Full-screen centered ring spinner (Modal so it always sits in the middle).
 */
export default function CuteLoader({ visible, label = 'Opening cages…' }) {
  const { colors: C } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = React.useState(!!visible);

  useEffect(() => {
    if (!visible) {
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShown(false);
      });
      return undefined;
    }
    setShown(true);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    spin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [visible, fade, spin]);

  if (!shown) return null;

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={shown} transparent animationType="none" statusBarTranslucent>
      <Animated.View
        pointerEvents="auto"
        style={[styles.root, { backgroundColor: C.bg + 'F2', opacity: fade }]}
      >
        <View style={styles.center}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Svg width={VB} height={VB} viewBox={`0 0 ${VB} ${VB}`}>
              <RingShape
                x={VB / 2}
                y={VB / 2}
                R={R}
                T={T}
                gap={GAP}
                angle={-Math.PI / 2}
                palette={RING_COLORS.orange}
                glow={0.2}
              />
            </Svg>
          </Animated.View>
          {label ? (
            <Text style={[styles.label, { color: C.inkSoft }]} numberOfLines={1}>
              {label}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
});
