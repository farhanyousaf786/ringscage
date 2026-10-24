import React, { useCallback, useReducer, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect } from 'react-native-svg';
import { easeInOut } from '../game/engine';
import { useFrame } from '../hooks/useFrame';
import { HeroBay, KidSprite, SpeechBubble } from '../characters';
import { BOARD_H, BOARD_W } from '../game/levels';
import { RING_COLORS } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import RingShape, { BreakingRingShards } from './RingShape';

const RAD = 180 / Math.PI;

/** Stem (thin bar) from the holder ring to its collar, with retract animation on release. */
function Stem({ game, c, alpha }) {
  const { colors: C } = useTheme();
  const a = game.stemStart(c);
  const b = game.collarPoint(c);
  const k = c.rel;
  const ex = b.x + (a.x - b.x) * k;
  const ey = b.y + (a.y - b.y) * k;
  const w = Math.max(game.rings[c.holder]?.R || game.R, game.rings[c.held]?.R || game.R) * 0.14;
  const pal = RING_COLORS[game.rings[c.holder].color];
  const d = `M ${a.x} ${a.y} L ${ex} ${ey}`;
  const sh = game.R * 0.04;
  return (
    <G opacity={alpha}>
      <Path
        d={d}
        transform={`translate(${sh} ${sh * 2})`}
        stroke={C.shadow}
        strokeWidth={w + 2}
        strokeLinecap="round"
      />
      <Path d={d} stroke={pal.dark} strokeWidth={w + 2} strokeLinecap="round" />
      <Path d={d} stroke={pal.main} strokeWidth={w * 0.62} strokeLinecap="round" />
    </G>
  );
}

/** Collar band wrapped around the held ring's tube. */
function Collar({ game, c, alpha }) {
  const { colors: C } = useTheme();
  const b = game.collarPoint(c);
  const a = game.stemStart(c);
  const k = c.rel;
  const x = b.x + (a.x - b.x) * k;
  const y = b.y + (a.y - b.y) * k;
  const w = game.T * 1.33;
  const h = game.R * 0.27;
  const pal = RING_COLORS[game.rings[c.holder].color];
  const s = 1 + 0.45 * k;
  return (
    <G transform={`translate(${x} ${y}) rotate(${c.phi * RAD}) scale(${s})`} opacity={alpha}>
      <Rect
        x={-w / 2 + 1.2}
        y={-h / 2 + 2.4}
        width={w}
        height={h}
        rx={h * 0.28}
        fill="rgba(60,30,10,0.3)"
      />
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.28} fill={pal.dark} />
      <Rect
        x={-w / 2 + 2}
        y={-h / 2 + 2}
        width={w - 4}
        height={h - 4}
        rx={h * 0.2}
        fill={pal.main}
      />
      <Rect
        x={-w / 2 + 4}
        y={-h / 2 + 3.2}
        width={w - 8}
        height={Math.max(1.5, h * 0.17)}
        rx={h * 0.08}
        fill="#ffffff"
        fillOpacity={0.45}
      />
      {c.flash > 0.02 ? (
        <Rect
          x={-w / 2 - 3}
          y={-h / 2 - 3}
          width={w + 6}
          height={h + 6}
          rx={h * 0.4}
          fill="none"
          stroke={C.warn}
          strokeWidth={2.4}
          strokeOpacity={c.flash}
        />
      ) : null}
    </G>
  );
}

