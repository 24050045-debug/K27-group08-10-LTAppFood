import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { API_URL, COLORS } from '../../src/constants';
import RestCard, { Restaurant } from '../../src/components/RestCard';
import FoodOrderSheet from '../../src/components/FoodOrderSheet';
import { useAuth } from '../../src/context/AuthContext';

const { width: W } = Dimensions.get('window');
const ORANGE = COLORS.primary;

// ─── Food Item type ──────────────────────────────────
type FoodItem = {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
  restaurant_name?: string;
  restaurant_id?: number;
};

// ─── FoodApp Screen ──────────────────────────────────
export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loadingUI, setLoadingUI] = useState(true);

  const [activeCat, setActiveCat] = useState(0);
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Food category browsing
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [showFoodGrid, setShowFoodGrid] = useState(false);
  const [selectedCatName, setSelectedCatName] = useState('');

  // Cart
  const [cart, setCart] = useState<{ [foodId: number]: number }>({});
  const [cartModalVisible, setCartModalVisible] = useState(false);

  // Fetch UI Data (Categories & Featured)
  const fetchUIData = async () => {
    try {
      const [catRes, featRes] = await Promise.all([
        fetch(`${API_URL}/api/explore/categories`),
        fetch(`${API_URL}/api/explore/featured`)
      ]);
      const catData = await catRes.json();
      const featData = await featRes.json();
      if (catData.success) {
        // Add "Tất cả" as first category
        setCategories([{ id: 0, label: 'Tất cả', icon: '🍽️' }, ...catData.data]);
      }
      if (featData.success) setFeatured(featData.data);
    } catch (e) {
      console.log('Error fetching UI data:', e);
    } finally {
      setLoadingUI(false);
    }
  };

  // Fetch Restaurants
  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants`);
      const data = await res.json();
      if (data.success) {
        setRestaurants(data.data);
      } else {
        setRestaurants([]);
      }
    } catch (e) {
      console.log('Error fetching restaurants:', e);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Foods by Category
  const fetchFoods = async (categoryId: number) => {
    setLoadingFoods(true);
    try {
      const url = categoryId === 0
        ? `${API_URL}/api/explore/foods`
        : `${API_URL}/api/explore/foods?category_id=${categoryId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFoods(data.data);
      } else {
        setFoods([]);
      }
    } catch (e) {
      console.log('Error fetching foods:', e);
      setFoods([]);
    } finally {
      setLoadingFoods(false);
    }
  };

  useEffect(() => {
    fetchUIData();
    fetchRestaurants();
  }, []);

  const handleCategoryPress = (cat: any) => {
    setActiveCat(cat.id);
    setSelectedCatName(cat.label);
    setShowFoodGrid(true);
    fetchFoods(cat.id);
  };

  const handleOpenRest = (r: Restaurant) => {
    setSelectedRest(r);
    setSheetOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUIData(), fetchRestaurants()]);
    if (showFoodGrid) await fetchFoods(activeCat);
    setRefreshing(false);
  };

  // Cart functions
  const addToCart = (food: FoodItem) => {
    setCart(prev => ({ ...prev, [food.id]: (prev[food.id] || 0) + 1 }));
  };

  const removeFromCart = (foodId: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[foodId] > 1) { next[foodId] -= 1; }
      else { delete next[foodId]; }
      return next;
    });
  };

  const cartTotal = foods.reduce((sum, f) => sum + f.price * (cart[f.id] || 0), 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const submitCartOrder = async () => {
    if (cartTotal === 0) {
      Alert.alert('⚠️', 'Vui lòng chọn ít nhất 1 món!');
      return;
    }
    const orderItems = foods
      .filter(f => cart[f.id])
      .map(f => ({ food_id: f.id, name: f.name, quantity: cart[f.id], price: f.price, restaurant_id: f.restaurant_id }));

    try {
      const res = await fetch(`${API_URL}/api/food-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 1,
          restaurant_name: orderItems[0]?.name || 'FoodApp',
          food_items: orderItems,
          total_price: cartTotal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('✅ Đặt đơn thành công!', `Mã đơn: #${data.orderId}`, [{ text: 'OK' }]);
        setCart({});
        setCartModalVisible(false);
      } else {
        Alert.alert('Lỗi', data.error);
      }
    } catch {
      Alert.alert('Lỗi mạng', 'Không kết nối được server.');
    }
  };

  // ─── Food Card ─────────────────────────────────────
  const renderFoodCard = ({ item }: { item: FoodItem }) => {
    const qty = cart[item.id] || 0;
    return (
      <View style={cs.foodCard}>
        <View style={cs.foodCardTop}>
          <View style={cs.foodEmoji}>
            <Text style={{ fontSize: 28 }}>🍽️</Text>
          </View>
          {qty > 0 && (
            <View style={cs.foodBadge}>
              <Text style={cs.foodBadgeText}>{qty}</Text>
            </View>
          )}
        </View>
        <View style={cs.foodCardBody}>
          <Text style={cs.foodName} numberOfLines={2}>{item.name}</Text>
          {item.restaurant_name && (
            <Text style={cs.foodRestName} numberOfLines={1}>{item.restaurant_name}</Text>
          )}
          <View style={cs.foodBottom}>
            <Text style={cs.foodPrice}>{Number(item.price).toLocaleString('vi-VN')}đ</Text>
            {qty > 0 ? (
              <View style={cs.qtyRow}>
                <TouchableOpacity style={cs.qtyBtn} onPress={() => removeFromCart(item.id)}>
                  <Ionicons name="remove" size={14} color={ORANGE} />
                </TouchableOpacity>
                <Text style={cs.qtyText}>{qty}</Text>
                <TouchableOpacity style={cs.qtyBtn} onPress={() => addToCart(item)}>
                  <Ionicons name="add" size={14} color={ORANGE} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={cs.addFoodBtn} onPress={() => addToCart(item)}>
                <Ionicons name="add" size={18} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={cs.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* ── HEADER ── */}
      <View style={cs.header}>
        <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight : 44 }} />

        <View style={cs.headerTopRow}>
          <View style={cs.brandLogo}>
            <Ionicons name="fast-food" size={28} color={ORANGE} style={{ marginRight: 2 }} />
            <Text style={cs.brandLogoText}>
              Food<Text style={{ color: ORANGE }}>App</Text>
            </Text>
          </View>
          <View style={cs.headerRight}>
            <TouchableOpacity style={cs.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#212121" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[cs.iconBtn, cartCount > 0 && { backgroundColor: ORANGE + '15' }]}
              onPress={() => cartCount > 0 && setCartModalVisible(true)}
            >
              <Ionicons name="cart-outline" size={22} color={cartCount > 0 ? ORANGE : '#212121'} />
              {cartCount > 0 && (
                <View style={cs.cartBadge}>
                  <Text style={cs.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={cs.locationRow}>
          <Ionicons name="location-sharp" size={16} color={ORANGE} />
          <Text style={cs.locationMain}>Giao đến: </Text>
          <Text style={cs.locationAddr} numberOfLines={1}>TP. Hồ Chí Minh</Text>
          <Ionicons name="chevron-down" size={14} color="#424242" />
        </TouchableOpacity>

        <TouchableOpacity style={cs.searchBar} activeOpacity={0.85}>
          <Ionicons name="search-outline" size={18} color="#9E9E9E" />
          <Text style={cs.searchPlaceholder}>Tìm món ăn, nhà hàng...</Text>
          <View style={cs.searchRight}>
            <Ionicons name="options-outline" size={18} color={ORANGE} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartCount > 0 ? 90 : 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={ORANGE} colors={[ORANGE]} />}
      >
        {/* ── CATEGORY FILTER ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cs.catRow}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[cs.catChip, activeCat === c.id && showFoodGrid && cs.catChipActive]}
              onPress={() => handleCategoryPress(c)}
            >
              <Text style={cs.catIcon}>{c.icon}</Text>
              <Text style={[cs.catLabel, activeCat === c.id && showFoodGrid && cs.catLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── FOOD GRID (when category selected) ── */}
        {showFoodGrid && (
          <View>
            <View style={cs.sectionHead}>
              <Text style={cs.sectionTitle}>
                {selectedCatName === 'Tất cả' ? 'Tất cả món ăn' : selectedCatName}
              </Text>
              <TouchableOpacity onPress={() => setShowFoodGrid(false)}>
                <Text style={[cs.sectionLink, { color: ORANGE }]}>Ẩn ✕</Text>
              </TouchableOpacity>
            </View>

            {loadingFoods ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={ORANGE} />
              </View>
            ) : foods.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 32 }}>🍽️</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#212121' }}>Chưa có món ăn nào</Text>
                <Text style={{ fontSize: 13, color: '#9E9E9E', textAlign: 'center' }}>
                  Danh mục này chưa có món ăn
                </Text>
              </View>
            ) : (
              <View style={cs.foodGrid}>
                {foods.map((item) => (
                  <View key={item.id} style={{ width: (W - 42) / 2 }}>
                    {renderFoodCard({ item })}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── FEATURED SECTION ── */}
        <View style={cs.sectionHead}>
          <Text style={cs.sectionTitle}>Khám phá</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cs.featuredRow}>
          {featured.map((f, i) => (
            <TouchableOpacity key={i} style={[cs.featCard, { backgroundColor: f.bg }]} activeOpacity={0.85}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>{f.emoji}</Text>
              <Text style={[cs.featLabel, { color: f.color }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── RESTAURANT LIST ── */}
        <View style={cs.sectionHead}>
          <Text style={cs.sectionTitle}>Gợi ý cho bạn</Text>
          <TouchableOpacity><Text style={[cs.sectionLink, { color: ORANGE }]}>Xem tất cả →</Text></TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={ORANGE} />
          </View>
        ) : restaurants.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 32 }}>🍽️</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#212121' }}>Chưa có nhà hàng nào</Text>
            <Text style={{ fontSize: 13, color: '#9E9E9E', textAlign: 'center' }}>Các nhà hàng sẽ xuất hiện ở đây khi có dữ liệu từ server</Text>
          </View>
        ) : (
          restaurants.map((r) => <RestCard key={r.id} r={r} onPress={() => handleOpenRest(r)} />)
        )}
      </ScrollView>

      {/* ── Floating Cart Bar ── */}
      {cartCount > 0 && (
        <TouchableOpacity style={cs.floatingCart} onPress={() => setCartModalVisible(true)} activeOpacity={0.9}>
          <View style={cs.floatingCartLeft}>
            <View style={cs.floatingCartBadge}>
              <Text style={cs.floatingCartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={cs.floatingCartLabel}>Giỏ hàng</Text>
          </View>
          <Text style={cs.floatingCartPrice}>{cartTotal.toLocaleString('vi-VN')}đ</Text>
        </TouchableOpacity>
      )}

      {/* ── Cart Modal ── */}
      <Modal visible={cartModalVisible} animationType="slide" transparent>
        <View style={cs.cartOverlay}>
          <View style={cs.cartSheet}>
            <View style={cs.cartHeader}>
              <Text style={cs.cartTitle}>🛒 Giỏ hàng ({cartCount} món)</Text>
              <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#BDBDBD" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {foods.filter(f => cart[f.id]).map(item => (
                <View key={item.id} style={cs.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={cs.cartItemName}>{item.name}</Text>
                    <Text style={cs.cartItemRestaurant}>{item.restaurant_name}</Text>
                    <Text style={cs.cartItemPrice}>{Number(item.price).toLocaleString('vi-VN')}đ</Text>
                  </View>
                  <View style={cs.qtyRow}>
                    <TouchableOpacity style={cs.qtyBtn} onPress={() => removeFromCart(item.id)}>
                      <Ionicons name="remove" size={14} color={ORANGE} />
                    </TouchableOpacity>
                    <Text style={cs.qtyText}>{cart[item.id]}</Text>
                    <TouchableOpacity style={cs.qtyBtn} onPress={() => addToCart(item)}>
                      <Ionicons name="add" size={14} color={ORANGE} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={cs.cartFooter}>
              <View style={cs.cartTotalRow}>
                <Text style={cs.cartTotalLabel}>Tổng cộng:</Text>
                <Text style={cs.cartTotalPrice}>{cartTotal.toLocaleString('vi-VN')}đ</Text>
              </View>
              <TouchableOpacity style={cs.cartOrderBtn} onPress={submitCartOrder} activeOpacity={0.88}>
                <Text style={cs.cartOrderText}>Đặt đơn ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Sheet for Restaurant Food Order */}
      <FoodOrderSheet visible={sheetOpen} restaurant={selectedRest} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────
const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    backgroundColor: '#FFF', paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 4,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  brandLogo: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  brandLogoText: { fontSize: 26, fontWeight: '900', color: '#212121', letterSpacing: -1, fontStyle: 'italic' },
  headerRight: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', position: 'relative' },

  cartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: ORANGE, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },

  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locationMain: { fontSize: 13, color: '#9E9E9E' },
  locationAddr: { fontSize: 13, fontWeight: '700', color: '#212121', flex: 1 },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, gap: 8, borderWidth: 1, borderColor: '#EEEEEE' },
  searchPlaceholder: { flex: 1, color: '#9E9E9E', fontSize: 14 },
  searchRight: { paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: '#E0E0E0' },

  // Categories
  catRow: { paddingHorizontal: 14, gap: 8, paddingVertical: 14 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 8,
    backgroundColor: '#FFF', borderRadius: 22,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  catChipActive: { backgroundColor: '#E8F5E9', borderColor: ORANGE },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 13, color: '#616161', fontWeight: '500' },
  catLabelActive: { color: ORANGE, fontWeight: '700' },

  // Section
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#212121' },
  sectionLink: { fontSize: 13, fontWeight: '700' },

  // Featured
  featuredRow: { paddingHorizontal: 14, gap: 10, marginBottom: 6 },
  featCard: { width: 110, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  featLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },

  // Food Grid
  foodGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 14 },
  foodCard: {
    backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    marginBottom: 4,
  },
  foodCardTop: { height: 90, backgroundColor: '#F9F5F0', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  foodEmoji: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  foodBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: ORANGE, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  foodBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  foodCardBody: { padding: 10 },
  foodName: { fontSize: 13, fontWeight: '700', color: '#212121', marginBottom: 2, minHeight: 34 },
  foodRestName: { fontSize: 11, color: '#9E9E9E', marginBottom: 6 },
  foodBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodPrice: { fontSize: 14, fontWeight: '800', color: ORANGE },
  addFoodBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#212121', minWidth: 16, textAlign: 'center' },

  // Floating Cart Bar
  floatingCart: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: ORANGE, paddingHorizontal: 20,
    paddingVertical: 14, paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 12,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatingCartBadge: { backgroundColor: '#FFF', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  floatingCartBadgeText: { fontSize: 13, fontWeight: '800', color: ORANGE },
  floatingCartLabel: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  floatingCartPrice: { fontSize: 18, fontWeight: '800', color: '#FFF' },

  // Cart Modal
  cartOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  cartSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '80%', paddingTop: 12 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  cartTitle: { fontSize: 18, fontWeight: '800', color: '#212121' },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  cartItemName: { fontSize: 15, fontWeight: '700', color: '#212121' },
  cartItemRestaurant: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  cartItemPrice: { fontSize: 14, fontWeight: '700', color: ORANGE, marginTop: 2 },
  cartFooter: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 38 : 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cartTotalLabel: { fontSize: 15, fontWeight: '600', color: '#616161' },
  cartTotalPrice: { fontSize: 22, fontWeight: '800', color: '#212121' },
  cartOrderBtn: { backgroundColor: ORANGE, borderRadius: 13, paddingVertical: 16, alignItems: 'center', shadowColor: ORANGE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  cartOrderText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
