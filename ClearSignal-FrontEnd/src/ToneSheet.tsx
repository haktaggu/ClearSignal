import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Glass from './Glass';
import ToneBar from './ToneBar';
import { TONE_MAP, colors } from './tones';
import type { Message } from './types';

interface Props {
  message: Message | null;
  /** Source-language text of the earlier line a "walked back" tone refers to. */
  earlier?: string;
  onClose: () => void;
}

const OFFSCREEN = 640;

// Glass sheet that pops up from the bottom with the reasoning behind a tone.
export default function ToneSheet({ message, earlier, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState<Message | null>(message);
  const y = useRef(new Animated.Value(OFFSCREEN)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      setShown(message);
      y.setValue(OFFSCREEN);
      Animated.parallel([
        Animated.spring(y, { toValue: 0, damping: 22, stiffness: 220, mass: 0.9, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(y, { toValue: OFFSCREEN, duration: 240, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setShown(null);
      });
    }
  }, [message, y, fade]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) y.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 90 || g.vy > 0.8) {
            onClose();
          } else {
            Animated.spring(y, { toValue: 0, useNativeDriver: true }).start();
          }
        },
      }),
    [y, onClose]
  );

  if (!shown) return null;
  const tone = TONE_MAP[shown.tone];

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.fill}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={styles.fillAbs} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: y }] }} {...pan.panHandlers}>
          <Glass
            radius={30}
            intensity={55}
            style={styles.sheetShell}
            contentStyle={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}
          >
            <View style={styles.grabber} />

            <ToneBar tone={tone} intensity={shown.intensity} />

            <Text style={styles.meaning}>{tone.meaning}</Text>

            {shown.why ? (
              <>
                <Text style={styles.sectionLabel}>Why it feels this way</Text>
                <Text style={styles.body}>{shown.why}</Text>
              </>
            ) : null}

            {shown.signals.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>What we heard</Text>
                <View style={styles.signals}>
                  {shown.signals.map((s) => (
                    <View key={s} style={styles.signal}>
                      <Text style={styles.signalText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {earlier ? (
              <>
                <Text style={styles.sectionLabel}>Reverting this earlier point</Text>
                <View style={styles.quote}>
                  <Text style={styles.quoteText}>“{earlier}”</Text>
                </View>
              </>
            ) : null}

            {shown.context ? (
              <>
                <Text style={styles.sectionLabel}>Context</Text>
                <Text style={styles.body}>{shown.context}</Text>
              </>
            ) : null}
          </Glass>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  fillAbs: { ...StyleSheet.absoluteFillObject },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetShell: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: 'rgba(18,18,20,0.72)',
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 20,
  },
  meaning: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 12,
    marginLeft: 6,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
  },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  signals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  signal: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  signalText: { color: colors.text, fontSize: 13, opacity: 0.9 },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: TONE_MAP.contradict.color,
    paddingLeft: 12,
  },
  quoteText: { color: colors.text, fontSize: 15, lineHeight: 22, opacity: 0.85 },
});
