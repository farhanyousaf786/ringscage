import React, { memo } from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { getKid } from './catalog';

const INK = '#2a1a10';
const BEAK = '#f5a43c';
const BEAK_DARK = '#c97a1e';

const BODY_CY = -16;
const BODY_RX = 16;
const BODY_RY = 17;

/** One scalloped "fluffy" outline, built once and shared by every hatchling. */
const FUZZ_PATH = (() => {
  const N = 20;
  const TAU = Math.PI * 2;
  const pt = (a, k = 1) => [Math.cos(a) * BODY_RX * k, BODY_CY + Math.sin(a) * BODY_RY * k];
  let d = '';
  for (let i = 0; i < N; i += 1) {
    const a0 = (i / N) * TAU;
    const a1 = ((i + 1) / N) * TAU;
    const [x0, y0] = pt(a0);
    const [cx, cy] = pt((a0 + a1) / 2, 1.1);
    const [x1, y1] = pt(a1);
    d += i === 0 ? `M ${x0.toFixed(2)} ${y0.toFixed(2)} ` : '';
    d += `Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)} `;
  }
  return `${d}Z`;
})();

/**
 * Fluffy bird — round puffball, huge rimmed eyes, tiny beak, orange feet.
 * Used for the baby chicks AND the parent hero (same body, different palette + extras).
 * Origin = feet / bottom centre. Looks come from catalog.js.
 * expr: neutral | happy | sad.  cheer 0..1 raises the wings.
 * `behind` / `front` are optional SVG nodes drawn in the same 40-unit space (cape, badge…).
 */
export function Bird({ c, size = 28, bob = 0, wave = 0, expr = 'neutral', cheer = 0, behind, front }) {
  const s = size / 40;
  const face = expr === 'happy' || expr === 'sad' ? expr : 'neutral';
  const flap = face === 'happy' ? Math.sin(wave * 2) * 22 : Math.sin(wave * 0.6) * 4;
  const raise = cheer * 62;
  const sway = Math.sin(wave * 0.8) * (face === 'happy' ? 3 : 1);

  return (
    <G transform={`scale(${s}) translate(0 ${-bob})`}>
      <Ellipse cx={0} cy={2} rx={13} ry={2.8} fill="rgba(60,30,10,0.16)" />

      {/* feet */}
      <Ellipse cx={-5.5} cy={0.6} rx={4} ry={2} fill={BEAK} stroke={BEAK_DARK} strokeWidth={0.8} />
      <Ellipse cx={5.5} cy={0.6} rx={4} ry={2} fill={BEAK} stroke={BEAK_DARK} strokeWidth={0.8} />

      <G transform={`rotate(${sway} 0 -1)`}>
        {behind}
        <Tuft c={c} />

        {/* fluffy body: soft shadow layer, fur, belly, sheen */}
        <Path d={FUZZ_PATH} fill={c.bodyDark} transform="translate(0.9 1.1)" />
        <Path d={FUZZ_PATH} fill={c.body} stroke={c.bodyDark} strokeWidth={0.7} strokeOpacity={0.55} />
        <Ellipse cx={0} cy={-7.5} rx={10.5} ry={7.5} fill={c.belly} fillOpacity={0.9} />
        <Ellipse cx={-7} cy={-27} rx={5} ry={2.6} fill="#ffffff" fillOpacity={0.28} />

        {/* little wings */}
        <G transform={`rotate(${24 + flap + raise} -14 -16)`}>
          <Ellipse cx={-16} cy={-11} rx={3.2} ry={6} fill={c.bodyDark} fillOpacity={0.9} />
        </G>
        <G transform={`rotate(${-24 - flap - raise} 14 -16)`}>
          <Ellipse cx={16} cy={-11} rx={3.2} ry={6} fill={c.bodyDark} fillOpacity={0.9} />
        </G>

        <Face c={c} wave={wave} expr={face} />
        {front}
      </G>
    </G>
  );
}

/** Baby chick (catalog KIDS). */
function KidSprite({ id = 'seal', size = 28, bob = 0, wave = 0, expr = 'neutral' }) {
  return <Bird c={getKid(id)} size={size} bob={bob} wave={wave} expr={expr} />;
}

