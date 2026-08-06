import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { API_URL } from '../../src/constants';
import * as Location from 'expo-location';
import BookingFullScreen from '../../src/components/BookingFullScreen';

const SERVICES = [
  { key: 'food',     emoji: '🍔', label: 'Đồ ăn',     bg: '#FFF3E0', tab: 1 },
  { key: 'car',      emoji: '🚗', label: 'Ô tô',       bg: '#E8F5E9', tab: null },
  { key: 'bike',     emoji: '🏍️', label: 'Xe máy',     bg: '#E8F5E9', tab: null },
  { key: 'delivery', emoji: '📦', label: 'Giao hàng',  bg: '#FFF8E1', tab: null },
  { key: 'more',     emoji: '⋯',  label: 'Thêm',       bg: '#F5F5F5', tab: null },
];

const BANNERS = [
  { id: 1, bg: '#E53935', text: '🍜 Mua 1 tặng 1 Bún & Coke', sub: 'FoodApp × Coca-Cola' },
  { id: 2, bg: '#1565C0', text: '🎁 Freeship đơn đầu',          sub: 'Dành cho khách mới' },
  { id: 3, bg: '#2E7D32', text: '⚡ Giao trong 20 phút',         sub: 'Khu vực nội thành' },
];

import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: W } = Dimensions.get('window');
const GREEN = '#22C55E';
const HEADER_GREEN = '#16A34A';


