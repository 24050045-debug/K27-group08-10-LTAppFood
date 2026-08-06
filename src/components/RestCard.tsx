import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type MenuItem = {
  id: number;
  name: string;
  price: number;
};

export type Restaurant = {
  id: number;
  name: string;
  cat?: string;
  category?: string;
  emoji?: string;
  bg?: string;
  rating?: number | string;
  reviews?: number;
  time?: string;
  distance?: string;
  promo?: string | null;
  promoColor?: string;
  minOrder?: string;
  image?: string | null;
  address?: string;
  phone?: string;
  menu?: MenuItem[];
};


export default function RestCard({ r, onPress }: { r: Restaurant; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {/* Image area */}
      <View style={[styles.cardImg, { backgroundColor: r.bg || '#F5F5F5' }]}>
        <Text style={{ fontSize: 52 }}>{r.emoji || '🍽️'}</Text>
        {r.promo ? (
          <View style={[styles.promoBadge, { backgroundColor: r.promoColor || '#E53935' }]}>
            <Text style={styles.promoText}>{r.promo}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.heartBtn}>
          <Ionicons name="heart-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Info area */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
        <Text style={styles.cardCat}>{r.cat || r.category || 'Đồ ăn'}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F9A825" />
            <Text style={styles.ratingText}>{r.rating || '4.5'}</Text>
            {r.reviews !== undefined && <Text style={styles.reviewCount}>({r.reviews})</Text>}
          </View>
          {r.time ? (
            <>
              <Text style={styles.metaDot}> · </Text>
              <Ionicons name="time-outline" size={12} color="#9E9E9E" />
              <Text style={styles.metaTime}> {r.time}</Text>
            </>
          ) : null}
          {r.distance ? (
            <>
              <Text style={styles.metaDot}> · </Text>
              <Ionicons name="location-outline" size={12} color="#9E9E9E" />
              <Text style={styles.metaTime}> {r.distance}</Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 14,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImg: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  promoBadge: {
    position: 'absolute', bottom: 10, left: 12,
    borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4,
  },
  promoText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  heartBtn: {
    position: 'absolute', top: 10, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { padding: 14 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#212121', marginBottom: 3 },
  cardCat: { fontSize: 12, color: '#9E9E9E', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#212121' },
  reviewCount: { fontSize: 11, color: '#9E9E9E' },
  metaDot: { color: '#BDBDBD', fontSize: 12 },
  metaTime: { fontSize: 12, color: '#9E9E9E' },
});