function Tuft({ c }) {
  const col = c.tuftColor || c.body;
  switch (c.tuft) {
    case 'feathers':
      return (
        <G>
          {[
            'M -1 -31 Q -6 -41 -14 -42',
            'M 1 -31 Q -2 -43 -9 -47',
            'M 3 -31 Q 4 -42 0 -48',
          ].map((d) => (
            <G key={d}>
              <Path d={d} stroke={col} strokeWidth={3.4} strokeLinecap="round" fill="none" />
              <Path d={d} stroke="#ffffff" strokeOpacity={0.45} strokeWidth={0.9} strokeLinecap="round" fill="none" />
            </G>
          ))}
        </G>
      );
    case 'sprout':
      return (
        <G>
          {['M 0 -31 Q 0 -37 -1 -41', 'M -2 -31 Q -4 -36 -7 -38', 'M 2 -31 Q 4 -36 7 -38'].map((d) => (
            <Path key={d} d={d} stroke={col} strokeWidth={3} strokeLinecap="round" fill="none" />
          ))}
        </G>
      );
    case 'curl':
      return (
        <Path
          d="M 0 -31 Q 0 -38 4 -38 Q 8 -38 6.5 -35 Q 5 -33.5 3.6 -35.5"
          stroke={col}
          strokeWidth={2.8}
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'tufts':
      return (
        <G>
          <Ellipse cx={-9} cy={-31} rx={3} ry={5.5} fill={col} transform="rotate(-28 -9 -31)" />
          <Ellipse cx={9} cy={-31} rx={3} ry={5.5} fill={col} transform="rotate(28 9 -31)" />
        </G>
      );
    case 'horns':
      return (
        <G>
          <Path
            d="M -8 -28 Q -14 -40 -10 -46"
            stroke={col}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 8 -28 Q 14 -40 10 -46"
            stroke={col}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M -10 -44 L -12 -48" stroke="#e85a4a" strokeWidth={2} strokeLinecap="round" />
          <Path d="M 10 -44 L 12 -48" stroke="#e85a4a" strokeWidth={2} strokeLinecap="round" />
        </G>
      );
    case 'spikes':
      return (
        <G>
          {[
            [-8, -30, -11, -42],
            [-3, -32, -3, -44],
            [3, -32, 3, -44],
            [8, -30, 11, -42],
          ].map(([x0, y0, x1, y1]) => (
            <Path
              key={`${x0}`}
              d={`M ${x0} ${y0} L ${x1} ${y1}`}
              stroke={col}
              strokeWidth={3.4}
              strokeLinecap="round"
            />
          ))}
        </G>
      );
    case 'crest':
    default:
      return (
        <G>
          {[
            [-7, -31, -10, -38],
            [-3.5, -32, -5, -41],
            [0, -33, 0, -43],
            [3.5, -32, 5, -41],
            [7, -31, 10, -38],
          ].map(([x0, y0, x1, y1]) => (
            <Path
              key={`${x0}`}
              d={`M ${x0} ${y0} Q ${(x0 + x1) / 2 + 1} ${(y0 + y1) / 2} ${x1} ${y1}`}
              stroke={col}
              strokeWidth={3.2}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </G>
      );
  }
}

function Eye({ side, c, wave, expr }) {
  const cx = side * 6.3;
  const cy = -20;

  if (expr === 'happy') {
    return (
      <>
        <Path
          d={`M ${cx - 5} ${cy + 1.5} Q ${cx} ${cy - 6.5} ${cx + 5} ${cy + 1.5}`}
          stroke={INK}
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
        />
        {c.lashes ? <Lashes side={side} cx={cx} cy={cy} /> : null}
      </>
    );
  }

  const blink = expr === 'neutral' && Math.sin(wave * 0.55) > 0.992;
  const ry = blink ? 0.9 : 7;
  const look = Math.sin(wave * 0.4 + side) * 0.9;
  const lookY = expr === 'sad' ? -1.1 : 0.4;

  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={6.3} ry={ry} fill="#fbfbfb" stroke={c.bodyDark} strokeWidth={1.5} />
      {blink ? null : (
        <>
          <Circle cx={cx + look} cy={cy + lookY} r={4.2} fill={c.iris} />
          <Circle cx={cx + look} cy={cy + lookY} r={2.5} fill="#16100c" />
          <Circle cx={cx + look - 1.5} cy={cy + lookY - 1.6} r={1.25} fill="#ffffff" />
          <Circle cx={cx + look + 1.4} cy={cy + lookY + 1.5} r={0.6} fill="#ffffff" fillOpacity={0.8} />
        </>
      )}
      {c.lashes ? <Lashes side={side} cx={cx} cy={cy} /> : null}
      {expr === 'sad' ? (
        <Path
          d={`M ${cx - side * 5.5} ${cy - 9} L ${cx + side * 4} ${cy - 11.5}`}
          stroke={c.bodyDark}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ) : null}
    </>
  );
}

function Lashes({ side, cx, cy }) {
  const ox = cx + side * 5.8;
  return (
    <>
      <Path d={`M ${ox} ${cy - 3} L ${ox + side * 3} ${cy - 5}`} stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      <Path d={`M ${ox + side * 0.6} ${cy - 0.5} L ${ox + side * 3.4} ${cy - 1.4}`} stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
      <Path d={`M ${ox} ${cy + 2} L ${ox + side * 2.6} ${cy + 2.8}`} stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
    </>
  );
}

function Face({ c, wave, expr }) {
  if (c.villain) return <VillainFace c={c} wave={wave} expr={expr} />;
  const blush = expr === 'sad' ? 0.85 : 0.6;
  return (
    <>
      <Eye side={-1} c={c} wave={wave} expr={expr} />
      <Eye side={1} c={c} wave={wave} expr={expr} />

      {c.brows && expr !== 'sad' ? (
        <>
          <Path d="M -11 -29.5 Q -6.5 -31.8 -2 -29.6" stroke={c.brows} strokeWidth={2.6} strokeLinecap="round" fill="none" />
          <Path d="M 2 -29.6 Q 6.5 -31.8 11 -29.5" stroke={c.brows} strokeWidth={2.6} strokeLinecap="round" fill="none" />
        </>
      ) : null}
      <Ellipse cx={-12} cy={-10.5} rx={2.8} ry={1.7} fill={c.blush} fillOpacity={blush} />
      <Ellipse cx={12} cy={-10.5} rx={2.8} ry={1.7} fill={c.blush} fillOpacity={blush} />

      <Path
        d="M -2.5 -13.6 Q 0 -16.2 2.5 -13.6 Q 2 -10.4 0 -9.6 Q -2 -10.4 -2.5 -13.6 Z"
        fill={BEAK}
        stroke={BEAK_DARK}
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      {expr === 'happy' ? (
        <Path d="M -1.7 -11.4 Q 0 -8.4 1.7 -11.4 Z" fill="#c4503a" />
      ) : null}
      {expr === 'sad' ? (
        <Path
          d="M 11.2 -14 Q 13.6 -10.8 11.2 -8.6 Q 8.8 -10.8 11.2 -14 Z"
          fill="#8fd4ff"
          stroke="#4aa0e8"
          strokeWidth={0.6}
        />
      ) : null}
    </>
  );
}

/** Mean mug: smug when “happy”, furious when “angry”, crushed when “sad”. */
function VillainFace({ c, wave, expr }) {
  const mood = expr === 'happy' || expr === 'sad' || expr === 'angry' ? expr : 'neutral';
  return (
    <>
      {/* angry / smug brows */}
      <Path
        d={
          mood === 'sad'
            ? 'M -11 -28 Q -6.5 -26 -2 -28'
            : 'M -11 -31 Q -6.5 -27.5 -2 -29'
        }
        stroke={c.brows}
        strokeWidth={2.8}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={
          mood === 'sad'
            ? 'M 2 -28 Q 6.5 -26 11 -28'
            : 'M 2 -29 Q 6.5 -27.5 11 -31'
        }
        stroke={c.brows}
        strokeWidth={2.8}
        strokeLinecap="round"
        fill="none"
      />

      {mood === 'happy' ? (
        <>
          {/* smug half-lids */}
          <Path d="M -10 -21 Q -6.5 -17 -3 -21" stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M 3 -21 Q 6.5 -17 10 -21" stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <Path d="M -5 -10.5 Q 0 -7 5 -10.5" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M -3 -9.2 Q 0 -7.2 3 -9.2" fill="#1a1020" />
        </>
      ) : mood === 'angry' ? (
        <>
          <Ellipse cx={-5} cy={-20} rx={4.2} ry={4.8} fill="#fbfbfb" stroke={c.bodyDark} strokeWidth={1.2} />
          <Ellipse cx={5} cy={-20} rx={4.2} ry={4.8} fill="#fbfbfb" stroke={c.bodyDark} strokeWidth={1.2} />
          <Circle cx={-5} cy={-20} r={2.6} fill={c.iris} />
          <Circle cx={5} cy={-20} r={2.6} fill={c.iris} />
          <Circle cx={-5} cy={-20} r={1.4} fill="#16100c" />
          <Circle cx={5} cy={-20} r={1.4} fill="#16100c" />
          <Path d="M -4 -11 Q 0 -5 4 -11 Q 0 -8.5 -4 -11 Z" fill="#1a1020" />
        </>
      ) : mood === 'sad' ? (
        <>
          <Eye side={-1} c={c} wave={wave} expr="sad" />
          <Eye side={1} c={c} wave={wave} expr="sad" />
          <Path d="M -4 -10.5 Q 0 -13.5 4 -10.5" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Eye side={-1} c={c} wave={wave} expr="neutral" />
          <Eye side={1} c={c} wave={wave} expr="neutral" />
          <Path d="M -4 -11 Q 0 -9 4 -11" stroke={INK} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </>
      )}

      <Path
        d="M -2.5 -14.2 Q 0 -17 2.5 -14.2 Q 2 -11 0 -10.2 Q -2 -11 -2.5 -14.2 Z"
        fill={BEAK}
        stroke={BEAK_DARK}
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      {/* little fang tips */}
      <Path d="M -2.2 -12.2 L -1.4 -9.6 L -0.6 -12.2" fill="#fff" stroke={INK} strokeWidth={0.5} />
      <Path d="M 0.6 -12.2 L 1.4 -9.6 L 2.2 -12.2" fill="#fff" stroke={INK} strokeWidth={0.5} />
    </>
  );
}

export default memo(KidSprite);
