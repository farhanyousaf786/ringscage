import React from 'react';
import { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { HERO_X, HERO_Y, VILLAIN_X, VILLAIN_Y } from '../game/levels';
import { useTheme } from '../theme/ThemeContext';
import { getHero, getVillain } from './catalog';
import HeroSprite from './HeroSprite';
import KidSprite from './KidSprite';
import VillainSprite from './VillainSprite';

/**
 * Mama (left) + rescued babies + villain (right) who caged the chicks.
 * Expressions react together: wrong ring → Mama worried / Grim smug; free → reverse.
 */
export default function HeroBay({ game }) {
  const { colors: C } = useTheme();
  const hero = getHero(game.heroId);
  const villain = getVillain(game.villainId);
  const rescued = game.kids.filter((k) => k.state === 'rescued');
  const party = game.partying;
  const beating = game.beating;
  const vBreaking = game.villainBreaking;
  const vBreakP = game.villainBreakP || 0;
  const pp = game.partyP;
  const expr = party || beating || vBreaking ? 'happy' : game.expr;
  // Always a little angry unless smug / beaten / gloating.
  const vExpr = party || game.won || game.villainGone || vBreaking
    ? 'sad'
    : game.lost
      ? 'happy'
      : game.villainExpr || 'angry';
  const pulse = game.heroPulse || 0;
  const vPulse = game.villainPulse || 0;
  const cheer =
    party || beating || vBreaking || expr === 'happy' || pulse > 0.15
      ? 0.95
      : expr === 'sad'
        ? 0
        : rescued.length > 0
          ? 0.45 + 0.35 * Math.sin(game.t * 4)
          : 0;
  const bob =
    pulse > 0
      ? Math.sin(pulse * Math.PI) * 5
      : expr === 'sad'
        ? Math.sin(game.t * 6) * 0.8
        : Math.sin(game.t * 2.4) * 1.4;
  const shaking = game.villainShaking;
  const vBob =
    shaking || vBreaking
      ? Math.sin(game.t * 22) * 3.5
      : vPulse > 0.05 && vExpr === 'happy'
        ? Math.sin(vPulse * Math.PI) * 3
        : Math.sin(game.t * 2.0) * 1.2;
  const vShake = vBreaking
    ? Math.sin(game.t * 48) * (10 * (1 - vBreakP))
    : shaking
      ? Math.sin(game.t * 36) * 5
      : beating
        ? Math.sin(game.t * 28) * 3
        : 0;

  const beatH = beating ? game.beatHeroPos() : null;
  const beatV = beating ? game.beatVillainPos() : null;
  const heroParty = party && !beating ? game.partyHeroPos() : null;
  const hx = beatH ? beatH.x : heroParty ? heroParty.x : HERO_X;
  const hy = beatH ? beatH.y : heroParty ? heroParty.y : HERO_Y;
  const heroScale =
    1 +
    pulse * 0.3 +
    (beatH ? 0.15 * beatH.grow : 0) +
    (heroParty ? 0.2 * pp * heroParty.grow : 0);
  const heroSpin = beatH ? beatH.spin : heroParty ? heroParty.spin : 0;
  const vx = beatV ? beatV.x : VILLAIN_X;
  const vy = beatV ? beatV.y : VILLAIN_Y + (vExpr === 'sad' && !beating && !vBreaking ? 6 : 0);
  const vScale = beatV
    ? beatV.grow
    : vBreaking
      ? Math.max(0.15, 1.12 - vBreakP * 1.05)
      : 1 +
        (vExpr === 'happy' ? 0.1 * Math.max(vPulse, 0.35) : 0) +
        (vExpr === 'sad' ? -0.1 : 0);
  const vAlpha = beatV
    ? beatV.alpha
    : game.villainGone
      ? 0
      : vBreaking
        ? Math.max(0, 1 - vBreakP * 1.15)
        : vExpr === 'sad'
          ? 0.75
          : 1;
  const vFace = beatV ? beatV.expr : vExpr;
  const vSpin = vBreaking ? Math.sin(game.t * 18) * 18 * vBreakP : beatV ? beatV.spin : 0;
  const showVillain = !game.villainGone && vAlpha > 0.04;
  const allCagesOpen = game.rings.every((r) => r.freed);
  const hideVillainLabel = allCagesOpen || vBreaking || game.villainGone;

  const say = game.heroSay;
  const sayLeft = say ? Math.max(0, say.until - game.t) : 0;
  const sayAlpha =
    say && !party ? Math.min(1, sayLeft / 0.35, (4.2 - sayLeft) / 0.35 || 1) : 0;
  const vSay = showVillain ? game.villainSay : null;
  const vSayLeft = vSay ? Math.max(0, vSay.until - game.t) : 0;
  const vSayAge = vSay ? Math.max(0, 2.4 - vSayLeft) : 0;
  const vSayAlpha = vSay ? Math.min(1, vSayLeft / 0.28, vSayAge / 0.2 || 1) : 0;

  return (
    <G>
      {pulse > 0.04 && !party ? (
        <>
          <Circle
            cx={HERO_X}
            cy={HERO_Y - 24}
            r={20 + pulse * 30}
            fill={C.gold}
            fillOpacity={0.2 * pulse}
          />
          <Circle
            cx={HERO_X}
            cy={HERO_Y - 24}
            r={12 + pulse * 18}
            fill="none"
            stroke={C.gold}
            strokeWidth={3}
            strokeOpacity={pulse}
          />
        </>
      ) : null}

      {vPulse > 0.04 && vExpr === 'happy' && !vBreaking ? (
        <Circle
          cx={VILLAIN_X}
          cy={VILLAIN_Y - 24}
          r={14 + vPulse * 22}
          fill={C.warn}
          fillOpacity={0.18 * vPulse}
        />
      ) : null}

      {vBreaking ? (
        <>
          <Circle
            cx={VILLAIN_X}
            cy={VILLAIN_Y - 20}
            r={16 + vBreakP * 36}
            fill={C.warn}
            fillOpacity={0.22 * (1 - vBreakP)}
          />
          <Circle
            cx={VILLAIN_X}
            cy={VILLAIN_Y - 20}
            r={10 + vBreakP * 28}
            fill="none"
            stroke={C.gold}
            strokeWidth={3}
            strokeOpacity={0.85 * (1 - vBreakP)}
          />
        </>
      ) : null}

      {say && sayAlpha > 0.02 ? (
        <SpeechBubble
          x={hx + 16}
          y={hy - 42}
          text={say.text}
          alpha={sayAlpha}
          maxWidth={108}
          tiny
        />
      ) : null}

      {/* Villain bubble — snug to the LEFT of his head (same style as Mama’s). */}
      {vSay && vSayAlpha > 0.02 ? (
        <SpeechBubble
          x={vx - 14}
          y={vy - 42}
          text={vSay.text}
          alpha={vSayAlpha}
          maxWidth={108}
          tiny
          anchor="right"
          tail="right"
        />
      ) : null}

      <G transform={`translate(${hx} ${hy}) rotate(${heroSpin}) scale(${heroScale})`}>
        <HeroSprite
          id={game.heroId}
          size={46 * (beatH ? beatH.grow : heroParty ? heroParty.grow : 1)}
          bob={bob}
          cheer={beatH ? beatH.cheer : cheer}
          expr={expr}
          wave={game.t * (party || beating ? 9 : 3)}
        />
      </G>

      {/* Villain: shakes on cage break; shatters when every cage is open */}
      {showVillain ? (
        <G
          transform={`translate(${vx + vShake} ${vy}) rotate(${vSpin}) scale(${vScale})`}
          opacity={vAlpha}
        >
          <VillainSprite
            id={game.villainId}
            size={44}
            bob={vBob}
            cheer={vFace === 'happy' ? 0.55 : shaking || beating || vBreaking ? 0.4 : 0}
            expr={vFace}
            wave={game.t * (shaking || vBreaking ? 10 : 2.4)}
          />
        </G>
      ) : null}

      {!party && !beating ? (
        <>
          <SvgText
            x={HERO_X}
            y={HERO_Y + 16}
            fill={C.ink}
            fontSize={11}
            fontWeight="900"
            textAnchor="middle"
          >
            {hero.name}
          </SvgText>
          <SvgText
            x={HERO_X}
            y={HERO_Y + 28}
            fill={C.accent}
            fontSize={10}
            fontWeight="800"
            textAnchor="middle"
          >
            {`${game.rescuedCount}/${game.totalKids} saved`}
          </SvgText>
          {!hideVillainLabel ? (
            <>
              <SvgText
                x={VILLAIN_X}
                y={VILLAIN_Y + 16}
                fill={C.ink}
                fontSize={11}
                fontWeight="900"
                textAnchor="middle"
              >
                {villain.name}
              </SvgText>
              <SvgText
                x={VILLAIN_X}
                y={VILLAIN_Y + 28}
                fill={C.warn}
                fontSize={9}
                fontWeight="800"
                textAnchor="middle"
              >
                caged them!
              </SvgText>
            </>
          ) : null}
        </>
      ) : null}

      {rescued.map((kid) => {
        const i = game.kids.indexOf(kid);
        if (party) {
          const p = game.partyPos(kid, i);
          return (
            <G key={kid.uid} transform={`translate(${p.x} ${p.y}) rotate(${p.spin})`}>
              <KidSprite id={kid.id} size={24 * p.grow} bob={0} wave={game.t * 9 + i} expr="happy" />
            </G>
          );
        }
        const x = kid.bayX != null ? kid.bayX : HERO_X + 40 + i * 26;
        const y = kid.bayY != null ? kid.bayY : HERO_Y;
        return (
          <G key={kid.uid} transform={`translate(${x} ${y})`}>
            <KidSprite
              id={kid.id}
              size={24}
              bob={Math.sin(game.t * 3.2 + i) * 1.6}
              wave={game.t * 5 + i}
              expr={expr === 'sad' ? 'sad' : 'happy'}
            />
          </G>
        );
      })}
    </G>
  );
}

/** Soft cream speech bubble with a little tail. */
export function SpeechBubble({
  x,
  y,
  text,
  alpha = 1,
  maxWidth = 160,
  tiny = false,
  tail = 'left',
  anchor = 'left',
}) {
  const { colors: C } = useTheme();
  const padX = tiny ? 7 : 10;
  const padY = tiny ? 5 : 7;
  const fontSize = tiny ? 8 : 11;
  // Prefer wrap over overflow — bold RN-SVG glyphs run wider than em tables.
  const innerMax = Math.max(24, maxWidth - padX * 2);
  const lines = wrapText(text, innerMax, fontSize);
  const contentW = lines.reduce((n, l) => Math.max(n, lineWidth(l, fontSize)), 0);
  const w = Math.min(
    maxWidth,
    Math.max(tiny ? 36 : 52, Math.ceil(contentW + padX * 2 + fontSize * 0.55))
  );
  const lineH = fontSize + 2;
  const h = lines.length * lineH + padY * 2;
  // anchor right = x is the right edge (bubble grows left toward center).
  const bx = anchor === 'right' ? x - w : x;
  const by = y - h;
  const textX = bx + w / 2;
  const tailPath =
    tail === 'right'
      ? `M ${bx + w - 11} ${by + h - 0.5} L ${bx + w - 2} ${by + h + 4.5} L ${bx + w - 6} ${by + h - 0.5} Z`
      : `M ${bx + 6} ${by + h - 0.5} L ${bx + 2} ${by + h + 4.5} L ${bx + 11} ${by + h - 0.5} Z`;

  return (
    <G opacity={alpha}>
      <Rect
        x={bx}
        y={by}
        width={w}
        height={h}
        rx={tiny ? 6 : 10}
        fill={C.panel}
        stroke={C.panelBorder}
        strokeWidth={tiny ? 1.3 : 2}
      />
      <Path d={tailPath} fill={C.panel} stroke={C.panelBorder} strokeWidth={1.1} />
      {lines.map((line, i) => (
        <SvgText
          key={i}
          x={textX}
          y={by + padY + (i + 1) * lineH - 1.5}
          fill={C.ink}
          fontSize={fontSize}
          fontWeight="800"
          textAnchor="middle"
        >
          {line}
        </SvgText>
      ))}
    </G>
  );
}

/** Em-width — slightly generous so bold text never clips the bubble edge. */
function glyphEm(ch) {
  if (ch === ' ' || ch === '\u00A0') return 0.3;
  if ('.!?,:…\'"`'.includes(ch)) return 0.32;
  if ('ilIjtfr1|'.includes(ch)) return 0.38;
  if ('mwMW@%'.includes(ch)) return 0.95;
  if (ch >= 'A' && ch <= 'Z') return 0.68;
  return 0.58;
}

function lineWidth(line, fontSize) {
  let w = 0;
  for (const ch of String(line)) w += fontSize * glyphEm(ch);
  return w;
}

function wrapText(text, maxInner, fontSize) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  words.forEach((word) => {
    const next = cur ? `${cur} ${word}` : word;
    if (lineWidth(next, fontSize) > maxInner && cur) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  });
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}
