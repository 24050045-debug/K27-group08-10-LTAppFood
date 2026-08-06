import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StatusBar, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const GREEN = '#22C55E';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo xuất hiện
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      // 2. Text xuất hiện
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });

    // 3. Dots loading pulse
    const pulseDot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();

    pulseDot(dotAnim1, 0);
    pulseDot(dotAnim2, 200);
    pulseDot(dotAnim3, 400);

    // 4. Sau 3 giây thì fade out và gọi onFinish
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeOut }]}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />

      {/* Background decorations */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      {/* Logo */}
      <Animated.View style={[styles.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Ionicons name="fast-food" size={54} color={GREEN} />
      </Animated.View>

      {/* App Name */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>FoodApp</Text>
        <Text style={styles.tagline}>Giao đồ ăn · Nhanh · Tiện lợi</Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
        <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
        <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', zIndex: 999,
  },
  circle1: {
    position: 'absolute', width: width * 1.4, height: width * 1.4,
    borderRadius: width * 0.7, backgroundColor: 'rgba(255,255,255,0.05)',
    top: -width * 0.5, right: -width * 0.3,
  },
  circle2: {
    position: 'absolute', width: width, height: width,
    borderRadius: width * 0.5, backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -width * 0.3, left: -width * 0.3,
  },
  circle3: {
    position: 'absolute', width: width * 0.6, height: width * 0.6,
    borderRadius: width * 0.3, backgroundColor: 'rgba(255,255,255,0.06)',
    top: height * 0.1, left: -width * 0.1,
  },
  logoBox: {
    width: 110, height: 110, borderRadius: 32, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    shadowColor: 'rgba(0,0,0,0.3)', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 12,
  },
  appName: {
    fontSize: 38, fontWeight: '900', color: '#FFF',
    letterSpacing: -1, marginBottom: 6,
  },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500', letterSpacing: 0.5 },
  dotsRow: { flexDirection: 'row', gap: 10, marginTop: 60 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.9)' },
});
