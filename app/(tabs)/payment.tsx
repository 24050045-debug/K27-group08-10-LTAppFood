import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/constants';

// ─── Bank Link Modal ───────────────────────────────────────────────────────────
function BankLinkModal({ visible, onClose, onLink }: { visible: boolean; onClose: () => void; onLink: () => void }) {
  const BANKS = [
    { name: 'Vietcombank', color: '#007B40', emoji: '🏦' },
    { name: 'Techcombank', color: '#E31837', emoji: '🏛️' },
    { name: 'MB Bank',     color: '#005BAA', emoji: '🏢' },
    { name: 'BIDV',        color: '#005BAA', emoji: '💼' },
    { name: 'VPBank',      color: '#1B4F9C', emoji: '🏗️' },
    { name: 'Momo',        color: '#A50064', emoji: '💜' },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Liên kết tài khoản ngân hàng</Text>
        <Text style={styles.modalSub}>Chọn ngân hàng bạn muốn liên kết với FoodApp Pay</Text>
        <View style={styles.bankGrid}>
          {BANKS.map((bank) => (
            <TouchableOpacity
              key={bank.name}
              style={styles.bankItem}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  Alert.alert(
                    '🎉 Liên kết thành công!',
                    `Tài khoản ${bank.name} đã được liên kết với FoodApp Pay.`,
                    [{ text: 'Tuyệt vời!', onPress: onLink }]
                  );
                }, 300);
              }}
            >
              <View style={[styles.bankIcon, { backgroundColor: bank.color + '18' }]}>
                <Text style={{ fontSize: 26 }}>{bank.emoji}</Text>
              </View>
              <Text style={styles.bankName}>{bank.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Để sau</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Not Logged In Banner ──────────────────────────────────────────────────────
function NotLoggedInBanner({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <View style={styles.authBanner}>
      {/* Warning icon */}
      <View style={styles.authIconWrap}>
        <View style={styles.authIconCircle}>
          <Ionicons name="warning" size={36} color="#FF6B35" />
        </View>
        <View style={styles.authRing} />
      </View>

      <Text style={styles.authBannerTitle}>Bạn chưa đăng nhập</Text>
      <Text style={styles.authBannerSub}>
        Để sử dụng tính năng thanh toán, ví FoodApp Pay và theo dõi giao dịch, vui lòng đăng nhập hoặc tạo tài khoản mới.
      </Text>

      {/* Benefits list */}
      <View style={styles.benefitsList}>
        {[
          { icon: 'wallet-outline',           text: 'Quản lý ví FoodApp Pay dễ dàng' },
          { icon: 'card-outline',             text: 'Liên kết ngân hàng & thanh toán' },
          { icon: 'shield-checkmark-outline', text: 'Bảo mật giao dịch tuyệt đối' },
          { icon: 'gift-outline',             text: 'Nhận ưu đãi và hoàn tiền hấp dẫn' },
        ].map((b) => (
          <View key={b.text} style={styles.benefitItem}>
            <View style={styles.benefitDot}>
              <Ionicons name={b.icon as any} size={14} color="#22C55E" />
            </View>
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.loginBigBtn} onPress={onLogin} activeOpacity={0.88}>
        <Ionicons name="log-in-outline" size={20} color="#FFF" />
        <Text style={styles.loginBigBtnText}>Đăng nhập ngay</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerBigBtn} onPress={onRegister} activeOpacity={0.88}>
        <Ionicons name="person-add-outline" size={18} color="#22C55E" />
        <Text style={styles.registerBigBtnText}>Tạo tài khoản mới</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Bank Link Banner ──────────────────────────────────────────────────────────
function BankLinkBanner({ userName, onLink, alreadyLinked }: { userName: string; onLink: () => void; alreadyLinked: boolean }) {
  if (alreadyLinked) {
    return (
      <View style={styles.linkedBanner}>
        <View style={styles.linkedIconWrap}>
          <Ionicons name="checkmark-circle" size={32} color="#00B14F" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.linkedTitle}>Tài khoản đã liên kết 🎉</Text>
          <Text style={styles.linkedSub}>Ngân hàng của bạn đã được kết nối với FoodApp Pay thành công!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bankBanner}>
      <View style={styles.bankBannerTop}>
        <View style={styles.bankBannerIcon}>
          <Ionicons name="card" size={28} color="#22C55E" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bankBannerTitle}>Xin chào, {userName}! 👋</Text>
          <Text style={styles.bankBannerSub}>Bạn có muốn liên kết tài khoản ngân hàng không?</Text>
        </View>
      </View>

      <Text style={styles.bankBannerDesc}>
        Liên kết ngân hàng để nạp tiền tức thì, thanh toán nhanh chóng và nhận ưu đãi độc quyền từ FoodApp Pay.
      </Text>

      <View style={styles.bankBannerBenefits}>
        {['Nạp tiền tức thì không phí', 'Thanh toán 1 chạm', 'Ưu đãi hoàn tiền 10%'].map((t) => (
          <View key={t} style={styles.bankBenefitChip}>
            <Ionicons name="checkmark-circle" size={13} color="#22C55E" />
            <Text style={styles.bankBenefitChipText}>{t}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.linkBankBtn} onPress={onLink} activeOpacity={0.88}>
        <Ionicons name="link-outline" size={18} color="#FFF" />
        <Text style={styles.linkBankBtnText}>Liên kết ngân hàng ngay</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn}>
        <Text style={styles.skipBtnText}>Để sau</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Payment Screen ────────────────────────────────────────────────────────────
export default function PaymentScreen() {
  const router = useRouter();
  const { isLoggedIn, user, linkBank, logout } = useAuth();
  const [bankModalVisible, setBankModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất không?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#22C55E" />

      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Thanh toán</Text>
              <Text style={styles.headerSub}>Thanh toán hàng ngày đơn giản, linh hoạt</Text>
            </View>
            {isLoggedIn ? (
              <TouchableOpacity style={styles.settingBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.settingBtn}>
                <Ionicons name="settings-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Balance – chỉ hiện khi đã đăng nhập */}
          {isLoggedIn && (
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceEmoji}>💰</Text>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.balanceLabel}>Số dư FoodApp Pay</Text>
                  <Text style={styles.balanceAmount}>0 đ</Text>
                </View>
                <TouchableOpacity style={styles.topUpBtn}>
                  <Ionicons name="add" size={16} color="#22C55E" />
                  <Text style={styles.topUpText}>Nạp tiền</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Hint khi chưa đăng nhập */}
          {!isLoggedIn && (
            <View style={styles.headerLoginHint}>
              <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerLoginHintText}>Đăng nhập để xem số dư và giao dịch</Text>
            </View>
          )}
        </SafeAreaView>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {!isLoggedIn ? (
          <NotLoggedInBanner
            onLogin={() => router.push('/login')}
            onRegister={() => router.push('/register')}
          />
        ) : (
          <>
            <BankLinkBanner
              userName={user?.name ?? ''}
              onLink={() => setBankModalVisible(true)}
              alreadyLinked={user?.linkedBank ?? false}
            />

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              {[
                { icon: 'qr-code-outline',  label: 'Quét QR' },
                { icon: 'send-outline',     label: 'Chuyển tiền' },
                { icon: 'download-outline', label: 'Nhận tiền' },
                { icon: 'card-outline',     label: 'Liên kết' },
              ].map((action, i) => (
                <TouchableOpacity key={i} style={styles.quickAction} activeOpacity={0.8}>
                  <View style={styles.quickActionIcon}>
                    <Ionicons name={action.icon as any} size={22} color="#22C55E" />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Transactions – sẽ được điền từ /api/transactions khi có backend */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
                <TouchableOpacity style={styles.seeAllBtn}>
                  <Ionicons name="arrow-forward" size={18} color="#22C55E" />
                </TouchableOpacity>
              </View>
              {/* AI Agent: Khi có /api/transactions, fetch và render list ở đây */}
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📊</Text>
                <Text style={{ fontSize: 14, color: '#9E9E9E', textAlign: 'center' }}>Chưa có giao dịch nào</Text>
              </View>
            </View>

            {/* Promo */}
            <View style={styles.promoBanner}>
              <Text style={{ fontSize: 28 }}>🎁</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.promoTitle}>Ưu đãi thanh toán</Text>
                <Text style={styles.promoSub}>Hoàn tiền 10% khi thanh toán FoodApp Pay</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9E9E9E" />
            </View>
          </>
        )}
      </ScrollView>

      {/* Bank Link Modal */}
      <BankLinkModal
        visible={bankModalVisible}
        onClose={() => setBankModalVisible(false)}
        onLink={linkBank}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 18,
    paddingBottom: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 4 : 8,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  headerTitle: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4, lineHeight: 18 },
  settingBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: 14,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceEmoji: { fontSize: 28 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  balanceAmount: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 2 },
  topUpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  topUpText: { fontSize: 13, fontWeight: '700', color: '#22C55E' },
  headerLoginHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  headerLoginHintText: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

  body: { flex: 1 },

  // ── Not Logged In Banner ──
  authBanner: {
    margin: 14, marginTop: 20,
    backgroundColor: '#FFF',
    borderRadius: 20, padding: 22,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
    borderWidth: 1.5, borderColor: '#FFF0EB',
  },
  authIconWrap: { position: 'relative', marginBottom: 16 },
  authIconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF3EE',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FF6B3520',
  },
  authRing: {
    position: 'absolute', top: -6, left: -6, right: -6, bottom: -6,
    borderRadius: 46, borderWidth: 1.5, borderColor: '#FF6B3530',
  },
  authBannerTitle: { fontSize: 20, fontWeight: '800', color: '#212121', textAlign: 'center', marginBottom: 10 },
  authBannerSub: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 21, marginBottom: 20 },

  benefitsList: { alignSelf: 'stretch', marginBottom: 24, gap: 10 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitDot: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { fontSize: 14, color: '#424242', fontWeight: '500', flex: 1 },

  loginBigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22C55E', borderRadius: 14,
    paddingVertical: 15, alignSelf: 'stretch',
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    marginBottom: 10,
  },
  loginBigBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  registerBigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 14,
    paddingVertical: 14, alignSelf: 'stretch',
    borderWidth: 1.5, borderColor: '#22C55E30',
  },
  registerBigBtnText: { color: '#22C55E', fontSize: 15, fontWeight: '700' },

  // ── Bank Link Banner ──
  bankBanner: {
    margin: 14, marginTop: 16,
    backgroundColor: '#FFF', borderRadius: 20, padding: 18,
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 5,
    borderWidth: 1.5, borderColor: '#E8F5E9',
  },
  bankBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  bankBannerIcon: {
    width: 52, height: 52, borderRadius: 15,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  bankBannerTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginBottom: 2 },
  bankBannerSub: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  bankBannerDesc: { fontSize: 13, color: '#757575', lineHeight: 19, marginBottom: 14 },

  bankBannerBenefits: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  bankBenefitChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F0FDF4', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  bankBenefitChipText: { fontSize: 11, color: '#22C55E', fontWeight: '600' },

  linkBankBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22C55E', borderRadius: 13,
    paddingVertical: 14,
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    marginBottom: 8,
  },
  linkBankBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { color: '#9E9E9E', fontSize: 13, fontWeight: '500' },

  // ── Already Linked Banner ──
  linkedBanner: {
    margin: 14, marginTop: 16,
    backgroundColor: '#F0FFF6',
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#00B14F30',
  },
  linkedIconWrap: { padding: 4 },
  linkedTitle: { fontSize: 15, fontWeight: '800', color: '#00662F', marginBottom: 2 },
  linkedSub: { fontSize: 12, color: '#00B14F' },

  // ── Quick Actions ──
  quickActions: {
    flexDirection: 'row', backgroundColor: '#FFF',
    paddingVertical: 16, paddingHorizontal: 8,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickActionIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { fontSize: 11, color: '#424242', fontWeight: '600', textAlign: 'center' },

  section: {
    backgroundColor: '#FFF', marginHorizontal: 14,
    borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#212121' },
  seeAllBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
  },

  promoBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', marginHorizontal: 14,
    borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    marginBottom: 14,
  },
  promoTitle: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 3 },
  promoSub: { fontSize: 12, color: '#9E9E9E' },

  // ── Bank Modal ──
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 42 : 28, paddingTop: 14,
    elevation: 24,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#212121', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#9E9E9E', marginBottom: 22 },
  bankGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  bankItem: { width: '30%', alignItems: 'center', gap: 8 },
  bankIcon: {
    width: 58, height: 58, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  bankName: { fontSize: 11, fontWeight: '700', color: '#424242', textAlign: 'center' },
  cancelBtn: {
    backgroundColor: '#F5F5F5', borderRadius: 13,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: '#757575', fontSize: 14, fontWeight: '600' },
});
