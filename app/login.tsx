import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/constants/theme';

const { width } = Dimensions.get('window');
const GREEN = COLORS.primary;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    const res = await login(trimmedEmail, trimmedPassword);
    setLoading(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Đăng nhập thất bại', res.error || 'Email hoặc mật khẩu không đúng.');
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Tích hợp Đăng nhập Google OAuth thực tế ở phần sau
    Alert.alert('Thông báo', 'Tính năng Đăng nhập bằng Google đang được phát triển.');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F8" />

      {/* Background Decor */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBg}>
                <Ionicons name="fast-food" size={38} color="#FFF" />
              </View>
              <Text style={styles.appName}>FoodApp</Text>
              <Text style={styles.tagline}>Giao đồ ăn nhanh, tiện lợi</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Đăng nhập</Text>

              {/* Email field */}
              <View style={styles.fieldLabel}>
                <Text style={styles.label}>Email</Text>
              </View>
              <View style={[styles.inputBox, emailFocused && styles.inputBoxFocused]}>
                <Ionicons name="mail-outline" size={18} color={emailFocused ? GREEN : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa chỉ email..."
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>

              {/* Password field */}
              <View style={[styles.fieldLabel, { marginTop: 16 }]}>
                <Text style={styles.label}>Mật khẩu</Text>
              </View>
              <View style={[styles.inputBox, passFocused && styles.inputBoxFocused]}>
                <Ionicons name="lock-closed-outline" size={18} color={passFocused ? GREEN : '#9CA3AF'} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginBtnText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>hoặc</Text>
                <View style={styles.line} />
              </View>

              {/* Google Button (stub) */}
              <TouchableOpacity
                style={styles.googleBtn}
                activeOpacity={0.8}
                onPress={handleGoogleLogin}
              >
                <View style={styles.gIconBox}>
                  <Text style={styles.gIcon}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Tiếp tục với Google</Text>
              </TouchableOpacity>
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F8' },

  bgCircle1: {
    position: 'absolute', width: width * 1.2, height: width * 1.2,
    borderRadius: width * 0.6, backgroundColor: 'rgba(34, 197, 94, 0.07)',
    top: -width * 0.4, right: -width * 0.2,
  },
  bgCircle2: {
    position: 'absolute', width: width * 0.8, height: width * 0.8,
    borderRadius: width * 0.4, backgroundColor: 'rgba(34, 197, 94, 0.05)',
    bottom: -width * 0.2, left: -width * 0.3,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  // Logo area
  logoContainer: { alignItems: 'center', marginBottom: 28 },
  logoBg: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6, marginBottom: 14,
  },
  appName: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: '#6B7280', marginTop: 4, fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 20 },

  // Form
  fieldLabel: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151' },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 52,
  },
  inputBoxFocused: {
    borderColor: GREEN,
    backgroundColor: '#F0FDF4',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 4 },

  // Login button
  loginBtn: {
    width: '100%',
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#F3F4F6' },
  dividerText: { marginHorizontal: 14, color: '#9CA3AF', fontSize: 13, fontWeight: '500' },

  // Google button
  googleBtn: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  gIconBox: {
    width: 24, height: 24, backgroundColor: '#FFF', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  gIcon: { fontSize: 14, fontWeight: '900', color: '#DB4437' },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // Register row
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  registerLink: { fontSize: 14, fontWeight: '800', color: GREEN },
});
