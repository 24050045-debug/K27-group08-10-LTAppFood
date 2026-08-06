import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from '../constants';

const { width: W, height: H } = Dimensions.get('window');
const GREEN      = '#22C55E';
const GREEN_DARK = '#16A34A';
const GREEN_HERO = '#1A9E48';

// ─── Dữ liệu tĩnh ───────────────────────────────────────────────────────────
const RECENT_PLACES = [
  { id: 1, name: 'KHOAI 1 NẮNG - khoai mật nướng', addr: '103 Nguyễn Tri Phương, P.8, Q.10' },
  { id: 2, name: '167/16 Nguyễn Thị Minh Khai', addr: 'Phường Đa Kao, Quận 1, TP.HCM' },
  { id: 3, name: '598/19 Đại Lộ Bình Dương', addr: 'Thành phố Thủ Dầu Một, Bình Dương' },
];

const TRANSPORT_SERVICES = [
  { id: 1, label: 'Car Xe Điện',       emoji: '🛵',  bg: '#E8F5E9', isNew: true },
  { id: 2, label: 'Đặt xe cho Gia Đình', emoji: '👨‍👩‍👧', bg: '#FFFDE7', isNew: false },
  { id: 3, label: 'Đặt trước chuyến xe', emoji: '📅', bg: '#E8F5E9', isNew: false },
  { id: 4, label: 'Xe gọn gàng, xẻ top', emoji: '🚗', bg: '#FFFDE7', isNew: true },
  { id: 5, label: 'Đón xe ở sân bay',   emoji: '✈️',  bg: '#E8F5E9', isNew: false },
  { id: 6, label: 'Thuê xe cùng tài xế', emoji: '🧑‍✈️', bg: '#FFFDE7', isNew: false },
];

const DELIVERY_PROMOS = [
  { id: 1, label: 'Hội Chủ Shop',    sub: 'Giảm 20%* giá cước đơn Ưu Tiên', emoji: '🏪', bg: '#E8F5E9' },
  { id: 2, label: 'Đi đơn có quà',  sub: 'Đi đơn càng nhiều, trợ giá càng hời', emoji: '🎁', bg: '#F1F8E9' },
  { id: 3, label: 'Đổi mã ưu đãi',  sub: 'Đổi GrabXu sang mã ưu đãi GE', emoji: '🌀', bg: '#FFF9C4' },
  { id: 4, label: 'Xe Tải Van',     sub: 'Giảm lên đến 50%*', emoji: '🚚', bg: '#E3F2FD' },
];

const SAVED_PLACES = [
  { id: 1, label: 'International...', icon: 'location' },
  { id: 2, label: 'Domestic Termi...', icon: 'location' },
];

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  service: { key: string; label: string; emoji: string } | null;
  onClose: () => void;
  userId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSPORT SCREEN (Ô tô / Xe máy)
