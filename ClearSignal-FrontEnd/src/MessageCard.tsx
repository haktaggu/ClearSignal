import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Reveal from './Reveal';
import ToneBar from './ToneBar';
import { LANGUAGES, TONE_MAP, colors } from './tones';
import type { LangCode, Message } from './types';

interface Props {
  message: Message;
  from: LangCode;
  to: LangCode;
  showTones: boolean;
  onOpenTone: (message: Message) => void;
}

const TONE_ROW = 58; // 14 gap + 44 pill

export default function MessageCard({ message, from, to, showTones, onOpenTone }: Props) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const tone = TONE_MAP[message.tone];

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      <Text style={styles.lang}>{LANGUAGES[from].name}</Text>
      <Text style={styles.source}>{message.text[from]}</Text>

      <View style={styles.divider} />

      <Text style={styles.lang}>{LANGUAGES[to].name}</Text>
      <Text style={styles.translation}>{message.text[to]}</Text>

      <Reveal visible={showTones} height={TONE_ROW}>
        <View style={styles.toneWrap}>
          <ToneBar tone={tone} intensity={message.intensity} onPress={() => onOpenTone(message)} />
        </View>
      </Reveal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 26,
    padding: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  lang: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  source: {
    color: colors.text,
    fontSize: 19,
    lineHeight: 27,
    opacity: 0.85,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 18,
  },
  translation: {
    color: colors.accent,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  toneWrap: { paddingTop: 14 },
});
