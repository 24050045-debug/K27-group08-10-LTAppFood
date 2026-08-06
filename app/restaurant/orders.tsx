import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../../src/constants';
import { COLORS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const GREEN = COLORS.primary;
const RESTAURANT_ORANGE = '#FF6B35';

const STATUS_MAP: Record<string, { label: string, color: string, bg: string }> = {
  'pending': { label: 'Chờ xác nhận', color: '#F59E0B', bg: '#FEF3C7' },
  'accepted': { label: 'Đã xác nhận', color: '#3B82F6', bg: '#DBEAFE' },
  'preparing': { label: 'Đang làm', color: '#8B5CF6', bg: '#EDE9FE' },
  'ready': { label: 'Sẵn sàng giao', color: '#10B981', bg: '#D1FAE5' },
  'completed': { label: 'Hoàn thành', color: '#6B7280', bg: '#F3F4F6' },
  'cancelled': { label: 'Đã huỷ', color: '#EF4444', bg: '#FEE2E2' },
};

export default function RestaurantOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active, history

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/restaurant/${user.id}/orders?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (e) {
      console.log('Error fetching restaurant orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Tự động làm mới mỗi 5 giây
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: number, nextStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders(); // Reload orders
      } else {
        Alert.alert('Lỗi', data.error || 'Không thể cập nhật trạng thái');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Lỗi kết nối máy chủ');
    }
  };

  const handleNextAction = (order: any) => {
    let nextStatus = '';
    let confirmMsg = '';

    if (order.status === 'pending') {
      nextStatus = 'accepted';
      confirmMsg = 'Bạn có muốn xác nhận đơn hàng này?';
    } else if (order.status === 'accepted') {
      nextStatus = 'preparing';
      confirmMsg = 'Bắt đầu chuẩn bị món cho đơn hàng này?';
    } else if (order.status === 'preparing') {
      nextStatus = 'ready';
      confirmMsg = 'Món ăn đã xong và sẵn sàng giao cho tài xế?';
    } else if (order.status === 'ready') {
      nextStatus = 'completed';
      confirmMsg = 'Tài xế đã nhận món?';
    } else {
      return;
    }

    Alert.alert('Cập nhật trạng thái', confirmMsg, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đồng ý', onPress: () => updateStatus(order.id, nextStatus) }
    ]);
  };

  const activeOrders = orders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
  const historyOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));
  
  const displayOrders = activeTab === 'active' ? activeOrders : historyOrders;

  const renderItem = ({ item }: { item: any }) => {
    const statusInfo = STATUS_MAP[item.status] || STATUS_MAP['pending'];
    const d = new Date(item.created_at);
    const dateStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}`;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Đơn #{item.order_id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.orderBody}>
          <Text style={styles.customerName}>👤 {item.customer_name || 'Khách hàng'}</Text>
          <Text style={styles.customerPhone}>📞 {item.customer_phone || 'Không có sđt'}</Text>
          <Text style={styles.orderTime}>🕒 {dateStr}</Text>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.totalLabel}>Tổng tiền:</Text>
            <Text style={styles.totalPrice}>{Number(item.total_price).toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>

        {activeTab === 'active' && (
          <View style={styles.orderActions}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: item.status === 'pending' ? GREEN : RESTAURANT_ORANGE }]}
              onPress={() => handleNextAction(item)}
            >
              <Text style={styles.actionBtnText}>
                {item.status === 'pending' ? 'Xác nhận đơn' :
                 item.status === 'accepted' ? 'Bắt đầu làm' :
                 item.status === 'preparing' ? 'Sẵn sàng giao' :
                 'Đã giao tài xế'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Đang xử lý ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={RESTAURANT_ORANGE} />
        </View>
      ) : displayOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#E0E0E0" />
          <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={displayOrders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[RESTAURANT_ORANGE]} />
          }
        />
      )}
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

  tabsRow: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: RESTAURANT_ORANGE },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9E9E9E' },
  tabTextActive: { color: RESTAURANT_ORANGE },

  listContent: { padding: 16 },

  orderCard: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  orderId: { fontSize: 15, fontWeight: '800', color: '#212121' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },

  orderBody: { padding: 16 },
  customerName: { fontSize: 15, fontWeight: '600', color: '#212121', marginBottom: 4 },
  customerPhone: { fontSize: 14, color: '#757575', marginBottom: 4 },
  orderTime: { fontSize: 13, color: '#9E9E9E' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  totalLabel: { fontSize: 14, color: '#757575' },
  totalPrice: { fontSize: 18, fontWeight: '800', color: GREEN },

  orderActions: { padding: 16, paddingTop: 0 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9E9E9E', fontWeight: '500' }
});
