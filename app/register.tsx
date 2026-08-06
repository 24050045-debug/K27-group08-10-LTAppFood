import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
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

interface FieldError {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastAnim = useRef(new Animated.Value(width)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setToastVisible(false));
      }, 3000);
    });
  };

  const validate = (): boolean => {
    const newErrors: FieldError = {};

    if (!name.trim()) {
      newErrors.name = 'Họ và tên không được để trống.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Địa chỉ email không hợp lệ.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc.';
    } else if (!/^(0|\+84)[0-9]{9}$/.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).';
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc.';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    setErrors(newErrors);

    const firstError = Object.values(newErrors)[0];
    if (firstError) {
      showToast(firstError);
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    const res = await register(name.trim(), email.trim(), phone.trim(), password);
    setLoading(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      showToast(res.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const inputBox = (focused: boolean, hasError: boolean) => [
    styles.inputBox,
    focused && styles.inputBoxFocused,
    hasError && styles.inputBoxError,
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F8" />

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { transform: [{ translateX: toastAnim }] },
          ]}
        >
          <Ionicons name="alert-circle" size={24} color="#FFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="#374151" />
              </TouchableOpacity>
              <View style={styles.logoMini}>
                <Ionicons name="fast-food" size={20} color="#FFF" />
              </View>
            </View>

            <Text style={styles.screenTitle}>Tạo tài khoản</Text>
            <Text style={styles.screenSub}>Điền thông tin bên dưới để đăng ký. Các trường có dấu <Text style={styles.requiredStar}>*</Text> là bắt buộc.</Text>

            {/* Form Card */}
            <View style={styles.card}>

              {/* Họ và tên */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Họ và tên <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={inputBox(focusedField === 'name', !!errors.name)}>
                  <Ionicons name="person-outline" size={17} color={focusedField === 'name' ? GREEN : '#9CA3AF'} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={(t) => {
                      const letterOnly = t.replace(/[^\p{L}\s]/gu, '');
                      setName(letterOnly);
                      setErrors((e) => ({ ...e, name: undefined }));
                    }}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Email (Gmail) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={inputBox(focusedField === 'email', !!errors.email)}>
                  <Ionicons name="mail-outline" size={17} color={focusedField === 'email' ? GREEN : '#9CA3AF'} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    maxLength={30}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : (
                  <Text style={styles.hintText}>Dùng địa chỉ Gmail để nhận thông báo đơn hàng.</Text>
                )}
              </View>

              {/* Số điện thoại */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Số điện thoại <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={inputBox(focusedField === 'phone', !!errors.phone)}>
                  <Ionicons name="call-outline" size={17} color={focusedField === 'phone' ? GREEN : '#9CA3AF'} style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0901 234 567"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={10}
                    value={phone}
                    onChangeText={(t) => {
                      const numericValue = t.replace(/[^0-9]/g, '');
                      setPhone(numericValue);
                      setErrors((e) => ({ ...e, phone: undefined }));
                    }}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Mật khẩu */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Mật khẩu <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={inputBox(focusedField === 'password', !!errors.password)}>
                  <Ionicons name="lock-closed-outline" size={17} color={focusedField === 'password' ? GREEN : '#9CA3AF'} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Ít nhất 6 ký tự"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Xác nhận mật khẩu */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Xác nhận mật khẩu <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={inputBox(focusedField === 'confirm', !!errors.confirmPassword)}>
                  <Ionicons name="shield-checkmark-outline" size={17} color={focusedField === 'confirm' ? GREEN : '#9CA3AF'} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: undefined })); }}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={17} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Tạo tài khoản</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                Bằng việc đăng ký, bạn đồng ý với{' '}
                <Text style={styles.termsBold}>Điều khoản dịch vụ</Text> và{' '}
                <Text style={styles.termsBold}>Chính sách bảo mật</Text> của FoodApp.
              </Text>
            </View>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
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
    position: 'absolute', width: width * 1.1, height: width * 1.1,
    borderRadius: width * 0.55, backgroundColor: 'rgba(34,197,94,0.06)',
    top: -width * 0.35, right: -width * 0.2,
  },
  bgCircle2: {
    position: 'absolute', width: width * 0.7, height: width * 0.7,
    borderRadius: width * 0.35, backgroundColor: 'rgba(34,197,94,0.05)',
    bottom: -width * 0.15, left: -width * 0.25,
  },

  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 20, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  logoMini: { width: 40, height: 40, borderRadius: 12, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },

  screenTitle: { fontSize: 26, fontWeight: '900', color: '#111827', letterSpacing: -0.5, marginBottom: 6 },
  screenSub: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 24 },
  requiredStar: { color: '#EF4444', fontWeight: '900' },

  card: {
    backgroundColor: '#FFF', borderRadius: 20,
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 8, marginBottom: 20,
  },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },

  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 12, height: 50,
  },
  inputBoxFocused: { borderColor: GREEN, backgroundColor: '#F0FDF4' },
  inputBoxError: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#111827' },
  eyeBtn: { padding: 4 },

  errorText: { fontSize: 12, color: '#EF4444', fontWeight: '600', marginTop: 5 },
  hintText: { fontSize: 12, color: '#9CA3AF', marginTop: 5 },

  submitBtn: {
    backgroundColor: GREEN, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF', letterSpacing: 0.3 },

  termsText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, marginTop: 16 },
  termsBold: { color: '#6B7280', fontWeight: '600' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  loginLink: { fontSize: 14, fontWeight: '800', color: GREEN },

  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    right: 20,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
    maxWidth: width * 0.8,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flexShrink: 1,
  },
});
