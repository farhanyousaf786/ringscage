import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pressFeedback } from '../audio/sounds';
import { ChevronLeft } from '../components/Icons';
import { LEVELS } from '../game/levels';
import { WORLDS } from '../game/worlds';
import { useTheme } from '../theme/ThemeContext';

function Section({ title, colors: C, children }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.sectionLabel, { color: C.inkSoft }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.panelBorder }]}>
        {children}
      </View>
    </View>
  );
}

function Divider({ colors: C }) {
  return <View style={[styles.divider, { backgroundColor: C.panelBorder }]} />;
}

function ToggleRow({ label, hint, value, onChange, colors: C, last }) {
  return (
    <View style={[styles.toggleRow, last && styles.toggleRowLast]}>
      <View style={styles.toggleCopy}>
        <Text style={[styles.rowTitle, { color: C.ink }]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: C.inkSoft }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(next) => {
          onChange(next);
          // Feedback after prefs apply so enabling SFX/vibrate is heard/felt.
          setTimeout(() => pressFeedback(), 0);
        }}
        trackColor={{ false: C.inkFaint, true: C.accentLight }}
        thumbColor={value ? C.accent : C.card}
        ios_backgroundColor={C.inkFaint}
      />
    </View>
  );
}

function NavRow({ label, hint, onPress, colors: C, last, muted }) {
  return (
    <Pressable
      onPress={() => {
        pressFeedback();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.navRow,
        last && styles.toggleRowLast,
        pressed && { opacity: 0.82 },
        muted && { opacity: 0.55 },
      ]}
    >
      <View style={styles.toggleCopy}>
        <Text style={[styles.rowTitle, { color: C.ink }]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: C.inkSoft }]}>{hint}</Text> : null}
      </View>
      <Text style={[styles.chevron, { color: C.inkFaint }]}>›</Text>
    </Pressable>
  );
}

function Segmented({ options, value, onChange, colors: C }) {
  return (
    <View style={[styles.segment, { backgroundColor: C.bgDeep, borderColor: C.panelBorder }]}>
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              if (on) return;
              pressFeedback();
              onChange(opt.value);
            }}
            style={[styles.segmentChip, on && { backgroundColor: C.accent }]}
          >
            <Text style={[styles.segmentText, { color: on ? '#fff' : C.inkSoft }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen({
  progress,
  onBack,
  onWatchStory,
  onOpenShop,
  onUnlockAll,
  onUpdatePrefs,
}) {
  const insets = useSafeAreaInsets();
  const { colors: C, mode, setTheme } = useTheme();
  const allOpen = progress.unlocked >= LEVELS.length;
  const cleared = Object.keys(progress.stars || {}).length;
  const world =
    WORLDS.find((w) => progress.unlocked >= w.levelFrom && progress.unlocked <= w.levelTo) ||
    WORLDS[WORLDS.length - 1];
  const sfxOn = progress.sfxOn !== false;
  const musicOn = progress.musicOn !== false;
  const vibrateOn = progress.vibrateOn !== false;

  const patch = (partial) => onUpdatePrefs?.(partial);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: C.bg,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            pressFeedback();
            onBack();
          }}
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: C.card, borderColor: C.panelBorder }]}
        >
          <ChevronLeft size={22} color={C.ink} />
        </Pressable>
        <View style={styles.headerMid}>
          <Text style={[styles.title, { color: C.ink }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: C.inkSoft }]}>Sound, feel & progress</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Audio" colors={C}>
          <ToggleRow
            label="Sound effects"
            hint="Taps, frees, win & lose cues"
            value={sfxOn}
            onChange={(v) => patch({ sfxOn: v })}
            colors={C}
          />
          <Divider colors={C} />
          <ToggleRow
            label="Music"
            hint="Calm pad on map & story"
            value={musicOn}
            onChange={(v) => patch({ musicOn: v })}
            colors={C}
            last
          />
        </Section>

        <Section title="Feedback" colors={C}>
          <ToggleRow
            label="Vibration"
            hint="Tiny buzz on button taps"
            value={vibrateOn}
            onChange={(v) => patch({ vibrateOn: v })}
            colors={C}
            last
          />
        </Section>

        <Section title="Appearance" colors={C}>
          <View style={styles.padded}>
            <Text style={[styles.rowTitle, { color: C.ink, marginBottom: 10 }]}>Theme</Text>
            <Segmented
              colors={C}
              value={mode}
              onChange={setTheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </View>
        </Section>

        <Section title="Level progress" colors={C}>
          <View style={styles.statGrid}>
            <View style={[styles.statCell, { backgroundColor: C.panel, borderColor: C.panelBorder }]}>
              <Text style={[styles.statValue, { color: C.accent }]}>
                {Math.min(progress.unlocked, LEVELS.length)}
              </Text>
              <Text style={[styles.statLabel, { color: C.inkSoft }]}>Unlocked</Text>
            </View>
            <View style={[styles.statCell, { backgroundColor: C.panel, borderColor: C.panelBorder }]}>
              <Text style={[styles.statValue, { color: C.gold }]}>{cleared}</Text>
              <Text style={[styles.statLabel, { color: C.inkSoft }]}>Cleared</Text>
            </View>
            <View style={[styles.statCell, { backgroundColor: C.panel, borderColor: C.panelBorder }]}>
              <Text style={[styles.statValue, { color: C.ink }]}>✦ {progress.coins ?? 0}</Text>
              <Text style={[styles.statLabel, { color: C.inkSoft }]}>Coins</Text>
            </View>
          </View>
          <View style={styles.paddedTop}>
            <Text style={[styles.rowHint, { color: C.inkSoft }]}>
              Now · {world.name} · Levels {world.levelFrom}–{world.levelTo} · {LEVELS.length} total
            </Text>
          </View>
        </Section>

        <Section title="More" colors={C}>
          <NavRow
            label="See story"
            hint="Mama, Papa & Grim · opening tale"
            onPress={onWatchStory}
            colors={C}
          />
          <Divider colors={C} />
          <NavRow
            label="Coin nest"
            hint={`Balance · ✦ ${progress.coins ?? 0}`}
            onPress={onOpenShop}
            colors={C}
            last
          />
        </Section>

        <Section title="Developer" colors={C}>
          <NavRow
            label={allOpen ? 'All stages unlocked' : 'Unlock all stages'}
            hint={
              allOpen
                ? `Levels 1–${LEVELS.length} open`
                : `Open every world · 1–${LEVELS.length}`
            }
            onPress={() => {
              if (!allOpen) onUnlockAll?.();
            }}
            colors={C}
            last
            muted={allOpen}
          />
        </Section>

        <Text style={[styles.footer, { color: C.inkFaint }]}>Rings Cage · Featherlands</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginBottom: 8,
  },
  headerMid: { alignItems: 'center', flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  body: { flex: 1 },
  bodyContent: { paddingBottom: 28, paddingTop: 4 },
  sectionBlock: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  toggleRowLast: {},
  toggleCopy: { flex: 1 },
  rowTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  rowHint: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  chevron: {
    fontSize: 26,
    fontWeight: '300',
    marginTop: -2,
  },
  padded: { padding: 16 },
  paddedTop: { paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 2,
    padding: 4,
    gap: 4,
  },
  segmentChip: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontSize: 15, fontWeight: '900' },
  statGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 14,
  },
  statCell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 8,
  },
});
