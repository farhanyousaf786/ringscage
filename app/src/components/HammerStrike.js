import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Hammer } from './Icons';

/**
 * Hammer flies from below the board to a cage, swings, impacts, then fades.
 * Remounted per strike (Board sets key); callbacks via refs so parent ticks
 * do not restart the animation.
 */
export default function HammerStrike({ x, y, boardH, onImpact, onDone }) {
  const anim = useRef(new Animated.Value(0)).current;
  const hit = useRef(false);
  const onImpactRef = useRef(onImpact);
  const onDoneRef = useRef(onDone);
  onImpactRef.current = onImpact;
  onDoneRef.current = onDone;

  // Lock aim point for this mount — ring may fly off after smash.
  const aim = useRef({ x, y, boardH }).current;

  useEffect(() => {
    hit.current = false;
    anim.setValue(0);

    const sub = anim.addListener(({ value }) => {
      if (!hit.current && value >= 1.28) {
        hit.current = true;
        onImpactRef.current?.();
      }
    });

    const animHandle = Animated.timing(anim, {
      toValue: 2,
      duration: 880,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    });

    const impactAt = setTimeout(() => {
      if (!hit.current) {
        hit.current = true;
        onImpactRef.current?.();
      }
    }, 560);

    animHandle.start(({ finished }) => {
      clearTimeout(impactAt);
      anim.removeListener(sub);
      if (!finished) return;
      if (!hit.current) {
        hit.current = true;
        onImpactRef.current?.();
      }
      onDoneRef.current?.();
    });

    return () => {
      clearTimeout(impactAt);
      anim.removeListener(sub);
      animHandle.stop();
    };
  }, [anim]);

  const startX = aim.x + 40;
  const startY = aim.boardH + 24;
  const endX = aim.x - 28;
  const endY = aim.y - 28;

  const translateX = anim.interpolate({
    inputRange: [0, 1, 1.35, 2],
    outputRange: [startX - 28, endX, endX - 6, endX + 12],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1, 1.35, 2],
    outputRange: [startY - 28, endY, endY + 10, endY - 16],
  });
  const rotate = anim.interpolate({
    inputRange: [0, 1, 1.35, 2],
    outputRange: ['-55deg', '-22deg', '48deg', '8deg'],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.08, 1.45, 2],
    outputRange: [0, 1, 1, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1, 1.35, 2],
    outputRange: [0.8, 1.2, 1.38, 0.9],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.hammer,
          {
            opacity,
            transform: [{ translateX }, { translateY }, { rotate }, { scale }],
          },
        ]}
      >
        <Hammer size={56} color="#c98a0c" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hammer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
