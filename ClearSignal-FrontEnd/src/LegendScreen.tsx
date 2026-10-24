import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Glass from './Glass';
import TonePill from './TonePill';
import { TONES, colors } from './tones';

export default function LegendScreen({ onContinue }: { onContinue: () => void }) {
  const insets = useSafeAreaInsets();
  const fades = useRef(TONES.map(() => new Animated.Value(0))).current;
  const header = useRef(new Animated.Value(0)).current;
  const footer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(header, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.stagger(
        70,
        fades.map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ),
      Animated.timing(footer, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fades, header, footer]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 28 }]}>
      <Animated.View style={{ opacity: header }}>
        <Text style={styles.title}>Read between the words</Text>
        <Text style={styles.subtitle}>
          Translate as usual. Tap anywhere on the screen to reveal the tone behind each line.
        </Text>
      </Animated.View>

      <View style={styles.list}>
        {TONES.map((tone, i) => (
          <Animated.View
            key={tone.id}
            style={[
              styles.row,
              {
                opacity: fades[i],
                transform: [
                  { translateY: fades[i].interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                ],
              },
            ]}
          >
            <View style={styles.pillCol}>
              <TonePill tone={tone} />
            </View>
            <Text style={styles.meaning}>{tone.meaning}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[styles.footer, { opacity: footer }]}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Glass radius={26} contentStyle={styles.button}>
            <Text style={styles.buttonText}>Continue</Text>
          </Glass>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 28 },
  title: { color: colors.text, fontSize: 26, fontWeight: '600', letterSpacing: -0.4 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 330 },
  list: { marginTop: 36, gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pillCol: { width: 220 },
  meaning: { flex: 1, marginLeft: 12, color: colors.muted, fontSize: 14, lineHeight: 19 },
  footer: { marginTop: 'auto', alignItems: 'center' },
  button: {
    height: 52,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.text, fontSize: 15, fontWeight: '500', letterSpacing: 0.3 },
});
