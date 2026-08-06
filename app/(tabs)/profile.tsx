import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { API_URL, COLORS } from '../../src/constants';

const { width: W } = Dimensions.get('window');
const GREEN = COLORS.primary;
const LIGHT_BG = '#F5F5F5';
const CARD_BG = '#FFF';
const BORDER = '#F0F0F0';
const AMBER = '#F9A825';

// ─── Helpers ────────────────────────────────────────────────
function formatVND(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'tr';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatDate(d: string) {
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

// ─── Setting Item Component ─────────────────────────────────
function SettingItem({
  icon,
  label,
  value,
  onPress,
  rightElement,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconBox, danger && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
          <Ionicons name={icon as any} size={18} color={danger ? '#EF4444' : GREEN} />
        </View>
        <Text style={[styles.settingLabel, danger && { color: '#EF4444' }]}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        {rightElement || (
          onPress ? <Ionicons name="chevron-forward" size={16} color="#BDBDBD" /> : null
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Mini Bar Chart (pure RN) ───────────────────────────────
function MiniBarChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const chartH = 120;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsRow}>
        {data.map((d, i) => {
          const h = (d.revenue / maxRev) * chartH;
          return (
            <View key={i} style={chartStyles.barCol}>
              <Text style={chartStyles.barValue}>{formatVND(d.revenue)}</Text>
              <View style={[chartStyles.bar, { height: Math.max(h, 4), backgroundColor: i === data.length - 1 ? GREEN : 'rgba(61,153,112,0.4)' }]} />
              <Text style={chartStyles.barLabel}>{formatDate(d.date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: { marginTop: 8 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160, paddingBottom: 24 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 28, borderRadius: 6, minHeight: 4, marginVertical: 4 },
  barValue: { fontSize: 9, color: '#94A3B8', fontWeight: '600' },
  barLabel: { fontSize: 10, color: '#94A3B8' },
});

// ─── Stat Card ──────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg }: { icon: string; label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[statStyles.card, { borderColor: bg }]}>
      <View style={[statStyles.iconBox, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: CARD_BG, borderRadius: 16, padding: 14, borderWidth: 1, alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  label: { fontSize: 11, color: '#94A3B8', marginTop: 2, textAlign: 'center' },
});

// ─── Edit Profile Modal ─────────────────────────────────────
function EditProfileModal({
  visible,
  onClose,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  user: { name: string; email: string; phone: string } | null;
}) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập họ và tên"
            placeholderTextColor="#4B5563"
          />

          <Text style={styles.inputLabel}>Email</Text>
          <View style={[styles.input, { backgroundColor: '#0A1610' }]}>
            <Text style={{ color: '#4B5563', fontSize: 15 }}>{user?.email || ''}</Text>
          </View>

          <Text style={styles.inputLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#4B5563"
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => {
              Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
              onClose();
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PROFILE VIEW
// ═══════════════════════════════════════════════════════════════
function AdminProfileView({
  user,
  onLogout,
  insets,
}: {
  user: any;
  onLogout: () => void;
  insets: { top: number };
}) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/dashboard`);
      const data = await res.json();
      if (data.success) setDashboard(data);
    } catch (e) {
      console.log('Dashboard fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  const s = dashboard?.summary;

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={LIGHT_BG} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="shield-checkmark" size={22} color={AMBER} />
          <Text style={styles.headerTitle}>Quản trị viên</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} colors={[GREEN]} />}
      >
        {/* ── Admin Avatar Card ── */}
        <View style={[styles.avatarCard, { borderColor: AMBER + '40' }]}>
          <View style={[styles.avatarCircle, { backgroundColor: AMBER }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(249,168,37,0.15)' }]}>
                <Ionicons name="shield" size={12} color={AMBER} />
                <Text style={[styles.badgeText, { color: AMBER }]}>Quản trị viên</Text>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={{ color: '#94A3B8', marginTop: 12 }}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <>
            {/* ── Revenue Summary ── */}
            <SectionHeader title="Tổng quan doanh thu" />
            <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16 }}>
              <StatCard
                icon="cash-outline"
                label="Tổng doanh thu"
                value={formatVND(s?.totalRevenue || 0)}
                color="#22C55E"
                bg="rgba(34,197,94,0.12)"
              />
              <StatCard
                icon="time-outline"
                label="Đang chờ"
                value={formatVND(s?.pendingRevenue || 0)}
                color={AMBER}
                bg="rgba(249,168,37,0.12)"
              />
            </View>

            {/* ── Order Stats ── */}
            <SectionHeader title="Thống kê đơn hàng" />
            <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16 }}>
              <StatCard
                icon="receipt-outline"
                label="Tổng đơn"
                value={String(s?.totalOrders || 0)}
                color="#60A5FA"
                bg="rgba(96,165,250,0.12)"
              />
              <StatCard
                icon="checkmark-circle-outline"
                label="Hoàn thành"
                value={String(s?.completedOrders || 0)}
                color="#22C55E"
                bg="rgba(34,197,94,0.12)"
              />
              <StatCard
                icon="close-circle-outline"
                label="Đã hủy"
                value={String(s?.cancelledOrders || 0)}
                color="#F87171"
                bg="rgba(248,113,113,0.12)"
              />
            </View>

            {/* ── Customer count ── */}
            <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 10 }}>
              <StatCard
                icon="people-outline"
                label="Khách hàng"
                value={String(s?.totalCustomers || 0)}
                color="#A78BFA"
                bg="rgba(167,139,250,0.12)"
              />
              <StatCard
                icon="hourglass-outline"
                label="Đơn chờ xử lý"
                value={String(s?.pendingOrders || 0)}
                color={AMBER}
                bg="rgba(249,168,37,0.12)"
              />
            </View>

            {/* ── Revenue Chart ── */}
            {dashboard?.dailyRevenue?.length > 0 && (
              <>
                <SectionHeader title="Biểu đồ doanh thu 7 ngày" />
                <View style={[styles.settingGroup, { padding: 12 }]}>
                  <MiniBarChart data={dashboard.dailyRevenue} />
                </View>
              </>
            )}

            {/* ── Top Restaurants ── */}
            {dashboard?.topRestaurants?.length > 0 && (
              <>
                <SectionHeader title="Nhà hàng doanh thu cao" />
                <View style={styles.settingGroup}>
                  {dashboard.topRestaurants.map((r: any, i: number) => (
                    <View key={i} style={styles.settingItem}>
                      <View style={styles.settingLeft}>
                        <View style={[styles.settingIconBox, { backgroundColor: 'rgba(249,168,37,0.12)' }]}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: AMBER }}>#{i + 1}</Text>
                        </View>
                        <View>
                          <Text style={styles.settingLabel} numberOfLines={1}>{r.name}</Text>
                          <Text style={{ fontSize: 11, color: '#94A3B8' }}>{r.orders} đơn</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: GREEN }}>{formatVND(r.revenue)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── Recent Orders ── */}
            {dashboard?.recentOrders?.length > 0 && (
              <>
                <SectionHeader title="Đơn hàng gần đây" />
                <View style={styles.settingGroup}>
                  {dashboard.recentOrders.map((order: any, i: number) => {
                    const statusColors: Record<string, string> = { pending: AMBER, completed: '#22C55E', cancelled: '#F87171' };
                    const statusLabels: Record<string, string> = { pending: 'Chờ', completed: 'Xong', cancelled: 'Hủy' };
                    return (
                      <View key={i} style={styles.settingItem}>
                        <View style={[styles.settingLeft, { flex: 1 }]}>
                          <View style={[styles.settingIconBox, { backgroundColor: (statusColors[order.status] || '#4B5563') + '20' }]}>
                            <Ionicons
                              name={order.status === 'completed' ? 'checkmark' : order.status === 'cancelled' ? 'close' : 'time'}
                              size={18}
                              color={statusColors[order.status] || '#4B5563'}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.settingLabel} numberOfLines={1}>{order.customer_name || 'Khách'}</Text>
                            <Text style={{ fontSize: 11, color: '#94A3B8' }} numberOfLines={1}>{order.restaurant_name || ''}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>{formatVND(Number(order.total_price))}</Text>
                          <Text style={{ fontSize: 10, color: statusColors[order.status], fontWeight: '600' }}>
                            {statusLabels[order.status] || order.status}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* ── Admin Actions ── */}
        <SectionHeader title="Quản lý" />
        <View style={styles.settingGroup}>
          <SettingItem
            icon="restaurant-outline"
            label="Quản lý nhà hàng"
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          />
          <SettingItem
            icon="people-outline"
            label="Quản lý khách hàng"
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          />
          <SettingItem
            icon="bar-chart-outline"
            label="Báo cáo chi tiết"
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          />
          <SettingItem
            icon="settings-outline"
            label="Cài đặt hệ thống"
            onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')}
          />
        </View>

        {/* ── Logout ── */}
        <View style={[styles.settingGroup, { marginTop: 16 }]}>
          <SettingItem icon="log-out-outline" label="Đăng xuất" onPress={onLogout} danger />
        </View>

        <Text style={styles.versionText}>FoodApp Admin v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// USER PROFILE VIEW
// ═══════════════════════════════════════════════════════════════
function UserProfileView({
  user,
  onLogout,
  insets,
}: {
  user: any;
  onLogout: () => void;
  insets: { top: number };
}) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={LIGHT_BG} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Card ── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="star" size={12} color={AMBER} />
                <Text style={styles.badgeText}>Thành viên</Text>
              </View>
              {user?.linkedBank && (
                <View style={[styles.badge, { backgroundColor: 'rgba(61,153,112,0.15)' }]}>
                  <Ionicons name="card" size={12} color={GREEN} />
                  <Text style={[styles.badgeText, { color: GREEN }]}>Đã liên kết Bank</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="create-outline" size={20} color={GREEN} />
          </TouchableOpacity>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Đơn hàng</Text>
          </View>
          <View style={[styles.statBox, styles.statBorder]}>
            <Text style={styles.statNum}>0</Text>
            <Text style={styles.statLabel}>Đánh giá</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>0đ</Text>
            <Text style={styles.statLabel}>Tích lũy</Text>
          </View>
        </View>

        {/* ── Account Settings ── */}
        <SectionHeader title="Tài khoản" />
        <View style={styles.settingGroup}>
          <SettingItem icon="person-outline" label="Chỉnh sửa hồ sơ" onPress={() => setEditModalVisible(true)} />
          <SettingItem icon="lock-closed-outline" label="Đổi mật khẩu" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          <SettingItem icon="card-outline" label="Liên kết ngân hàng" value={user?.linkedBank ? 'Đã liên kết' : 'Chưa liên kết'} onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          <SettingItem icon="location-outline" label="Địa chỉ đã lưu" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
        </View>

        {/* ── Appearance ── */}
        <SectionHeader title="Giao diện & Hiển thị" />
        <View style={styles.settingGroup}>
          <SettingItem icon="moon-outline" label="Chế độ tối" rightElement={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: '#374151', true: GREEN }} thumbColor="#FFF" />} />
          <SettingItem icon="text-outline" label="Cỡ chữ" value="Mặc định" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          <SettingItem icon="language-outline" label="Ngôn ngữ" value="Tiếng Việt" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
        </View>

        {/* ── Notifications ── */}
        <SectionHeader title="Thông báo" />
        <View style={styles.settingGroup}>
          <SettingItem icon="notifications-outline" label="Thông báo đẩy" rightElement={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#374151', true: GREEN }} thumbColor="#FFF" />} />
          <SettingItem icon="navigate-outline" label="Dịch vụ vị trí" rightElement={<Switch value={locationEnabled} onValueChange={setLocationEnabled} trackColor={{ false: '#374151', true: GREEN }} thumbColor="#FFF" />} />
        </View>

        {/* ── Support ── */}
        <SectionHeader title="Hỗ trợ" />
        <View style={styles.settingGroup}>
          <SettingItem icon="help-circle-outline" label="Trung tâm trợ giúp" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          <SettingItem icon="chatbubble-ellipses-outline" label="Liên hệ hỗ trợ" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          <SettingItem icon="document-text-outline" label="Điều khoản sử dụng" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          <SettingItem icon="shield-checkmark-outline" label="Chính sách bảo mật" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
        </View>

        {/* ── Logout ── */}
        <View style={[styles.settingGroup, { marginTop: 16 }]}>
          <SettingItem icon="log-out-outline" label="Đăng xuất" onPress={onLogout} danger />
        </View>

        <Text style={styles.versionText}>FoodApp v1.0.0</Text>
      </ScrollView>

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        user={user}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PROFILE SCREEN – routes to Admin or User view
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// RESTAURANT PROFILE VIEW
// ═══════════════════════════════════════════════════════════════
function RestaurantProfileView({
  user,
  onLogout,
  insets,
}: {
  user: any;
  onLogout: () => void;
  insets: { top: number };
}) {
  const [menu, setMenu] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const router = useRouter();

  const restaurantId = user?.restaurantId || user?.id;

  const fetchData = useCallback(async () => {
    try {
      const [menuRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/restaurant/${restaurantId}/menu`),
        fetch(`${API_URL}/api/restaurant/${restaurantId}/stats`),
      ]);
      const menuData = await menuRes.json();
      const statsData = await statsRes.json();
      if (menuData.success) setMenu(menuData.data);
      if (statsData.success) setStats(statsData.stats);
    } catch (e) {
      console.log('Restaurant fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleDeleteFood = (foodId: number, foodName: string) => {
    Alert.alert('Xóa món', `Bạn có chắc muốn xóa "${foodName}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/api/restaurant/menu/${foodId}`, { method: 'DELETE' });
            setMenu(prev => prev.filter(m => m.id !== foodId));
            Alert.alert('✅', 'Đã xóa món ăn!');
          } catch (e) { Alert.alert('Lỗi', 'Không thể xóa món.'); }
        },
      },
    ]);
  };

  const handleToggleStatus = async (foodId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      await fetch(`${API_URL}/api/restaurant/menu/${foodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setMenu(prev => prev.map(m => m.id === foodId ? { ...m, status: newStatus } : m));
    } catch (e) { Alert.alert('Lỗi', 'Không thể cập nhật.'); }
  };

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'NH';

  const RESTAURANT_ORANGE = '#FF6B35';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={LIGHT_BG} />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="restaurant" size={22} color={RESTAURANT_ORANGE} />
          <Text style={styles.headerTitle}>Quản lý quán</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN} colors={[GREEN]} />}
      >
        {/* ── Restaurant Card ── */}
        <View style={[styles.avatarCard, { borderColor: RESTAURANT_ORANGE + '40' }]}>
          <View style={[styles.avatarCircle, { backgroundColor: RESTAURANT_ORANGE }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Nhà hàng'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255,107,53,0.15)' }]}>
                <Ionicons name="restaurant" size={12} color={RESTAURANT_ORANGE} />
                <Text style={[styles.badgeText, { color: RESTAURANT_ORANGE }]}>Nhà hàng</Text>
              </View>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={{ color: '#94A3B8', marginTop: 12 }}>Đang tải...</Text>
          </View>
        ) : (
          <>
            {/* ── Stats ── */}
            <SectionHeader title="Thống kê quán" />
            <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16 }}>
              <StatCard icon="cash-outline" label="Doanh thu" value={formatVND(stats?.revenue || 0)} color="#22C55E" bg="rgba(34,197,94,0.12)" />
              <StatCard icon="receipt-outline" label="Tổng đơn" value={String(stats?.totalOrders || 0)} color="#60A5FA" bg="rgba(96,165,250,0.12)" />
              <StatCard icon="fast-food-outline" label="Món ăn" value={String(stats?.totalMenuItems || 0)} color={RESTAURANT_ORANGE} bg="rgba(255,107,53,0.12)" />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 10 }}>
              <StatCard icon="hourglass-outline" label="Đơn chờ" value={String(stats?.pendingOrders || 0)} color={AMBER} bg="rgba(249,168,37,0.12)" />
              <StatCard icon="checkmark-circle-outline" label="Hoàn thành" value={String(stats?.completedOrders || 0)} color="#22C55E" bg="rgba(34,197,94,0.12)" />
            </View>

            {/* ── Order Management ── */}
            <TouchableOpacity 
              style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFF', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#F0F0F0' }}
              onPress={() => router.push('/restaurant/orders')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="receipt-outline" size={24} color="#22C55E" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#212121' }}>Quản lý đơn hàng</Text>
                  <Text style={{ fontSize: 13, color: '#757575', marginTop: 2 }}>{stats?.pendingOrders || 0} đơn đang chờ xử lý</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </TouchableOpacity>

            {/* ── Menu Management ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
              <Text style={styles.sectionTitle}>THỰC ĐƠN ({menu.length} món)</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: GREEN, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}
                onPress={() => { setEditItem(null); setAddModalVisible(true); }}
              >
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Thêm món</Text>
              </TouchableOpacity>
            </View>

            {menu.length === 0 ? (
              <View style={[styles.settingGroup, { padding: 30, alignItems: 'center' }]}>
                <Ionicons name="fast-food-outline" size={40} color="#4B5563" />
                <Text style={{ color: '#94A3B8', marginTop: 8 }}>Chưa có món ăn nào</Text>
                <Text style={{ color: '#4B5563', fontSize: 12, marginTop: 4 }}>Nhấn "Thêm món" để bắt đầu</Text>
              </View>
            ) : (
              <View style={styles.settingGroup}>
                {menu.map((item: any) => (
                  <View key={item.id} style={[styles.settingItem, { paddingVertical: 12 }]}>
                    <View style={[styles.settingLeft, { flex: 1 }]}>
                      <View style={[styles.settingIconBox, {
                        backgroundColor: item.status === 'available' ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)'
                      }]}>
                        <Ionicons
                          name={item.status === 'available' ? 'checkmark-circle' : 'close-circle'}
                          size={18}
                          color={item.status === 'available' ? '#22C55E' : '#F87171'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settingLabel} numberOfLines={1}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: RESTAURANT_ORANGE }}>
                            {Number(item.price).toLocaleString('vi-VN')}đ
                          </Text>
                          {item.category && (
                            <Text style={{ fontSize: 11, color: '#94A3B8' }}>• {item.category}</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => handleToggleStatus(item.id, item.status)}
                        style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name={item.status === 'available' ? 'eye-off-outline' : 'eye-outline'} size={16} color="#94A3B8" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { setEditItem(item); setAddModalVisible(true); }}
                        style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(96,165,250,0.12)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="create-outline" size={16} color="#60A5FA" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteFood(item.id, item.name)}
                        style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(248,113,113,0.12)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#F87171" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── Settings ── */}
        <SectionHeader title="Cài đặt quán" />
        <View style={styles.settingGroup}>
          <SettingItem icon="storefront-outline" label="Thông tin quán" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          <SettingItem icon="time-outline" label="Giờ hoạt động" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          <SettingItem icon="notifications-outline" label="Thông báo đơn mới" onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
        </View>

        <View style={[styles.settingGroup, { marginTop: 16 }]}>
          <SettingItem icon="log-out-outline" label="Đăng xuất" onPress={onLogout} danger />
        </View>

        <Text style={styles.versionText}>FoodApp Restaurant v1.0.0</Text>
      </ScrollView>

      {/* ── Add/Edit Food Modal ── */}
      <FoodFormModal
        visible={addModalVisible}
        onClose={() => { setAddModalVisible(false); setEditItem(null); }}
        editItem={editItem}
        restaurantId={restaurantId}
        onSaved={() => { setAddModalVisible(false); setEditItem(null); fetchData(); }}
      />
    </View>
  );
}

// ─── Add/Edit Food Modal ────────────────────────────────────
function FoodFormModal({
  visible,
  onClose,
  editItem,
  restaurantId,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  editItem: any;
  restaurantId: number;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '');
      setPrice(String(editItem.price || ''));
      setDesc(editItem.description || '');
    } else {
      setName(''); setPrice(''); setDesc('');
    }
  }, [editItem, visible]);

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Thiếu thông tin', 'Tên món và giá là bắt buộc.');
      return;
    }
    setSaving(true);
    try {
      if (editItem) {
        await fetch(`${API_URL}/api/restaurant/menu/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ food_name: name.trim(), price: Number(price), description: desc.trim() }),
        });
        Alert.alert('✅', 'Đã cập nhật món ăn!');
      } else {
        await fetch(`${API_URL}/api/restaurant/${restaurantId}/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ food_name: name.trim(), price: Number(price), description: desc.trim() }),
        });
        Alert.alert('✅', 'Đã thêm món mới!');
      }
      onSaved();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu món ăn.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editItem ? 'Sửa món ăn' : 'Thêm món mới'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Tên món ăn *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="VD: Phở bò tái"
            placeholderTextColor="#4B5563"
          />

          <Text style={styles.inputLabel}>Giá (VNĐ) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="VD: 45000"
            placeholderTextColor="#4B5563"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Mô tả</Text>
          <TextInput
            style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
            value={desc}
            onChangeText={setDesc}
            placeholder="Mô tả ngắn về món ăn..."
            placeholderTextColor="#4B5563"
            multiline
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name={editItem ? 'checkmark-circle' : 'add-circle'} size={20} color="#FFF" />
                <Text style={styles.saveBtnText}>{editItem ? 'Lưu thay đổi' : 'Thêm món'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PROFILE SCREEN – routes to Admin, Restaurant, or User view
// ═══════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const { user, logout, isAdmin } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  if (isAdmin) {
    return <AdminProfileView user={user} onLogout={handleLogout} insets={insets} />;
  }

  if (user?.role === 'restaurant') {
    return <RestaurantProfileView user={user} onLogout={handleLogout} insets={insets} />;
  }

  return <UserProfileView user={user} onLogout={handleLogout} insets={insets} />;
}

// ─── Shared Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: '#FFF' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#212121', letterSpacing: -0.5 },
  scroll: { flex: 1 },

  avatarCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: BORDER, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  userInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 18, fontWeight: '700', color: '#212121' },
  userEmail: { fontSize: 13, color: '#757575', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(249,168,37,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600', color: AMBER },
  editBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(61,153,112,0.12)', alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', backgroundColor: CARD_BG, marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1, borderColor: BORDER, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: BORDER },
  statNum: { fontSize: 20, fontWeight: '800', color: '#212121' },
  statLabel: { fontSize: 12, color: '#757575', marginTop: 4 },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9E9E9E', textTransform: 'uppercase', letterSpacing: 1 },

  settingGroup: { backgroundColor: CARD_BG, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#424242' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 13, color: '#9E9E9E' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: CARD_BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#212121' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#757575', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#424242' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: GREEN, marginTop: 24, paddingVertical: 14, borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  versionText: { textAlign: 'center', fontSize: 12, color: '#9E9E9E', marginTop: 24, marginBottom: 16 },
});
