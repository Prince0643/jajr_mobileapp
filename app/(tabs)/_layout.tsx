import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  // Force dark mode
  const isDarkMode = true;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.tint,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors.dark.card,
          borderTopColor: Colors.dark.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="salary"
        options={{
          title: 'Payslip',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="card" color={color} />,
        }}
      />
      <Tabs.Screen
        name="procurement"
        options={{
          title: 'Procurement',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
