import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, COLORS } from '../../src/constants';

const FOODAPP_COLOR = COLORS.primary;
const GREEN = COLORS.primary;

export default function ActivityScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      // Fetch Transport Bookings and Food Orders
      const [bookingRes, foodRes] = await Promise.all([
        fetch(`${API_URL}/api/booking/history/1?t=${Date.now()}`).catch(() => null),
        fetch(`${API_URL}/api/orders/history/1?t=${Date.now()}`).catch(() => null)
      ]);
      
      let bookingData = { success: false, data: [] };
      let foodData = { success: false, data: [] };
      
      if (bookingRes) bookingData = await bookingRes.json();
      if (foodRes) foodData = await foodRes.json();
      
      let combined: any[] = [];

      if (bookingData.success) {
        const bookings = bookingData.data.map((item: any) => {
          let emoji = '🛵';
          let serviceName = 'Xe máy';
          if (item.service_type === 'car')      { emoji = '🚗'; serviceName = 'Ô tô'; }
          else if (item.service_type === 'delivery') { emoji = '📦'; serviceName = 'Giao hàng'; }

          const d = new Date(item.created_at);
          const dateStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}, ${d.getDate()}/${d.getMonth() + 1}`;

          return {
            id: `b${item.id}`,
            type: 'transport',
            service: serviceName,
            emoji,
            name: `${item.pickup_address} → ${item.dropoff_address}`,
            price: `${item.price.toLocaleString('vi-VN')}đ`,
            date: dateStr,
            timestamp: d.getTime(),
            status: item.status,
            canReorder: false,
          };
        });
        combined = [...combined, ...bookings];
      }

      if (foodData.success) {
        const foods = foodData.data.map((item: any) => {
          const d = new Date(item.created_at);
          const dateStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}, ${d.getDate()}/${d.getMonth() + 1}`;

          return {
            id: `f${item.id}`,
            type: 'food',
            service: 'Đồ ăn',
            emoji: '🍔',
            name: item.restaurant_name || `Đơn hàng #${item.order_id}`,
            price: `${Number(item.total_price).toLocaleString('vi-VN')}đ`,
            date: dateStr,
            timestamp: d.getTime(),
            status: item.status,
            canReorder: true,
          };
        });
        combined = [...combined, ...foods];
      }

      combined.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(combined);
    } catch (e) {
      console.warn('Không thể tải lịch sử:', e);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Hoạt động</Text>
          <TouchableOpacity style={styles.historyBtn}>
            <Ionicons name="time-outline" size={16} color="#212121" />
            <Text style={styles.historyText}>Lịch sử</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[FOODAPP_COLOR]} />}
      >
        {/* Review prompt – chỉ hiện khi có đơn hàng thật */}
        {history.length > 0 && (
          <TouchableOpacity style={styles.reviewCard} activeOpacity={0.85}>
            <View style={styles.reviewIcon}>
              <Text style={{ fontSize: 30 }}>🌟</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewTitle}>Chia sẻ cảm nhận của bạn</Text>
              <Text style={styles.reviewSub}>Bạn thấy thế nào về trải nghiệm?</Text>
              <Text style={styles.reviewLink}>Đánh giá và nhận xét</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Recent Orders / Bookings */}
        <Text style={styles.sectionTitle}>Gần đây</Text>

        <View style={styles.orderList}>
          {loading && !refreshing ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={FOODAPP_COLOR} />
            </View>
          ) : history.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#9E9E9E' }}>Chưa có hoạt động nào</Text>
            </View>
          ) : (
            history.map((item, i) => (
              <View key={item.id}>
                <TouchableOpacity 
                  style={styles.orderItem} 
                  activeOpacity={0.8}
                  onPress={() => {
                    if (item.type === 'food') {
                      router.push(`/order/${String(item.id).replace('f', '')}`);
                    } else {
                      Alert.alert('Chi tiết', 'Chức năng đang phát triển');
                    }
                  }}
                >
                  <View style={styles.orderIcon}>
                    <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.orderTopRow}>
                      <Text style={styles.orderName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.orderPrice}>{item.price}</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                      <Text style={[styles.orderService, { backgroundColor: item.type === 'food' ? '#FFF3E0' : '#E8F5E9', color: item.type === 'food' ? '#FF6D00' : GREEN }]}>
                        {item.service}
                      </Text>
                      <Text style={styles.orderDate}> · {item.date}</Text>
                      {item.status === 'cancelled' && (
                        <Text style={[styles.orderDate, { color: '#E53935' }]}> · Đã huỷ</Text>
                      )}
                    </View>

                    <View style={styles.orderActions}>
                      <TouchableOpacity onPress={() => Alert.alert('Đánh giá', `Đánh giá: ${item.name}`)}>
                        <Text style={styles.actionLink}>Đánh giá <Text style={styles.actionArrow}>→</Text></Text>
                      </TouchableOpacity>
                      {item.canReorder && (
                        <>
                          <Text style={styles.actionSep}>·</Text>
                          <TouchableOpacity onPress={() => Alert.alert('Đặt lại', `Đặt lại: ${item.name}`)}>
                            <Text style={styles.actionLink}>Đặt lại <Text style={styles.actionArrow}>→</Text></Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                {i < history.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        {/* See all */}
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>Xem tất cả lịch sử →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#212121' },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  historyText: { fontSize: 13, fontWeight: '600', color: '#212121' },

  body: { paddingBottom: 30 },

  reviewCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF', marginHorizontal: 14, marginTop: 14,
    borderRadius: 14, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  reviewIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center',
  },
  reviewTitle: { fontSize: 14, fontWeight: '600', color: '#212121', lineHeight: 20, marginBottom: 4 },
  reviewSub: { fontSize: 12, color: '#9E9E9E', marginBottom: 8 },
  reviewLink: { fontSize: 13, color: FOODAPP_COLOR, fontWeight: '700' },

  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: '#212121',
    paddingHorizontal: 18, marginTop: 20, marginBottom: 4,
  },

  orderList: {
    backgroundColor: '#FFF', marginHorizontal: 14,
    borderRadius: 14, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  orderItem: {
    flexDirection: 'row', paddingVertical: 16, gap: 12, alignItems: 'flex-start',
  },
  orderIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  orderName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#212121', lineHeight: 20 },
  orderPrice: { fontSize: 14, fontWeight: '700', color: '#212121' },
  orderService: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  orderDate: { fontSize: 12, color: '#9E9E9E' },
  orderActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  actionLink: { fontSize: 13, color: FOODAPP_COLOR, fontWeight: '600' },
  actionArrow: { fontWeight: '700' },
  actionSep: { color: '#BDBDBD', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#F5F5F5' },

  seeAllBtn: {
    alignSelf: 'center', marginTop: 18, marginBottom: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: '#FFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  seeAllText: { fontSize: 14, fontWeight: '700', color: FOODAPP_COLOR },
});
