import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../src/constants';
import { COLORS } from '../../src/constants/theme';

const GREEN = COLORS.primary;

type OrderInfo = {
  id: number;
  order_id: number;
  total_price: string;
  status: string;
  created_at: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
};

type OrderDetail = {
  detail_id: number;
  food_name: string;
  quantity: number;
  price: string;
  note: string;
};

const STATUS_STEPS = [
  { key: 'pending', label: 'Chờ xác nhận', icon: 'time' },
  { key: 'accepted', label: 'Đã xác nhận', icon: 'checkmark-circle' },
  { key: 'preparing', label: 'Đang chuẩn bị', icon: 'restaurant' },
  { key: 'ready', label: 'Đang giao hàng', icon: 'bicycle' },
  { key: 'completed', label: 'Hoàn thành', icon: 'home' },
];

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [details, setDetails] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchOrderData = async () => {
    try {
      const [infoRes, detailsRes] = await Promise.all([
        fetch(`${API_URL}/api/orders/info/${id}?t=${Date.now()}`).catch(() => null),
        fetch(`${API_URL}/api/orders/${id}/details?t=${Date.now()}`).catch(() => null),
      ]);

      if (infoRes) {
        const infoData = await infoRes.json();
        if (infoData.success) setOrder(infoData.data);
      }
      if (detailsRes) {
        const detailsData = await detailsRes.json();
        if (detailsData.success) setDetails(detailsData.data);
      }
    } catch (e) {
      console.log('Tracking order error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
    // Poll every 3 seconds to update status
    const interval = setInterval(fetchOrderData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ marginTop: 12, color: '#757575' }}>Đang tải thông tin đơn hàng...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>😢</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 6 }}>Không tìm thấy đơn hàng</Text>
        <Text style={{ fontSize: 14, color: '#757575', textAlign: 'center', marginBottom: 24 }}>
          Đơn hàng này có thể đã bị xóa hoặc không tồn tại.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate progress index
  let currentStepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
  if (order.status === 'cancelled') currentStepIdx = -1;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng #{order.order_id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Status Hero Area */}
        <View style={styles.heroArea}>
          {order.status === 'cancelled' ? (
            <View style={styles.heroCircleCanceled}>
              <Ionicons name="close" size={48} color="#FFF" />
            </View>
          ) : (
            <Animated.View style={[styles.heroCircle, { transform: [{ scale: currentStepIdx < 4 ? pulseAnim : 1 }] }]}>
              <Ionicons 
                name={currentStepIdx >= 0 ? STATUS_STEPS[currentStepIdx].icon as any : 'receipt'} 
                size={48} 
                color="#FFF" 
              />
            </Animated.View>
          )}
          
          <Text style={styles.heroTitle}>
            {order.status === 'cancelled' ? 'Đơn hàng đã huỷ' : 
             currentStepIdx >= 0 ? STATUS_STEPS[currentStepIdx].label : 'Đang xử lý...'}
          </Text>
          <Text style={styles.heroSub}>
            {order.status === 'cancelled' ? 'Rất tiếc, đơn hàng của bạn không thể thực hiện.' : 
             order.status === 'ready' ? 'Shipper đang trên đường giao đồ ăn đến bạn!' :
             order.status === 'completed' ? 'Chúc bạn ngon miệng!' :
             'Vui lòng chờ trong giây lát'}
          </Text>
        </View>

        {/* Stepper (Only show if not cancelled) */}
        {order.status !== 'cancelled' && (
          <View style={styles.stepperCard}>
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isFuture = idx > currentStepIdx;

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIndicator}>
                    <View style={[
                      styles.stepDot, 
                      isPast && styles.stepDotPast,
                      isCurrent && styles.stepDotCurrent,
                      isFuture && styles.stepDotFuture
                    ]}>
                      {isPast ? (
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      ) : (
                        <View style={isCurrent ? styles.stepInnerCurrent : null} />
                      )}
                    </View>
                    {idx < STATUS_STEPS.length - 1 && (
                      <View style={[styles.stepLine, (isPast || isCurrent) && styles.stepLineActive]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[
                      styles.stepLabel,
                      (isPast || isCurrent) && styles.stepLabelActive,
                      isCurrent && { color: GREEN, fontWeight: '700' }
                    ]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.stepTimeLabel}>
                        {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Restaurant Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="storefront" size={20} color={GREEN} />
            <Text style={styles.infoTitle}>Thông tin nhà hàng</Text>
          </View>
          <Text style={styles.restName}>{order.restaurant_name}</Text>
          <Text style={styles.restDetail}>📍 {order.restaurant_address || 'Địa chỉ đang cập nhật'}</Text>
          <Text style={styles.restDetail}>📞 {order.restaurant_phone || 'Liên hệ quán'}</Text>
        </View>

        {/* Order Details */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="receipt" size={20} color={GREEN} />
            <Text style={styles.infoTitle}>Chi tiết đơn hàng</Text>
          </View>
          
          <View style={styles.itemsList}>
            {details.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQtyText}>{item.quantity}x</Text>
                </View>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.itemName}>{item.food_name}</Text>
                  {item.note ? <Text style={styles.itemNote}>Ghi chú: {item.note}</Text> : null}
                </View>
                <Text style={styles.itemPrice}>{(Number(item.price) * item.quantity).toLocaleString('vi-VN')}đ</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalPrice}>{Number(order.total_price).toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },
  
  heroArea: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFF', borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  heroCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, marginBottom: 16 },
  heroCircleCanceled: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E53935', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 4 },
  heroSub: { fontSize: 14, color: '#757575', paddingHorizontal: 32, textAlign: 'center', lineHeight: 20 },

  stepperCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  stepRow: { flexDirection: 'row', alignItems: 'stretch' },
  stepIndicator: { width: 32, alignItems: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  stepDotPast: { backgroundColor: GREEN },
  stepDotCurrent: { backgroundColor: '#FFF', borderWidth: 2, borderColor: GREEN },
  stepDotFuture: { backgroundColor: '#EEEEEE' },
  stepInnerCurrent: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  stepLine: { width: 2, flex: 1, backgroundColor: '#EEEEEE', marginVertical: -4, zIndex: 1 },
  stepLineActive: { backgroundColor: GREEN },
  stepContent: { flex: 1, paddingBottom: 24, paddingLeft: 12, justifyContent: 'flex-start', paddingTop: 2 },
  stepLabel: { fontSize: 15, fontWeight: '600', color: '#9E9E9E' },
  stepLabelActive: { color: '#212121' },
  stepTimeLabel: { fontSize: 12, color: GREEN, marginTop: 2, fontWeight: '600' },

  infoCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#212121' },
  restName: { fontSize: 16, fontWeight: '700', color: '#424242', marginBottom: 4 },
  restDetail: { fontSize: 14, color: '#757575', marginBottom: 2 },
  
  itemsList: { marginBottom: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  itemQtyBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemQtyText: { fontSize: 13, fontWeight: '700', color: GREEN },
  itemName: { fontSize: 15, fontWeight: '500', color: '#212121', marginBottom: 2 },
  itemNote: { fontSize: 13, color: '#9E9E9E', fontStyle: 'italic' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#212121' },
  
  divider: { height: 1, backgroundColor: '#EEEEEE', marginBottom: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#757575' },
  totalPrice: { fontSize: 22, fontWeight: '800', color: GREEN },

  backBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#EEEEEE', borderRadius: 12 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#424242' }
});
