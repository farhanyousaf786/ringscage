export const LIGHT = {
  mode: 'light',
  bg: '#f8eedd',
  bgDeep: '#f1e2c8',
  panel: '#fff7ea',
  panelBorder: '#ecd9bd',
  card: '#ffffff',
  ink: '#6b4a2f',
  inkSoft: '#a98660',
  inkFaint: '#d3bd9b',
  accent: '#e8872a',
  accentDark: '#b8601a',
  accentLight: '#ffc27d',
  good: '#4caf50',
  goodDark: '#2f8a35',
  warn: '#ff5a3c',
  gold: '#f7b928',
  goldDark: '#c98a0c',
  white: '#ffffff',
  shadow: 'rgba(90, 55, 20, 0.22)',
  stageBg: '#fff8ee',
};

export const DARK = {
  mode: 'dark',
  bg: '#1a1520',
  bgDeep: '#121018',
  panel: '#2a2230',
  panelBorder: '#3d3348',
  card: '#32293a',
  ink: '#f3e6d4',
  inkSoft: '#c4a882',
  inkFaint: '#7a6a5a',
  accent: '#f0a04a',
  accentDark: '#d47820',
  accentLight: '#ffc27d',
  good: '#5cbf62',
  goodDark: '#3a9a42',
  warn: '#ff6b55',
  gold: '#f7b928',
  goldDark: '#c98a0c',
  white: '#ffffff',
  shadow: 'rgba(0, 0, 0, 0.45)',
  stageBg: '#241c2a',
};

/** @deprecated use useTheme().colors — kept for modules that import COLORS statically */
export const COLORS = LIGHT;

export const RING_COLORS = {
  blue: { main: '#3d9bd8', dark: '#2573a8', light: '#8ad0f5' },
  orange: { main: '#e8872a', dark: '#b8601a', light: '#ffc27d' },
  green: { main: '#5cbf4a', dark: '#3a8f2c', light: '#a6e68f' },
  pink: { main: '#e9577a', dark: '#b93658', light: '#ff9db6' },
  purple: { main: '#9a62e0', dark: '#6e3fb0', light: '#c9a3f5' },
  teal: { main: '#2fb8a8', dark: '#1d8a7d', light: '#7fe3d6' },
  gold: { main: '#e8b92a', dark: '#b88a14', light: '#ffe07a' },
};

export const DIFFICULTY_COLORS = {
  Easy: '#4caf50',
  Medium: '#e8a21a',
  Hard: '#e8672a',
  Expert: '#d4415a',
};

export function paletteFor(mode) {
  return mode === 'dark' ? DARK : LIGHT;
}
