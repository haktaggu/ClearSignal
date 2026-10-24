import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Glass from './Glass';
import MessageCard from './MessageCard';
import ToneSheet from './ToneSheet';
import { haptic } from './haptics';
import { LANGUAGES, colors } from './tones';
import { useConversation } from './useConversation';
import type { LangCode, Message } from './types';

export default function TranslatorScreen({ onShowLegend }: { onShowLegend: () => void }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [listening, setListening] = useState(false);
  const [showTones, setShowTones] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [langs, setLangs] = useState<{ from: LangCode; to: LangCode }>({ from: 'en', to: 'es' });

  const { messages, clear } = useConversation(listening);

  // Quiet breathing ring around the mic while listening.
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!listening) {
      ring.stopAnimation();
      ring.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [listening, ring]);

  const toggleListening = useCallback(() => {
    haptic('light');
    setListening((on) => {
      if (!on) clear();
      return !on;
    });
    setSelected(null);
  }, [clear]);

  const toggleTones = useCallback(() => {
    haptic('select');
    setShowTones((v) => !v);
  }, []);

  const swap = useCallback(() => {
    haptic('select');
    setLangs((l) => ({ from: l.to, to: l.from }));
  }, []);

  const closeSheet = useCallback(() => setSelected(null), []);

  const earlierMessage = selected?.refersToId
    ? messages.find((m) => m.id === selected.refersToId)
    : undefined;

  const empty = messages.length === 0;
  const status = listening ? 'Listening' : empty ? 'Tap to translate' : 'Paused';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
      {/* Language bar */}
      <View style={styles.header}>
        <View style={styles.langBar}>
          <Glass radius={22} style={styles.langPill} contentStyle={styles.langInner}>
            <Text style={styles.langText}>{LANGUAGES[langs.from].name}</Text>
          </Glass>
          <Pressable
            onPress={swap}
            hitSlop={10}
            style={styles.swap}
            accessibilityRole="button"
            accessibilityLabel="Swap languages"
          >
            <Ionicons name="swap-horizontal" size={22} color={colors.muted} />
          </Pressable>
          <Glass radius={22} style={styles.langPill} contentStyle={styles.langInner}>
            <Text style={styles.langText}>{LANGUAGES[langs.to].name}</Text>
          </Glass>
        </View>
        <Pressable
          onPress={onShowLegend}
          hitSlop={14}
          style={styles.help}
          accessibilityRole="button"
          accessibilityLabel="Show tone legend"
        >
          <Ionicons name="help-circle-outline" size={22} color={colors.muted} />
        </Pressable>
      </View>

      {/* Tap anywhere on the conversation to reveal / hide tone */}
      <Pressable
        style={styles.stage}
        onPress={toggleTones}
        accessible={false}
        accessibilityLabel="Tap to toggle tone indicators"
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.content, empty && styles.contentEmpty]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {empty ? (
            <Text style={styles.emptyText}>
              {listening ? 'Listening…' : 'Speak and see it translated'}
            </Text>
          ) : (
            messages.map((m) => (
              <MessageCard
                key={m.id}
                message={m}
                from={langs.from}
                to={langs.to}
                showTones={showTones}
                onOpenTone={(msg) => {
                  haptic('select');
                  setSelected(msg);
                }}
              />
            ))
          )}
        </ScrollView>
      </Pressable>

      {/* Mic */}
      <View style={styles.dock}>
        <Text style={styles.hint}>
          {empty ? ' ' : showTones ? 'Tap anywhere to hide tone' : 'Tap anywhere to show tone'}
        </Text>
        <View style={styles.micWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
              },
            ]}
          />
          <Pressable
            onPress={toggleListening}
            style={({ pressed }) => pressed && { transform: [{ scale: 0.96 }] }}
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Stop listening' : 'Start listening'}
          >
            <Glass
              radius={40}
              intensity={45}
              style={listening ? styles.micShellActive : undefined}
              contentStyle={styles.mic}
            >
              <Ionicons
                name={listening ? 'stop' : 'mic'}
                size={listening ? 24 : 30}
                color={listening ? '#000' : colors.text}
              />
            </Glass>
          </Pressable>
        </View>
        <Text style={styles.status}>{status}</Text>
      </View>

      <ToneSheet
        message={selected}
        earlier={earlierMessage?.text[langs.from]}
        onClose={closeSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  header: { justifyContent: 'center' },
  langBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 28 },
  langPill: { flex: 1 },
  langInner: { height: 46, alignItems: 'center', justifyContent: 'center' },
  langText: { color: colors.text, fontSize: 15, fontWeight: '500', letterSpacing: 0.2 },
  swap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  help: { position: 'absolute', right: 0 },
  stage: { flex: 1, marginTop: 14 },
  scroll: { flex: 1 },
  content: { gap: 14, paddingBottom: 20 },
  contentEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.faint, fontSize: 18, letterSpacing: 0.2 },
  dock: { alignItems: 'center', paddingTop: 6 },
  hint: { color: colors.faint, fontSize: 12, letterSpacing: 0.5, height: 18 },
  micWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.text,
  },
  mic: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  micShellActive: { backgroundColor: colors.text, borderColor: colors.text },
  status: { marginTop: 12, color: colors.muted, fontSize: 12, letterSpacing: 1.2 },
});
