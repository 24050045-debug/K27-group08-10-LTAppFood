import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../../src/constants';

const FOODAPP_COLOR = COLORS.primary;

export default function MessagesScreen() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1A0F" />

      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="search-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}>
          {['Tất cả', 'Chưa đọc', 'Ưu đãi', 'Đơn hàng'].map((f, i) => (
            <TouchableOpacity key={i} style={[styles.filterChip, i === 0 && styles.filterChipActive]}>
              <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
        {/* Khi backend sẵn sàng: fetch /api/messages và render danh sách ở đây */}

        {/* Empty state – hiển thị khi chưa có tin nhắn */}
        <View style={styles.emptyHint}>
          <Text style={styles.emptyHintIcon}>💬</Text>
          <Text style={styles.emptyHintTitle}>Chưa có tin nhắn</Text>
          <Text style={styles.emptyHintText}>Đặt đơn đầu tiên và bắt đầu trò chuyện với FoodApp!</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0F2318' },

  header: {
    backgroundColor: '#0A1A0F',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1E3A28', alignItems: 'center', justifyContent: 'center',
  },

  filterScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: '#1E3A28', borderRadius: 20,
  },
  filterChipActive: { backgroundColor: 'rgba(34,197,94,0.20)' },
  filterText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  filterTextActive: { color: FOODAPP_COLOR, fontWeight: '700' },

  body: { flex: 1 },


  emptyHint: {
    alignItems: 'center', paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyHintIcon: { fontSize: 56, marginBottom: 16 },
  emptyHintTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  emptyHintText: { fontSize: 14, color: '#64748B', fontWeight: '500', textAlign: 'center', lineHeight: 20 },
});

