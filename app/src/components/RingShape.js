import React from 'react';
import { G, Path } from 'react-native-svg';

const TAU = Math.PI * 2;
const cache = new Map();

/** SVG arc path from angle a0 to a1 (clockwise on screen) around the origin. */
export function arc(r, a0, a1) {
  const key = `${r.toFixed(2)}|${a0.toFixed(3)}|${a1.toFixed(3)}`;
  let d = cache.get(key);
  if (!d) {
    const large = a1 - a0 > Math.PI ? 1 : 0;
    d =
      `M ${(r * Math.cos(a0)).toFixed(2)} ${(r * Math.sin(a0)).toFixed(2)} ` +
      `A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${large} 1 ` +
      `${(r * Math.cos(a1)).toFixed(2)} ${(r * Math.sin(a1)).toFixed(2)}`;
    cache.set(key, d);
  }
  return d;
}

/**
 * A glossy C-ring. `angle` is the direction (radians) the opening faces.
 * Drawn as: soft shadow, dark edge, colour body, inner highlight (+ optional glow).
 */
function RingShape({ x, y, R, T, gap, angle, scale = 1, alpha = 1, palette, glow = 0 }) {
  if (alpha <= 0.01 || scale <= 0.01) return null;
  const half = gap / 2;
  const body = arc(R, half, TAU - half);
  const light = arc(R - T * 0.19, half + 0.08, TAU - half - 0.08);
  const deg = (angle * 180) / Math.PI;
  const sh = R * 0.05;

  return (
    <>
      <G
        transform={`translate(${x + sh} ${y + sh * 2}) rotate(${deg}) scale(${scale})`}
        opacity={alpha}
      >
        <Path
          d={body}
          stroke="rgba(90,55,20,0.2)"
          strokeWidth={T}
          strokeLinecap="round"
          fill="none"
        />
      </G>
      <G transform={`translate(${x} ${y}) rotate(${deg}) scale(${scale})`} opacity={alpha}>
        {glow > 0.01 ? (
          <Path
            d={body}
            stroke="#ffe58a"
            strokeOpacity={Math.min(1, glow)}
            strokeWidth={T * 1.55}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
        <Path d={body} stroke={palette.dark} strokeWidth={T} strokeLinecap="round" fill="none" />
        <Path
          d={body}
          stroke={palette.main}
          strokeWidth={T * 0.8}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={light}
          stroke={palette.light}
          strokeOpacity={0.75}
          strokeWidth={T * 0.21}
          strokeLinecap="round"
          fill="none"
        />
      </G>
    </>
  );
}

/** Flying arc shards when a cage breaks open. */
export function BreakingRingShards({ ring, palette }) {
  if (!ring.shards?.length) return null;
  const base = (ring.angle * 180) / Math.PI;
  return (
    <>
      {ring.shards.map((s, i) => {
        if (s.life <= 0.02) return null;
        const body = arc(s.R, s.a0, s.a1);
        const light = arc(s.R - s.T * 0.19, s.a0 + 0.05, s.a1 - 0.05);
        const spinDeg = base + (s.spin * 180) / Math.PI;
        const alpha = Math.min(1, s.life * 1.35);
        const sx = 1 + (1 - s.life) * 0.12;
        return (
          <G
            key={`shard-${ring.index}-${i}`}
            transform={`translate(${ring.x + ring.ox + s.ox} ${ring.y + ring.oy + s.oy}) rotate(${spinDeg}) scale(${sx})`}
            opacity={alpha}
          >
            <Path
              d={body}
              stroke={palette.dark}
              strokeWidth={s.T}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={body}
              stroke={palette.main}
              strokeWidth={s.T * 0.8}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={light}
              stroke={palette.light}
              strokeOpacity={0.7}
              strokeWidth={s.T * 0.2}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );
      })}
    </>
  );
}

export default React.memo(RingShape);
