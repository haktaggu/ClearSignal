import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Glass from './Glass';
import { colors } from './tones';
import type { Tone } from './types';

interface Props {
  tone: Tone;
  intensity: number;
  onPress?: () => void;
}

// Horizontal glass pill: emoji, a coloured intensity bar, then the label.
export default function ToneBar({ tone, intensity, onPress }: Props) {
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: intensity,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [intensity, fill]);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${tone.label} tone${onPress ? ', tap for details' : ''}`}
      style={({ pressed }) => [pressed && { opacity: 0.7 }]}
    >
      <Glass radius={22} contentStyle={styles.row}>
        <Text style={styles.emoji}>{tone.emoji}</Text>
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: tone.color,
                width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
        <Text style={styles.label}>{tone.label}</Text>
      </Glass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 16,
    gap: 12,
  },
  emoji: { fontSize: 20 },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 3 },
  label: {
    minWidth: 76,
    textAlign: 'right',
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