/** Animated touch indicator that shows how to turn the ring in level 1. */
function TutorialFinger({ game }) {
  const { colors: C } = useTheme();
  const tut = game.tutorial;
  if (!tut || !game.tutorialActive || !game.interactive) return null;
  const r = game.rings[tut.ring];
  const cycle = 3.2;
  const phase = ((game.t - game.introEnd) % cycle) / cycle;
  const move = Math.min(1, phase / 0.62);
  const e = easeInOut(move);
  const dir = Math.sign(tut.delta) || 1;
  const gapAngle = tut.from + tut.delta * e;
  const fingerAngle = gapAngle - dir * (game.gap / 2 + 0.34);
  const fade = phase < 0.08 ? phase / 0.08 : phase > 0.86 ? Math.max(0, (1 - phase) / 0.14) : 1;
  const dots = [];
  for (let i = 1; i <= 5; i += 1) {
    const a = fingerAngle - dir * i * 0.1 * Math.min(1, move * 3);
    dots.push(
      <Circle
        key={i}
        cx={r.x + Math.cos(a) * game.R}
        cy={r.y + Math.sin(a) * game.R}
        r={game.R * 0.07 * (1 - i * 0.12)}
        fill="#ffffff"
        fillOpacity={0.55 * fade * (1 - i / 6)}
      />
    );
  }
  const fx = r.x + Math.cos(fingerAngle) * game.R;
  const fy = r.y + Math.sin(fingerAngle) * game.R;
  const press = 1 - 0.12 * Math.sin(move * Math.PI);
  return (
    <G opacity={fade}>
      {dots}
      <Circle cx={fx} cy={fy} r={game.R * 0.3 * press} fill="#ffffff" fillOpacity={0.5} />
      <Circle
        cx={fx}
        cy={fy}
        r={game.R * 0.3 * press}
        fill="none"
        stroke={C.gold}
        strokeWidth={2.4}
      />
      <Circle cx={fx} cy={fy} r={game.R * 0.12} fill={C.gold} />
    </G>
  );
}

