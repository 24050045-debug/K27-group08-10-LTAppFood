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
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Restaurant } from './RestCard';
import CheckoutSheet from './CheckoutSheet';
import { useAuth } from '../context/AuthContext';
import { API_URL, SERVER_IP } from '../constants';

const ORANGE = COLORS.primary;

type MenuItemAPI = {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  status?: string;
  category?: string;
};

export default function FoodOrderSheet({
  visible, restaurant, onClose,
}: { visible: boolean; restaurant: Restaurant | null; onClose: () => void }) {
  const { user } = useAuth();
  const [menu, setMenu] = useState<MenuItemAPI[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ [key: number]: number }>({});
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const slide = useRef(new Animated.Value(600)).current;

  // Fetch menu từ API khi mở sheet
  useEffect(() => {
    if (visible && restaurant) {
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, tension: 75, friction: 11 }).start();
      fetchMenu(restaurant.id);
    } else {
      slide.setValue(600);
      setSelectedItems({});
      setMenu([]);
    }
  }, [visible, restaurant]);

  const fetchMenu = async (restaurantId: number) => {
    setLoadingMenu(true);
    try {
      const res = await fetch(`${API_URL}/api/restaurant/${restaurantId}/menu`);
      const data = await res.json();
      if (data.success) {
        setMenu(data.data || []);
      } else {
        setMenu([]);
      }
    } catch (e) {
      console.log('Error fetching menu:', e);
      setMenu([]);
    } finally {
      setLoadingMenu(false);
    }
  };

  const toggleItem = (itemId: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(prev => {
      const next = { ...prev };
      if (next[itemId] > 1) {
        next[itemId] -= 1;
      } else {
        delete next[itemId];
      }
      return next;
    });
  };

  const totalPrice = menu.reduce((sum, item) => sum + (Number(item.price) * (selectedItems[item.id] || 0)), 0);

  const handleCheckout = () => {
    if (totalPrice === 0) {
      Alert.alert('⚠️ Giỏ hàng trống', 'Vui lòng chọn ít nhất 1 món ăn!');
      return;
    }
    setCheckoutVisible(true);
  };

  if (!restaurant) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
        <View style={styles.handle} />
        
        <View style={styles.sheetHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>{restaurant.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F9A825" />
              <Text style={styles.ratingText}>{restaurant.rating}</Text>
              {restaurant.time ? (
                <>
                  <Text style={styles.metaDot}> · </Text>
                  <Text style={styles.metaTime}>{restaurant.time}</Text>
                </>
              ) : null}
            </View>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Ionicons name="close-circle" size={28} color="#BDBDBD" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.sheetMenu} showsVerticalScrollIndicator={false}>
          <Text style={styles.menuHeader}>Menu</Text>

          {loadingMenu ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={ORANGE} />
              <Text style={{ color: '#9E9E9E', marginTop: 8 }}>Đang tải menu...</Text>
            </View>
          ) : menu.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 32 }}>🍽️</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#212121', marginTop: 8 }}>Chưa có món ăn</Text>
              <Text style={{ fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginTop: 4 }}>Nhà hàng chưa cập nhật menu</Text>
            </View>
          ) : (
            menu.map((item) => (
              <View key={item.id} style={styles.menuItem}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  {item.category ? <Text style={styles.menuItemCat}>{item.category}</Text> : null}
                  <Text style={styles.menuItemPrice}>{Number(item.price).toLocaleString('vi-VN')}đ</Text>
                </View>
                {selectedItems[item.id] ? (
                  <View style={styles.qtyControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeItem(item.id)}>
                      <Ionicons name="remove" size={16} color={ORANGE} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{selectedItems[item.id]}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => toggleItem(item.id)}>
                      <Ionicons name="add" size={16} color={ORANGE} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => toggleItem(item.id)}>
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.sheetFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalPrice}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
          </View>
          <TouchableOpacity 
            style={[styles.confirmBtn, (totalPrice === 0) && { opacity: 0.7 }]} 
            onPress={handleCheckout} 
            disabled={totalPrice === 0} 
            activeOpacity={0.88}
          >
            <Text style={styles.confirmText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <CheckoutSheet
        visible={checkoutVisible}
        items={menu
          .filter(item => selectedItems[item.id])
          .map(item => ({
            food_id: item.id,
            food_name: item.name,
            quantity: selectedItems[item.id],
            price: item.price,
          }))}
        totalPrice={totalPrice}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        onClose={() => setCheckoutVisible(false)}
        onSuccess={() => {
          setCheckoutVisible(false);
          onClose(); // close order sheet
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#212121' },
  metaDot: { color: '#BDBDBD', fontSize: 12 },
  metaTime: { fontSize: 12, color: '#9E9E9E' },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Dimensions.get('window').height * 0.8, backgroundColor: '#FFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, elevation: 20 },
  handle: { width: 38, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#212121', marginBottom: 4 },
  sheetMenu: { flex: 1, paddingHorizontal: 20 },
  menuHeader: { fontSize: 18, fontWeight: '700', color: '#212121', marginTop: 16, marginBottom: 12 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuItemName: { fontSize: 15, fontWeight: '600', color: '#212121', marginBottom: 2 },
  menuItemCat: { fontSize: 12, color: '#9E9E9E', marginBottom: 4 },
  menuItemPrice: { fontSize: 14, color: ORANGE, fontWeight: '600' },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 15, fontWeight: '700', color: '#212121', minWidth: 20, textAlign: 'center' },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 38 : 26, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#616161' },
  totalPrice: { fontSize: 20, fontWeight: '800', color: '#212121' },
  confirmBtn: { backgroundColor: ORANGE, borderRadius: 13, paddingVertical: 16, alignItems: 'center', shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  confirmText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
