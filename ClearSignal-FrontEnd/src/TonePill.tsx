import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Glass from './Glass';
import { colors } from './tones';
import type { Tone } from './types';

// Legend pill: colour dot on one end, then emoji and label.
export default function TonePill({ tone }: { tone: Tone }) {
  return (
    <Glass radius={19} style={styles.shell} contentStyle={styles.row}>
      <View style={[styles.dot, { backgroundColor: tone.color }]} />
      <Text style={styles.emoji}>{tone.emoji}</Text>
      <Text style={styles.label}>{tone.label}</Text>
    </Glass>
  );
}

const styles = StyleSheet.create({
  shell: { alignSelf: 'flex-start' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingLeft: 12,
    paddingRight: 16,
    gap: 9,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  emoji: { fontSize: 16 },
  label: { color: colors.text, fontSize: 14, fontWeight: '500', letterSpacing: 0.2 },
});