export default function Board({ game, onTick }) {
  const { colors: C } = useTheme();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [, force] = useReducer((n) => n + 1, 0);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const onLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (b.w === width && b.h === height ? b : { w: width, h: height }));
  }, []);

  const gameRef = useRef(game);
  gameRef.current = game;
  const scale = box.w > 0 ? Math.min(box.w / BOARD_W, box.h / BOARD_H) : 0;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const startRef = useRef({ x: 0, y: 0 });

  useFrame((dt) => {
    game.update(dt);
    force();
    if (onTickRef.current) onTickRef.current(dt);
  });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const s = scaleRef.current || 1;
        startRef.current = {
          x: e.nativeEvent.locationX / s,
          y: e.nativeEvent.locationY / s,
        };
        gameRef.current.startDrag(startRef.current.x, startRef.current.y);
      },
      onPanResponderMove: (e, g) => {
        const s = scaleRef.current || 1;
        gameRef.current.moveDrag(startRef.current.x + g.dx / s, startRef.current.y + g.dy / s);
      },
      onPanResponderRelease: () => gameRef.current.endDrag(),
      onPanResponderTerminate: () => gameRef.current.endDrag(),
    })
  ).current;

  const svgW = BOARD_W * scale;
  const svgH = BOARD_H * scale;

  let content = null;
  if (scale > 0) {
    const hintId = game.activeHintId;
    const pulse = (Math.sin(game.t * 3.4) + 1) / 2;
    const live = game.rings.filter((r) => !r.freed);
    const gone = game.rings.filter((r) => r.freed);

    const renderRing = (r) => {
      const i = r.index;
      const palette = RING_COLORS[r.color];
      if (r.freed && r.shards) {
        return <BreakingRingShards key={`break-${i}`} ring={r} palette={palette} />;
      }
      let glow = 0;
      if (game.drag && game.drag.ring === i) glow = 0.55;
      else if (hintId === i) glow = 0.5 + 0.4 * Math.sin(game.t * 8);
      else if (game.def.assist && !r.freed && game.isReady(i)) glow = 0.2 + 0.18 * pulse;
      const shake = r.shake > 0 ? Math.sin(r.shake * 75) * 0.07 * (r.shake / 0.45) : 0;
      return (
        <RingShape
          key={`ring-${i}`}
          x={r.x + r.ox}
          y={r.y + r.oy}
          R={r.R != null ? r.R : game.R}
          T={r.T != null ? r.T : game.T}
          gap={game.gap}
          angle={r.angle + r.spin + shake}
          scale={r.scale}
          alpha={r.alpha}
          palette={palette}
          glow={glow}
        />
      );
    };

    const connectors = game.collars.filter((c) => !(c.released && c.rel >= 1));
    const intro = (c) => Math.min(game.rings[c.holder].alpha, game.rings[c.held].alpha);

    const hintMarkers =
      hintId != null
        ? game.heldBy(hintId).map((c, n) => {
            const p = game.collarPoint(c);
            const wave = (game.t * 1.6 + n * 0.3) % 1;
            return (
              <G key={`hint-${n}`}>
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={game.R * (0.3 + 0.35 * wave)}
                  fill="none"
                  stroke={C.gold}
                  strokeWidth={3}
                  strokeOpacity={1 - wave}
                />
                <Circle cx={p.x} cy={p.y} r={game.R * 0.1} fill={C.gold} />
              </G>
            );
          })
        : null;

    content = (
      <>
        {/* Open canvas — no bordered panel; rings sit on the screen bg */}
        {live.map(renderRing)}
        {/* Kids in cages (still locked) */}
        {game.kids
          .filter((k) => k.state === 'caged')
          .map((k) => {
            const r = game.rings[k.ring];
            if (r.scale < 0.2) return null;
            const size = Math.min(34, (r.R ?? game.R) * 0.72);
            return (
              <G
                key={`cage-kid-${k.uid}`}
                transform={`translate(${k.x} ${k.y + size * 0.42})`}
                opacity={r.alpha}
              >
                <KidSprite
                  id={k.id}
                  size={size * k.scale}
                  bob={Math.sin(game.t * 2.6 + k.ring) * 1.4}
                  wave={game.t * 3 + k.ring}
                  expr={game.expr}
                />
                {k.say ? (
                  <SpeechBubble
                    x={-18}
                    y={-size * 0.9}
                    text={k.say.text}
                    tiny
                    maxWidth={72}
                    alpha={Math.min(1, Math.max(0, (k.say.until - game.t) / 0.25))}
                  />
                ) : null}
              </G>
            );
          })}
        {connectors.map((c, i) => (
          <Stem key={`stem-${i}`} game={game} c={c} alpha={intro(c) * (1 - c.rel * 0.6)} />
        ))}
        {connectors.map((c, i) => (
          <Collar key={`collar-${i}`} game={game} c={c} alpha={intro(c) * (1 - c.rel)} />
        ))}
        {hintMarkers}
        <TutorialFinger game={game} />
        {gone.map(renderRing)}
        {/* Freed babies: wait at free spot, then hop to hero — never vanish mid-way */}
        {game.kids
          .filter((k) => k.state === 'queued' || k.state === 'falling')
          .map((k) => {
            const ring = game.rings[k.ring];
            const size =
              k.state === 'falling'
                ? 30 * k.scale
                : Math.min(34, (ring?.R ?? game.R) * 0.72) * k.scale;
            const yOff = k.state === 'falling' ? 12 : size * 0.42;
            return (
              <G key={`free-kid-${k.uid}`} transform={`translate(${k.x} ${k.y + yOff})`}>
                <KidSprite
                  id={k.id}
                  size={size}
                  bob={k.state === 'queued' ? Math.sin(game.t * 5 + k.ring) * 2 : 0}
                  wave={game.t * 8 + k.ring}
                  expr="happy"
                />
              </G>
            );
          })}
        {game.particles.map((p, i) =>
          p.shape === 'heart' ? (
            <Path
              key={`p-${i}`}
              d="M 0 3 C -6 -1 -3 -6 0 -2.5 C 3 -6 6 -1 0 3 Z"
              transform={`translate(${p.x} ${p.y}) scale(${p.s / 3.2})`}
              fill={RING_COLORS[p.color]?.light || '#ff9db6'}
              stroke={RING_COLORS[p.color]?.main || '#e9577a'}
              strokeWidth={0.7}
              fillOpacity={Math.max(0, Math.min(1, p.life * 1.6))}
              strokeOpacity={Math.max(0, Math.min(1, p.life * 1.6))}
            />
          ) : (
            <Polygon
              key={`p-${i}`}
              points={`${p.x},${p.y - p.s} ${p.x + p.s * 0.7},${p.y} ${p.x},${p.y + p.s} ${
                p.x - p.s * 0.7
              },${p.y}`}
              fill={RING_COLORS[p.color]?.main || C.gold}
              fillOpacity={Math.max(0, Math.min(1, p.life * 1.4))}
            />
          )
        )}
        {/* Hero + saved babies — same panel, not a separate bordered strip */}
        <HeroBay game={game} />
      </>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onLayout={onLayout}>
      {scale > 0 ? (
        <View {...pan.panHandlers} style={{ width: svgW, height: svgH }}>
          <Svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
            pointerEvents="none"
          >
            {content}
          </Svg>
        </View>
      ) : null}
    </View>
  );
}