// ─── Home Screen ──────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();
  const [activeService, setActiveService] = useState<typeof SERVICES[0] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [currentAddress, setCurrentAddress] = useState('Đang định vị...');

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCurrentAddress('TP. Hồ Chí Minh');
          return;
        }

        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          // Try to build a good looking address, e.g., "Street Name, District"
          const parts = [place.street, place.subregion || place.city || place.region].filter(Boolean);
          setCurrentAddress(parts.length > 0 ? parts.join(', ') : 'Vị trí hiện tại');
        } else {
          setCurrentAddress('TP. Hồ Chí Minh');
        }
      } catch (e) {
        console.log('Location error:', e);
        setCurrentAddress('TP. Hồ Chí Minh');
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchActiveOrder = async () => {
        try {
          const res = await fetch(`${API_URL}/api/orders/history/${user?.id || 1}?t=${Date.now()}`);
          const data = await res.json();
          if (data.success && data.data.length > 0) {
            const active = data.data.find((o: any) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
            setActiveOrder(active || null);
          } else {
            setActiveOrder(null);
          }
        } catch (e) {
          console.log('Error fetching active order:', e);
        }
      };
      if (isLoggedIn) {
        fetchActiveOrder();
      }
    }, [isLoggedIn, user])
  );

  const onServicePress = (svc: typeof SERVICES[0]) => {
    if (svc.key === 'food') { router.push('/(tabs)/explore'); return; }
    if (svc.key === 'more') { Alert.alert('Sắp có', 'Dịch vụ khác đang phát triển!'); return; }
    setActiveService(svc); setSheetOpen(true);
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER_GREEN} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight : 44 }} />
        <View style={s.headerRow}>
          <TouchableOpacity style={s.menuBtn}><Ionicons name="menu-outline" size={24} color="#FFF" /></TouchableOpacity>
          <TouchableOpacity style={s.searchPill} activeOpacity={0.85}>
            <Ionicons name="search-outline" size={17} color="#9E9E9E" />
            <Text style={s.searchText}>Tìm địa điểm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.avatarG}><Text style={s.avatarGText}>G</Text></TouchableOpacity>
          <TouchableOpacity
            style={s.avatarU}
            onPress={() => isLoggedIn ? Alert.alert('Xin chào, ' + user?.name, 'Bạn muốn làm gì?', [{ text: 'Đăng xuất', style: 'destructive', onPress: logout }, { text: 'Đóng', style: 'cancel' }]) : router.push('/login')}
          >
            {isLoggedIn && user?.name
              ? <Text style={{ fontWeight: '900', fontSize: 15, color: '#424242' }}>{user.name[0].toUpperCase()}</Text>
              : <Ionicons name="person-outline" size={17} color="#424242" />
            }
          </TouchableOpacity>
        </View>
        <View style={s.locationRow}>
          <Ionicons name="location-sharp" size={13} color="#FFD700" />
          <Text style={s.locationTxt} numberOfLines={1}>{currentAddress}</Text>
          <Ionicons name="chevron-down-outline" size={13} color="rgba(255,255,255,0.7)" />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* ── ACTIVE ORDER BANNER ── */}
        {activeOrder && (
          <TouchableOpacity 
            style={s.activeOrderCard} 
            activeOpacity={0.85}
            onPress={() => router.push(`/order/${activeOrder.id}`)}
          >
            <View style={s.activeOrderIconBox}>
              <Ionicons name="bicycle" size={24} color={GREEN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.activeOrderTitle}>Đơn hàng đang thực hiện</Text>
              <Text style={s.activeOrderSub}>
                {activeOrder.restaurant_name} · {
                  activeOrder.status === 'pending' ? 'Chờ xác nhận' :
                  activeOrder.status === 'accepted' ? 'Đã xác nhận' :
                  activeOrder.status === 'preparing' ? 'Quán đang làm' :
                  'Đang giao đến bạn'
                }
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
          </TouchableOpacity>
        )}

        {/* ── SERVICE ICONS ── */}
        <View style={s.servicesCard}>
          <View style={s.servicesRow}>
            {SERVICES.map((svc) => (
              <TouchableOpacity key={svc.key} style={s.svcItem} onPress={() => onServicePress(svc)} activeOpacity={0.75}>
                <View style={[s.svcBox, { backgroundColor: svc.bg }]}>
                  <Text style={s.svcEmoji}>{svc.emoji}</Text>
                </View>
                <Text style={s.svcLabel}>{svc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── PROMO BANNERS ── */}
        <View style={s.promoHead}>
          <Text style={s.promoTitle}>Ưu đãi hôm nay</Text>
          <Ionicons name="chevron-forward-circle-outline" size={22} color={GREEN} />
        </View>
        {/* Banner lớn full-width */}
        <TouchableOpacity style={[s.bannerFull, { backgroundColor: BANNERS[0].bg }]} activeOpacity={0.85}>
          <View style={s.bannerFullInner}>
            <Text style={s.bannerText}>{BANNERS[0].text}</Text>
            <Text style={s.bannerSub}>{BANNERS[0].sub}</Text>
          </View>
          <Text style={s.bannerEmoji}>🎉</Text>
        </TouchableOpacity>
        {/* 2 banner nhỏ hàng ngang */}
        <View style={s.bannerRow2}>
          {BANNERS.slice(1).map((b) => (
            <TouchableOpacity key={b.id} style={[s.bannerHalf, { backgroundColor: b.bg }]} activeOpacity={0.85}>
              <Text style={s.bannerText}>{b.text}</Text>
              <Text style={s.bannerSub}>{b.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── RESTAURANT PREVIEW (FoodApp mini) ── */}
        <View style={s.promoHead}>
          <Text style={s.promoTitle}>🍔 Đặt đồ ăn ngay</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
            <Text style={[s.seeAll, { color: GREEN }]}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.exploreBtn} onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.85}>
          <Ionicons name="fast-food-outline" size={22} color={GREEN} />
          <Text style={s.exploreBtnText}>Khám phá nhà hàng & món ăn</Text>
          <Ionicons name="chevron-forward" size={18} color={GREEN} />
        </TouchableOpacity>
      </ScrollView>

      <BookingFullScreen
        visible={sheetOpen}
        service={activeService}
        onClose={() => { setSheetOpen(false); setActiveService(null); }}
        userId={user?.id}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  header: { backgroundColor: HEADER_GREEN, paddingHorizontal: 14, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  menuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  searchPill: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 9, gap: 7 },
  searchText: { color: '#BDBDBD', fontSize: 14 },
  avatarG: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFD600', alignItems: 'center', justifyContent: 'center' },
  avatarGText: { fontWeight: '900', fontSize: 16, color: HEADER_GREEN },
  avatarU: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },

  // Services
  activeOrderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#E8F5E9' },
  activeOrderIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  activeOrderTitle: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 2 },
  activeOrderSub: { fontSize: 13, color: GREEN, fontWeight: '600' },

  servicesCard: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 12, borderRadius: 16, paddingVertical: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  servicesRow: { flexDirection: 'row', justifyContent: 'space-around' },
  svcItem: { alignItems: 'center', width: (W - 56) / 5 },
  svcBox: { width: 54, height: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  svcEmoji: { fontSize: 27 },
  svcLabel: { fontSize: 11, fontWeight: '600', color: '#424242', textAlign: 'center' },

  // Promos
  promoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 11 },
  promoTitle: { fontSize: 16, fontWeight: '800', color: '#212121' },
  seeAll: { fontSize: 13, fontWeight: '700' },

  // Banner lớn full-width
  bannerFull: {
    marginHorizontal: 12, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  bannerFullInner: { flex: 1 },
  bannerEmoji: { fontSize: 40, marginLeft: 12 },

  // 2 banner nhỏ hàng ngang
  bannerRow2: { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginBottom: 4 },
  bannerHalf: {
    flex: 1, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },

  bannerText: { color: '#FFF', fontSize: 13, fontWeight: '800', marginBottom: 4 },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },

  // Explore button
  exploreBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', marginHorizontal: 12, marginBottom: 10, borderRadius: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#E8F5E9' },
  exploreBtnText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#212121' },
});