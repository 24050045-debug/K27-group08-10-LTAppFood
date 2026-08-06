import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { API_URL, SERVER_IP } from '../constants';
import { useAuth } from '../context/AuthContext';

const GREEN = COLORS.primary;
const { width: W, height: H } = Dimensions.get('window');

type OrderItem = {
  food_id: number;
  food_name: string;
  quantity: number;
  price: number;
};

type PaymentMethod = 'foodapp_pay' | 'cash' | 'bank';

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string; desc: string; color: string }[] = [
  { key: 'foodapp_pay', label: 'FoodApp Pay', icon: 'wallet', desc: 'Thanh toán bằng ví FoodApp', color: '#22C55E' },
  { key: 'cash', label: 'Tiền mặt', icon: 'cash', desc: 'Trả tiền khi nhận hàng', color: '#F9A825' },
  { key: 'bank', label: 'Chuyển khoản', icon: 'card', desc: 'Chuyển khoản ngân hàng', color: '#3B82F6' },
];

export default function CheckoutSheet({
  visible,
  items,
  totalPrice,
  restaurantId,
  restaurantName,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  items: OrderItem[];
  totalPrice: number;
  restaurantId: number;
  restaurantName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const slide = useRef(new Animated.Value(H)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setOrderSuccess(false);
      setOrderId(null);
      setNote('');
      successScale.setValue(0);
      successOpacity.setValue(0);
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      slide.setValue(H);
    }
  }, [visible]);

  const deliveryFee = 15000;
  const discount = 0;
  const grandTotal = totalPrice + deliveryFee - discount;

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/food-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: user?.id || 1,
          restaurant_id: restaurantId,
          items: items,
          total_price: grandTotal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderId(data.orderId);
        setOrderSuccess(true);
        // Animate success
        Animated.parallel([
          Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
          Animated.timing(successOpacity, { toValue: 1, useNativeDriver: true, duration: 300 }),
        ]).start();
      } else {
        Alert.alert('❌ Lỗi', data.error || 'Không thể đặt đơn');
      }
    } catch {
      Alert.alert('🔌 Lỗi mạng', `Không kết nối được server`);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setOrderSuccess(false);
    onSuccess();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={orderSuccess ? undefined : onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
        {orderSuccess ? (
          /* ── Success Screen ── */
          <Animated.View style={[styles.successContainer, { opacity: successOpacity }]}>
            <Animated.View style={[styles.successIconWrap, { transform: [{ scale: successScale }] }]}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={48} color="#FFF" />
              </View>
              <View style={styles.successRing} />
            </Animated.View>

            <Text style={styles.successTitle}>Đặt hàng thành công! 🎉</Text>
            <Text style={styles.successSub}>Đơn hàng #{orderId} đã được gửi đến {restaurantName}</Text>

            <View style={styles.successInfoCard}>
              <View style={styles.successInfoRow}>
                <Ionicons name="receipt-outline" size={18} color={GREEN} />
                <Text style={styles.successInfoLabel}>Mã đơn hàng</Text>
                <Text style={styles.successInfoValue}>#{orderId}</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successInfoRow}>
                <Ionicons name="cash-outline" size={18} color={GREEN} />
                <Text style={styles.successInfoLabel}>Tổng thanh toán</Text>
                <Text style={styles.successInfoValue}>{grandTotal.toLocaleString('vi-VN')}đ</Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successInfoRow}>
                <Ionicons name="wallet-outline" size={18} color={GREEN} />
                <Text style={styles.successInfoLabel}>Phương thức</Text>
                <Text style={styles.successInfoValue}>
                  {PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}
                </Text>
              </View>
              <View style={styles.successDivider} />
              <View style={styles.successInfoRow}>
                <Ionicons name="time-outline" size={18} color="#F9A825" />
                <Text style={styles.successInfoLabel}>Thời gian dự kiến</Text>
                <Text style={[styles.successInfoValue, { color: '#F9A825' }]}>20-35 phút</Text>
              </View>
            </View>

            <View style={styles.successSteps}>
              {[
                { icon: 'checkmark-circle', label: 'Đã xác nhận đơn', active: true },
                { icon: 'restaurant-outline', label: 'Nhà hàng đang chuẩn bị', active: true },
                { icon: 'bicycle-outline', label: 'Shipper đang giao', active: false },
                { icon: 'home-outline', label: 'Đã giao hàng', active: false },
              ].map((step, i) => (
                <View key={i} style={styles.successStep}>
                  <View style={[styles.successStepDot, step.active && styles.successStepDotActive]}>
                    <Ionicons name={step.icon as any} size={14} color={step.active ? '#FFF' : '#BDBDBD'} />
                  </View>
                  {i < 3 && <View style={[styles.successStepLine, step.active && styles.successStepLineActive]} />}
                  <Text style={[styles.successStepLabel, step.active && styles.successStepLabelActive]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} activeOpacity={0.88}>
              <Ionicons name="home" size={18} color="#FFF" />
              <Text style={styles.doneBtnText}>Quay về trang chủ</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* ── Checkout Form ── */
          <>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.checkoutHeader}>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="arrow-back" size={24} color="#212121" />
              </TouchableOpacity>
              <Text style={styles.checkoutTitle}>Xác nhận đơn hàng</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.checkoutBody} showsVerticalScrollIndicator={false}>
              {/* Restaurant Info */}
              <View style={styles.restInfoCard}>
                <View style={styles.restInfoIcon}>
                  <Ionicons name="restaurant" size={20} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.restInfoName}>{restaurantName}</Text>
                  <Text style={styles.restInfoMeta}>🕐 Dự kiến 20-35 phút</Text>
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="fast-food" size={18} color={GREEN} />
                  <Text style={styles.sectionLabel}>Chi tiết đơn hàng</Text>
                  <Text style={styles.itemCount}>{items.length} món</Text>
                </View>
                {items.map((item, i) => (
                  <View key={i} style={styles.orderItem}>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyBadgeText}>{item.quantity}x</Text>
                    </View>
                    <Text style={styles.orderItemName} numberOfLines={1}>{item.food_name}</Text>
                    <Text style={styles.orderItemPrice}>
                      {(Number(item.price) * item.quantity).toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                ))}
              </View>

              {/* Note */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={GREEN} />
                  <Text style={styles.sectionLabel}>Ghi chú cho quán</Text>
                </View>
                <TextInput
                  style={styles.noteInput}
                  placeholder="VD: Ít đá, nhiều rau, không hành..."
                  placeholderTextColor="#BDBDBD"
                  value={note}
                  onChangeText={setNote}
                  multiline
                />
              </View>

              {/* Payment Method */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="wallet" size={18} color={GREEN} />
                  <Text style={styles.sectionLabel}>Phương thức thanh toán</Text>
                </View>
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = paymentMethod === method.key;
                  return (
                    <TouchableOpacity
                      key={method.key}
                      style={[styles.paymentOption, isSelected && styles.paymentOptionActive]}
                      onPress={() => setPaymentMethod(method.key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.paymentIconBox, { backgroundColor: method.color + '15' }]}>
                        <Ionicons name={method.icon as any} size={20} color={method.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.paymentLabel, isSelected && { color: GREEN, fontWeight: '700' }]}>
                          {method.label}
                        </Text>
                        <Text style={styles.paymentDesc}>{method.desc}</Text>
                      </View>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price Summary */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="receipt" size={18} color={GREEN} />
                  <Text style={styles.sectionLabel}>Tóm tắt thanh toán</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Tạm tính</Text>
                  <Text style={styles.priceValue}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Phí giao hàng</Text>
                  <Text style={styles.priceValue}>{deliveryFee.toLocaleString('vi-VN')}đ</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: '#22C55E' }]}>Giảm giá</Text>
                    <Text style={[styles.priceValue, { color: '#22C55E' }]}>-{discount.toLocaleString('vi-VN')}đ</Text>
                  </View>
                )}
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.grandTotalLabel}>Tổng cộng</Text>
                  <Text style={styles.grandTotalValue}>{grandTotal.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <View style={styles.bottomPriceRow}>
                <View>
                  <Text style={styles.bottomPriceLabel}>Tổng thanh toán</Text>
                  <Text style={styles.bottomPriceValue}>{grandTotal.toLocaleString('vi-VN')}đ</Text>
                </View>
                <TouchableOpacity
                  style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
                  onPress={handleConfirmOrder}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={18} color="#FFF" />
                      <Text style={styles.confirmBtnText}>Xác nhận thanh toán</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: H * 0.92,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    elevation: 20,
  },
  handle: { width: 38, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },

  // ── Checkout Header ──
  checkoutHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  checkoutTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },

  // ── Checkout Body ──
  checkoutBody: { flex: 1, paddingHorizontal: 16 },

  // ── Restaurant Info ──
  restInfoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  restInfoIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.primaryLightBg, alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  restInfoName: { fontSize: 16, fontWeight: '700', color: '#212121', marginBottom: 3 },
  restInfoMeta: { fontSize: 13, color: '#9E9E9E' },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#212121', flex: 1 },
  itemCount: { fontSize: 12, fontWeight: '600', color: GREEN, backgroundColor: COLORS.primaryLightBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  // ── Order Items ──
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  qtyBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  qtyBadgeText: { fontSize: 12, fontWeight: '800', color: '#FFF' },
  orderItemName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#424242' },
  orderItemPrice: { fontSize: 14, fontWeight: '700', color: '#212121' },

  // ── Note ──
  noteInput: {
    backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#424242', borderWidth: 1, borderColor: '#EEEEEE',
    minHeight: 50, textAlignVertical: 'top',
  },

  // ── Payment Options ──
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#F0F0F0', marginBottom: 8,
  },
  paymentOptionActive: {
    borderColor: GREEN, backgroundColor: COLORS.primaryLightBg,
  },
  paymentIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  paymentLabel: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 1 },
  paymentDesc: { fontSize: 11, color: '#9E9E9E' },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: GREEN },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN },

  // ── Price Summary ──
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  priceLabel: { fontSize: 14, color: '#757575' },
  priceValue: { fontSize: 14, fontWeight: '600', color: '#424242' },
  priceDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
  grandTotalLabel: { fontSize: 16, fontWeight: '800', color: '#212121' },
  grandTotalValue: { fontSize: 20, fontWeight: '800', color: GREEN },

  // ── Bottom Bar ──
  bottomBar: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 36 : 22,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  bottomPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomPriceLabel: { fontSize: 13, color: '#9E9E9E', marginBottom: 2 },
  bottomPriceValue: { fontSize: 20, fontWeight: '800', color: '#212121' },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: GREEN, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 24,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  // ── Success Screen ──
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, backgroundColor: '#FFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  successIconWrap: { position: 'relative', marginBottom: 20 },
  successIconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  successRing: {
    position: 'absolute', top: -8, left: -8, right: -8, bottom: -8,
    borderRadius: 52, borderWidth: 2, borderColor: GREEN + '30',
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#212121', marginBottom: 6, textAlign: 'center' },
  successSub: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20, marginBottom: 20 },

  successInfoCard: {
    backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16,
    alignSelf: 'stretch', marginBottom: 20,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  successInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  successInfoLabel: { flex: 1, fontSize: 13, color: '#757575' },
  successInfoValue: { fontSize: 14, fontWeight: '700', color: '#212121' },
  successDivider: { height: 1, backgroundColor: '#EEEEEE' },

  successSteps: {
    flexDirection: 'row', alignItems: 'flex-start', alignSelf: 'stretch',
    paddingHorizontal: 4, marginBottom: 28,
  },
  successStep: { flex: 1, alignItems: 'center', position: 'relative' },
  successStepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6, zIndex: 1,
  },
  successStepDotActive: { backgroundColor: GREEN },
  successStepLine: {
    position: 'absolute', top: 13, left: '60%', right: '-40%',
    height: 2, backgroundColor: '#F0F0F0', zIndex: 0,
  },
  successStepLineActive: { backgroundColor: GREEN + '50' },
  successStepLabel: { fontSize: 10, color: '#BDBDBD', textAlign: 'center', fontWeight: '500' },
  successStepLabelActive: { color: '#424242', fontWeight: '600' },

  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: GREEN, borderRadius: 14,
    paddingVertical: 16, alignSelf: 'stretch',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  doneBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
