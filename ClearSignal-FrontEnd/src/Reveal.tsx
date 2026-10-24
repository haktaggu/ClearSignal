import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

interface Props {
  visible: boolean;
  height: number;
  children: React.ReactNode;
}

// Smoothly expands/collapses its children to a fixed height, unmounting when hidden.
export default function Reveal({ visible, height, children }: Props) {
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, progress]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={{
        overflow: 'hidden',
        opacity: progress,
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }),
      }}
    >
      {children}
    </Animated.View>
  );
}
