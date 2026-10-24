import React from 'react';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';

/* All icons are drawn as vector shapes (no emoji). 24x24 viewBox. */

export function ChevronLeft({ size = 24, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M15 4.5 L7.5 12 L15 19.5"
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function Bulb({ size = 24, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.5 C7.9 2.5 5.2 5.5 5.2 9 C5.2 11.3 6.3 12.8 7.6 14.2 C8.4 15.1 8.8 15.8 8.8 16.8 L15.2 16.8 C15.2 15.8 15.6 15.1 16.4 14.2 C17.7 12.8 18.8 11.3 18.8 9 C18.8 5.5 16.1 2.5 12 2.5 Z"
        fill={color}
      />
      <Rect x={9} y={18.2} width={6} height={2.2} rx={1.1} fill={color} />
      <Rect x={10} y={21} width={4} height={1.8} rx={0.9} fill={color} />
    </Svg>
  );
}

export function Restart({ size = 24, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19.2 12 A7.2 7.2 0 1 1 16.6 6.5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Polygon points="21.2,3.2 21.2,10 14.4,7.6" fill={color} />
    </Svg>
  );
}

export function Lock({ size = 24, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={10.5} width={14} height={10.5} rx={3} fill={color} />
      <Path
        d="M8 10.5 V8 A4 4 0 0 1 16 8 V10.5"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={12} cy={15.4} r={1.6} fill="#ffffff" fillOpacity={0.85} />
    </Svg>
  );
}

const STAR_POINTS = (() => {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? 10.5 : 4.4;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12.8 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
})();

export function Star({ size = 24, filled = true }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points={STAR_POINTS}
        fill={filled ? '#f7b928' : '#ecdcc2'}
        stroke={filled ? '#c98a0c' : '#d3bd9b'}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      {filled ? (
        <Polygon points="12,4.6 13.4,9.2 11,9.2" fill="#ffe08a" fillOpacity={0.9} />
      ) : null}
    </Svg>
  );
}

export function Gear({ size = 24, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 8.2 A3.8 3.8 0 1 0 12 15.8 A3.8 3.8 0 1 0 12 8.2 Z M12 3.2 L13.2 5.4 L15.6 4.8 L16.4 7.2 L18.8 7.6 L18.2 10 L20.2 11.4 L18.2 13.2 L18.8 15.6 L16.4 16 L15.6 18.4 L13.2 17.8 L12 20 L10.8 17.8 L8.4 18.4 L7.6 16 L5.2 15.6 L5.8 13.2 L3.8 11.4 L5.8 10 L5.2 7.6 L7.6 7.2 L8.4 4.8 L10.8 5.4 Z"
        fill={color}
        fillRule="evenodd"
      />
      <Circle cx={12} cy={12} r={2.2} fill="#fff7ea" />
    </Svg>
  );
}

/** Gold coin for currency pills. */
export function Coin({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill="#f7b928" />
      <Circle cx={12} cy={12} r={10} fill="none" stroke="#c98a0c" strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={7.2} fill="none" stroke="#ffe07a" strokeWidth={1.4} />
      <Path
        d="M12 6.8 V17.2 M9.2 9.2 C9.2 8 10.4 7.2 12 7.2 C13.6 7.2 14.8 8 14.8 9.2 C14.8 10.6 13.2 11.1 12 11.4 C10.8 11.7 9.2 12.2 9.2 13.8 C9.2 15.1 10.5 16 12 16 C13.5 16 14.8 15.1 14.8 13.8"
        stroke="#c98a0c"
        strokeWidth={1.7}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** Hammer — smash a cage open. */
export function Hammer({ size = 22, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M13.2 3.4 L20.2 8.2 L18.6 10.4 L11.6 5.6 Z"
        fill={color}
      />
      <Path
        d="M12.4 6.2 L15.8 8.6 L8.6 19.4 C8.1 20.1 7.1 20.2 6.5 19.6 L5.2 18.3 C4.6 17.7 4.7 16.7 5.4 16.2 Z"
        fill={color}
      />
      <Rect x={14.2} y={7.4} width={5.2} height={2.4} rx={0.8} fill={color} transform="rotate(35 16.8 8.6)" />
    </Svg>
  );
}

/** Play triangle — watch ad. */
export function Play({ size = 22, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon points="8,5 19,12 8,19" fill={color} />
    </Svg>
  );
}

/** Nest / gift — daily claim. */
export function NestGift({ size = 22, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4.5 11.5 H19.5 V18.5 C19.5 20 18.2 21 16.8 21 H7.2 C5.8 21 4.5 20 4.5 18.5 Z"
        fill={color}
      />
      <Rect x={3.5} y={9} width={17} height={3.2} rx={1.4} fill={color} />
      <Path d="M12 6.2 V21" stroke="#fff7ea" strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M12 9.2 C9.5 6.2 6.2 6.8 6.2 9.2 C6.2 10.6 8.8 11.2 12 9.2 Z"
        fill={color}
      />
      <Path
        d="M12 9.2 C14.5 6.2 17.8 6.8 17.8 9.2 C17.8 10.6 15.2 11.2 12 9.2 Z"
        fill={color}
      />
    </Svg>
  );
}

/** Shield — remove ads. */
export function Shield({ size = 22, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.8 L19.2 5.6 V11.4 C19.2 16.2 15.8 20.2 12 21.4 C8.2 20.2 4.8 16.2 4.8 11.4 V5.6 Z"
        fill={color}
      />
      <Path
        d="M8.6 12.1 L11 14.5 L15.6 9.6"
        stroke="#fff7ea"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Bag — coin shop. */
export function CoinBag({ size = 22, color = '#6b4a2f' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M7.2 9.5 L8.4 20.2 C8.5 21.1 9.3 21.8 10.2 21.8 H13.8 C14.7 21.8 15.5 21.1 15.6 20.2 L16.8 9.5 Z"
        fill={color}
      />
      <Path
        d="M9.2 9.2 C9.2 7.2 10.4 5.6 12 5.6 C13.6 5.6 14.8 7.2 14.8 9.2"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={12} cy={14.2} r={2.4} fill="#f7b928" stroke="#c98a0c" strokeWidth={1.2} />
    </Svg>
  );
}
