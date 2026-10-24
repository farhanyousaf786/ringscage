import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { AppState, Platform, Vibration } from 'react-native';

/**
 * Soft ASMR / cute SFX via expo-audio.
 * While dragging, `slide` plays as ONE continuous loop until finger lifts.
 */
const SOURCES = {
  slide: require('../../assets/sounds/rotate_slide.wav'),
  release: require('../../assets/sounds/release.wav'),
  rescue: require('../../assets/sounds/rescue.wav'),
  locked: require('../../assets/sounds/locked.wav'),
  sad: require('../../assets/sounds/sad.wav'),
  happy: require('../../assets/sounds/happy.wav'),
  win: require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
  tap: require('../../assets/sounds/tap.wav'),
  chirp1: require('../../assets/sounds/chirp1.wav'),
  chirp2: require('../../assets/sounds/chirp2.wav'),
  chirp3: require('../../assets/sounds/chirp3.wav'),
  pop: require('../../assets/sounds/pop.wav'),
  twinkle: require('../../assets/sounds/twinkle.wav'),
  bgm: require('../../assets/sounds/bgm_soft.wav'),
  bgmPlay: require('../../assets/sounds/bgm_play.wav'),
};

const VOL = {
  slide: 0.22,
  release: 0.5,
  rescue: 0.5,
  locked: 0.35,
  sad: 0.42,
  happy: 0.45,
  win: 0.55,
  lose: 0.5,
  tap: 0.4,
  chirp1: 0.5,
  chirp2: 0.5,
  chirp3: 0.5,
  pop: 0.38,
  twinkle: 0.45,
  bgm: 0.18,
  /** Cartoon play bed — kept dim under ring SFX */
  bgmPlay: 0.11,
};

/** @type {Record<string, import('expo-audio').AudioPlayer>} */
const pool = {};
let ready = false;
let loading = null;
let disposed = false;
let sliding = false;

/** Runtime prefs — synced from saved progress. */
let prefs = { sfx: true, music: true, vibrate: true };

export function setAudioPrefs({ sfx, music, vibrate } = {}) {
  if (typeof sfx === 'boolean') prefs.sfx = sfx;
  if (typeof music === 'boolean') prefs.music = music;
  if (typeof vibrate === 'boolean') prefs.vibrate = vibrate;
  if (!prefs.music) {
    stopBgm();
  }
}

export function getAudioPrefs() {
  return { ...prefs };
}

async function ensure() {
  if (disposed) return;
  if (ready) return;
  if (loading) return loading;

  loading = (async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
        allowsRecording: false,
      });
      if (disposed) return;

      for (const [key, src] of Object.entries(SOURCES)) {
        if (pool[key] || disposed) continue;
        try {
          const player = createAudioPlayer(src, { updateInterval: 250 });
          player.volume = VOL[key] ?? 0.5;
          if (key === 'slide' || key === 'bgm' || key === 'bgmPlay') {
            player.loop = true;
          }
          if (key === 'slide') {
            // Fallback if native loop drops: keep hissing while finger is down.
            player.addListener('playbackStatusUpdate', (status) => {
              if (!sliding || disposed) return;
              if (status.didJustFinish && !status.loop) {
                try {
                  player.seekTo(0).then(() => {
                    if (sliding && !disposed) player.play();
                  });
                } catch {
                  /* ignore */
                }
              }
            });
          }
          pool[key] = player;
        } catch {
          /* skip this clip */
        }
      }
      ready = Object.keys(pool).length > 0;
    } catch {
      ready = false;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export async function pauseAllSounds() {
  sliding = false;
  Object.values(pool).forEach((player) => {
    try {
      if (player.playing) player.pause();
    } catch {
      /* ignore */
    }
  });
}

export async function unloadSounds() {
  disposed = true;
  ready = false;
  sliding = false;
  const players = Object.values(pool);
  for (const key of Object.keys(pool)) delete pool[key];
  players.forEach((player) => {
    try {
      player.pause();
    } catch {
      /* ignore */
    }
    try {
      player.remove();
    } catch {
      /* ignore */
    }
  });
}

export async function preloadSounds() {
  disposed = false;
  await ensure();
}

export async function playSound(name) {
  if (!prefs.sfx) return;
  if (disposed || AppState.currentState !== 'active') return;
  await ensure();
  if (disposed || AppState.currentState !== 'active') return;
  const player = pool[name];
  if (!player) return;
  try {
    if (player.playing) {
      if (name === 'slide') return;
      player.pause();
    }
    await player.seekTo(0);
    if (disposed || AppState.currentState !== 'active') return;
    player.play();
  } catch {
    /* never throw into React */
  }
}

/** Tiny buzz for UI presses (no-op on web / when vibrate off). */
export function buzz(ms = 8) {
  if (!prefs.vibrate) return;
  if (Platform.OS === 'web' || AppState.currentState !== 'active') return;
  try {
    Vibration.vibrate(ms);
  } catch {
    /* ignore */
  }
}

/** Soft tap + tiny vibration for every UI button. */
export function pressFeedback() {
  buzz(8);
  playSound('tap');
}

/** Start ONE continuous slide loop; do not restart while already sliding. */
export async function startRotateSlide() {
  if (!prefs.sfx) return;
  if (disposed || AppState.currentState !== 'active') return;
  if (sliding) return; // keep the same unbroken ssssss going
  await ensure();
  const player = pool.slide;
  if (!player) return;
  try {
    sliding = true;
    player.loop = true;
    player.volume = VOL.slide;
    if (!player.playing) {
      await player.seekTo(0);
      if (disposed || !sliding || AppState.currentState !== 'active') return;
      player.play();
    }
  } catch {
    sliding = false;
  }
}

/** Stop only when the finger lifts. */
export async function stopRotateSlide() {
  if (!sliding) return;
  sliding = false;
  const player = pool.slide;
  if (!player) return;
  try {
    if (player.playing) player.pause();
  } catch {
    /* ignore */
  }
}

export function isSliding() {
  return sliding;
}

let bgmOn = false;
/** @type {'map' | 'play' | null} */
let bgmMode = null;

async function playBgmTrack(key) {
  if (!prefs.music) return;
  if (disposed || AppState.currentState !== 'active') return;
  await ensure();
  const next = pool[key];
  if (!next) return;
  // Pause the other bed so only one pad loops.
  for (const k of ['bgm', 'bgmPlay']) {
    if (k === key) continue;
    const other = pool[k];
    if (other?.playing) {
      try {
        other.pause();
      } catch {
        /* ignore */
      }
    }
  }
  try {
    bgmOn = true;
    bgmMode = key === 'bgmPlay' ? 'play' : 'map';
    next.loop = true;
    next.volume = VOL[key] ?? 0.18;
    if (!next.playing) {
      await next.seekTo(0);
      if (disposed || !bgmOn || AppState.currentState !== 'active') return;
      next.play();
    }
  } catch {
    bgmOn = false;
    bgmMode = null;
  }
}

/** Soft map / story pad. */
export async function startBgm() {
  return playBgmTrack('bgm');
}

/** Cute cartoon bed for puzzle levels — dim under SFX. */
export async function startPlayBgm() {
  return playBgmTrack('bgmPlay');
}

export async function stopBgm() {
  bgmOn = false;
  bgmMode = null;
  for (const key of ['bgm', 'bgmPlay']) {
    const player = pool[key];
    if (!player) continue;
    try {
      if (player.playing) player.pause();
    } catch {
      /* ignore */
    }
  }
}

export function isBgmPlaying() {
  return bgmOn;
}

export function getBgmMode() {
  return bgmMode;
}
