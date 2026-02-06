import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';

export default function TabLayout() {
  const { resolvedTheme } = useThemeMode();
  const themeColors = Colors[resolvedTheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: themeColors.card,
          borderTopColor: themeColors.border,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="time" color={color} />,
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
