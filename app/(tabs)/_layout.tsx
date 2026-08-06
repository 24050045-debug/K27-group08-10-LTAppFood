import { Ionicons } from '@expo/vector-icons';
import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '../../components/haptic-tab';
import { useAuth } from '../../src/context/AuthContext';
import ChatBubble from '../../src/components/ChatBubble';
import { COLORS } from '../../src/constants/theme';

const FOODAPP_COLOR = COLORS.primary;


function TabIcon({ name, color }: { name: any; color: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={26} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: FOODAPP_COLOR,
          tabBarInactiveTintColor: '#4B5563',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#0A1A0F',
            borderTopWidth: 1,
            borderTopColor: '#1E3A28',
            height: Platform.OS === 'ios' ? 95 : 72,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            paddingTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 12,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 3 },
        }}
      >
        {/* ── 4 visible tabs ── */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Đặt xe / Ăn',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'compass' : 'compass-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payment"
          options={{
            title: 'Thanh toán',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: 'Hoạt động',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Hồ sơ',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={focused ? 'person' : 'person-outline'} color={color} />
            ),
          }}
        />

        {/* ── Hidden screens (no tab bar entry) ── */}
        <Tabs.Screen name="messages"   options={{ href: null }} />
      </Tabs>

      {/* Floating chat bubble — above all tabs */}
      <ChatBubble />
    </View>
  );
}
