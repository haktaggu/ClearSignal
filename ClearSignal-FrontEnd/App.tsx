import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LegendScreen from './src/LegendScreen';
import TranslatorScreen from './src/TranslatorScreen';

export default function App() {
  // The legend comes first so the colours mean something before the minimal screen.
  const [stage, setStage] = useState<'legend' | 'main'>('legend');

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center' }}>
        <StatusBar style="light" />
        {/* On web, keep the layout phone-width and centred on a black page. */}
        <View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 480 : undefined }}>
          {stage === 'legend' ? (
            <LegendScreen onContinue={() => setStage('main')} />
          ) : (
            <TranslatorScreen onShowLegend={() => setStage('legend')} />
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}