// ═══════════════════════════════════════════════════════════════════════════════
function TransportScreen({
  service,
  onClose,
  userId,
}: {
  service: NonNullable<Props['service']>;
  onClose: () => void;
  userId?: number;
}) {
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);

  const heroEmoji = service.key === 'car' ? '🚗' : '🏍️';
  const heroTitle = service.key === 'car' ? 'Car Service' : 'Bike Service';
  const heroSub   = 'Wherever you go, let\'s get you there!';
  const price     = service.key === 'car' ? 60_000 : 20_000;

  const handleBook = async () => {
    if (!destination.trim()) {
      Alert.alert('⚠️ Thiếu thông tin', 'Nhập điểm đến nhé!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId ?? 1,
          service_type: service.key,
          pickup_address: 'Vị trí hiện tại',
          dropoff_address: destination.trim(),
          price,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('✅ Đặt xe thành công!', `Mã đơn: #${data.bookingId}\nĐang tìm tài xế cho bạn...`, [
          { text: 'OK', onPress: onClose },
        ]);
      } else {
        Alert.alert('❌ Lỗi', data.error);
      }
    } catch {
      Alert.alert('🔌 Lỗi mạng', 'Không kết nối được server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={ts.root}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />

      {/* ── HEADER ── */}
      <View style={ts.header}>
        <View style={{ height: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44 }} />
        <View style={ts.headerRow}>
          <TouchableOpacity style={ts.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={ts.mapBtn}>
            <Ionicons name="map-outline" size={16} color={GREEN_DARK} />
            <Text style={ts.mapBtnText}>Bản đồ</Text>
          </TouchableOpacity>
        </View>

        {/* Destination search bar */}
        <View style={ts.searchRow}>
          <View style={ts.searchBar}>
            <Ionicons name="location-sharp" size={18} color="#F97316" style={{ marginRight: 8 }} />
            <TextInput
              style={ts.searchInput}
              placeholder="Bạn muốn đến đ..."
              placeholderTextColor="#9CA3AF"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
          <TouchableOpacity style={ts.preBookBtn}>
            <Ionicons name="calendar-outline" size={14} color="#FFF" />
            <Text style={ts.preBookText}>Đặt trước</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* ── HERO BANNER ── */}
        <View style={ts.hero}>
          <View style={ts.heroLeft}>
            <Text style={ts.heroTitle}>{heroTitle}</Text>
            <Text style={ts.heroSub}>{heroSub}</Text>
            <TouchableOpacity style={ts.heroArrow}>
              <Ionicons name="arrow-forward" size={18} color={GREEN_DARK} />
            </TouchableOpacity>
          </View>
          <Text style={ts.heroEmoji}>{heroEmoji}</Text>
        </View>

        {/* ── RECENT PLACES ── */}
        <View style={ts.section}>
          {RECENT_PLACES.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={ts.placeRow}
              onPress={() => setDestination(p.addr)}
            >
              <View style={ts.heartIcon}>
                <Ionicons name="heart" size={16} color={GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ts.placeName} numberOfLines={1}>{p.name}</Text>
                <Text style={ts.placeAddr} numberOfLines={1}>{p.addr}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CALENDAR PROMPT ── */}
        <View style={ts.calendarCard}>
          <View style={{ flex: 1 }}>
            <Text style={ts.calendarTitle}>Sợ trễ chuyến bay? Đã có chúng tôi nhắc bạn.</Text>
            <TouchableOpacity style={ts.calendarBtn}>
              <Text style={ts.calendarBtnText}>Đồng bộ hoá với lịch</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 40, marginLeft: 12 }}>📅</Text>
        </View>

        {/* ── SERVICE GRID ── */}
        <Text style={ts.gridTitle}>Đa dạng lựa chọn di chuyển cho bạn</Text>
        <View style={ts.grid}>
          {TRANSPORT_SERVICES.map((svc) => (
            <TouchableOpacity key={svc.id} style={[ts.gridCard, { backgroundColor: svc.bg }]} activeOpacity={0.8}>
              <View style={ts.gridCardInner}>
                <View>
                  <Text style={ts.gridLabel}>{svc.label}</Text>
                  {svc.isNew && (
                    <View style={ts.newBadge}><Text style={ts.newBadgeText}>MỚI</Text></View>
                  )}
                </View>
                <Text style={{ fontSize: 28 }}>{svc.emoji}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── BOOK BUTTON ── */}
        <TouchableOpacity
          style={[ts.bookBtn, loading && { opacity: 0.7 }]}
          onPress={handleBook}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={ts.bookBtnText}>
            {loading ? '⏳ Đang xử lý...' : `🚀 Đặt ${service.label} — ${price.toLocaleString('vi-VN')}đ`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELIVERY SCREEN (Giao hàng)
// ═══════════════════════════════════════════════════════════════════════════════
function DeliveryScreen({
  onClose,
  userId,
}: {
  onClose: () => void;
  userId?: number;
}) {
  const [pickup, setPickup]   = useState('');
  const [dropoff, setDropoff] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert('⚠️ Thiếu thông tin', 'Nhập điểm gửi và điểm giao nhé!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId ?? 1,
          service_type: 'delivery',
          pickup_address: pickup.trim(),
          dropoff_address: dropoff.trim(),
          price: 25_000,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('✅ Đặt giao hàng thành công!', `Mã đơn: #${data.bookingId}\nĐang tìm shipper...`, [
          { text: 'OK', onPress: onClose },
        ]);
      } else {
        Alert.alert('❌ Lỗi', data.error);
      }
    } catch {
      Alert.alert('🔌 Lỗi mạng', 'Không kết nối được server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={ds.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

      {/* ── HEADER ── */}
      <View style={ds.header}>
        <View style={{ height: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44 }} />
        <View style={ds.headerRow}>
          <TouchableOpacity style={ds.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color="#212121" />
          </TouchableOpacity>
          <TouchableOpacity style={ds.listBtn}>
            <Ionicons name="list-outline" size={22} color="#212121" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* ── HERO BANNER ── */}
        <View style={ds.hero}>
          <View style={{ flex: 1 }}>
            <Text style={ds.heroTitle}>Cần ship hàng gấp?</Text>
            <Text style={ds.heroSub}>Đặt Express cứu nguy ải cuối ngay!</Text>
          </View>
          <Text style={{ fontSize: 52 }}>📦</Text>
        </View>

        {/* ── PICKUP / DROPOFF ── */}
        <View style={ds.inputCard}>
          <View style={ds.inputRow}>
            <View style={[ds.dot, { backgroundColor: '#3B82F6' }]} />
            <TextInput
              style={ds.addrInput}
              placeholder="Điểm gửi hàng..."
              placeholderTextColor="#9CA3AF"
              value={pickup}
              onChangeText={setPickup}
            />
            <TouchableOpacity style={ds.swapBtn} onPress={() => { const t = pickup; setPickup(dropoff); setDropoff(t); }}>
              <Ionicons name="swap-vertical" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={ds.inputDivider} />
          <View style={ds.inputRow}>
            <View style={[ds.dot, { backgroundColor: '#EF4444' }]} />
            <TextInput
              style={ds.addrInput}
              placeholder="Giao đến đâu?"
              placeholderTextColor="#9CA3AF"
              value={dropoff}
              onChangeText={setDropoff}
            />
          </View>
        </View>

        {/* ── SAVED PLACES ── */}
        <View style={ds.savedRow}>
          {SAVED_PLACES.map((p) => (
            <TouchableOpacity key={p.id} style={ds.savedChip}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={ds.savedLabel} numberOfLines={1}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PROMOS ── */}
        <Text style={ds.sectionTitle}>Bạn có thể thích</Text>
        <View style={ds.promoGrid}>
          {DELIVERY_PROMOS.map((p) => (
            <TouchableOpacity key={p.id} style={[ds.promoCard, { backgroundColor: p.bg }]} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={ds.promoLabel}>{p.label}</Text>
                <Text style={ds.promoSub} numberOfLines={2}>{p.sub}</Text>
              </View>
              <Text style={{ fontSize: 28, marginTop: 6 }}>{p.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── EXPLORE MORE ── */}
        <Text style={ds.sectionTitle}>Khám phá thêm</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {[
            { label: 'Express Mua hộ', sub: 'Ở nhà, cần gì cứ để chúng tôi mua hộ', emoji: '🛍️', bg: '#E8F5E9' },
            { label: 'Giao nhanh 1h',  sub: 'Giao trong vòng 1 giờ khu vực nội thành', emoji: '⚡', bg: '#FFF3E0' },
            { label: 'Giao liên tỉnh', sub: 'Giao hàng đến 63 tỉnh thành trên cả nước', emoji: '🗺️', bg: '#E3F2FD' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[ds.exploreCard, { backgroundColor: item.bg }]} activeOpacity={0.8}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>{item.emoji}</Text>
              <Text style={ds.exploreLabel}>{item.label}</Text>
              <Text style={ds.exploreSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── BOOK BUTTON ── */}
        <TouchableOpacity
          style={[ds.bookBtn, loading && { opacity: 0.7 }]}
          onPress={handleBook}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={ds.bookBtnText}>
            {loading ? '⏳ Đang xử lý...' : '🚚 Đặt giao hàng — 25.000đ'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT – wraps cả hai màn hình trong 1 Modal
// ═══════════════════════════════════════════════════════════════════════════════
export default function BookingFullScreen({ visible, service, onClose, userId }: Props) {
  const slideAnim = useRef(new Animated.Value(H)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      slideAnim.setValue(H);
    }
  }, [visible]);

  if (!service) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY: slideAnim }] }]}>
        {service.key === 'delivery' ? (
          <DeliveryScreen onClose={onClose} userId={userId} />
        ) : (
          <TransportScreen service={service} onClose={onClose} userId={userId} />
        )}
      </Animated.View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES – Transport
// ═══════════════════════════════════════════════════════════════════════════════
const ts = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  header: { backgroundColor: GREEN_DARK, paddingHorizontal: 14, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  mapBtnText: { fontSize: 13, fontWeight: '700', color: GREEN_DARK },

  searchRow: { flexDirection: 'row', gap: 10 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, fontSize: 14, color: '#212121' },
  preBookBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#22C55E', borderRadius: 12, paddingHorizontal: 12, height: 46 },
  preBookText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Hero
  hero: { margin: 14, backgroundColor: '#FFF', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  heroLeft: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#212121', marginBottom: 6 },
  heroSub: { fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 18 },
  heroArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 64, marginLeft: 8 },

  // Places
  section: { backgroundColor: '#FFF', marginHorizontal: 14, borderRadius: 16, paddingVertical: 6, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  placeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  heartIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  placeName: { fontSize: 14, fontWeight: '700', color: '#212121', marginBottom: 2 },
  placeAddr: { fontSize: 12, color: '#9CA3AF' },

  // Calendar card
  calendarCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 14, backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, marginBottom: 20 },
  calendarTitle: { fontSize: 14, fontWeight: '700', color: '#1E3A5F', marginBottom: 10, lineHeight: 20 },
  calendarBtn: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#BFDBFE' },
  calendarBtnText: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },

  // Grid
  gridTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginHorizontal: 14, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 20 },
  gridCard: { width: (W - 40) / 2, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  gridCardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  gridLabel: { fontSize: 13, fontWeight: '800', color: '#212121', marginBottom: 4, width: '70%' },
  newBadge: { backgroundColor: '#22C55E', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  newBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  // Book button
  bookBtn: { backgroundColor: GREEN_DARK, marginHorizontal: 14, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES – Delivery
// ═══════════════════════════════════════════════════════════════════════════════
const ds = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0FDF4' },

  // Header
  header: { backgroundColor: '#F0FDF4', paddingHorizontal: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  listBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },

  // Hero
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 14, marginBottom: 16, backgroundColor: '#DCFCE7', borderRadius: 18, padding: 18 },
  heroTitle: { fontSize: 18, fontWeight: '900', color: '#166534', marginBottom: 6 },
  heroSub: { fontSize: 13, color: '#166534', lineHeight: 18 },

  // Input card
  inputCard: { backgroundColor: '#FFF', marginHorizontal: 14, borderRadius: 16, paddingVertical: 6, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  addrInput: { flex: 1, fontSize: 15, color: '#212121' },
  swapBtn: { padding: 6 },
  inputDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 44 },

  // Saved places
  savedRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginBottom: 24 },
  savedChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  savedLabel: { fontSize: 12, fontWeight: '600', color: '#374151', flex: 1 },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#212121', marginHorizontal: 16, marginBottom: 12 },

  // Promo grid
  promoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 10, marginBottom: 24 },
  promoCard: { width: (W - 40) / 2, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  promoLabel: { fontSize: 14, fontWeight: '800', color: '#212121', marginBottom: 4 },
  promoSub: { fontSize: 11, color: '#6B7280', lineHeight: 16 },

  // Explore more
  exploreCard: { width: W * 0.55, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginBottom: 24 },
  exploreLabel: { fontSize: 14, fontWeight: '800', color: '#212121', marginBottom: 4 },
  exploreSub: { fontSize: 12, color: '#6B7280', lineHeight: 17 },

  // Book button
  bookBtn: { backgroundColor: GREEN_DARK, marginHorizontal: 14, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6, marginTop: 8 },
  bookBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
