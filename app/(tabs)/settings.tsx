import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SessionManager } from '@/utils';

const SettingsScreen: React.FC = () => {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await SessionManager.clearSession();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      icon: 'person-outline',
      title: 'Profile',
      subtitle: 'Manage your profile information',
      onPress: () => Alert.alert('Profile', 'Profile management coming soon'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Configure notification preferences',
      onPress: () => Alert.alert('Notifications', 'Notification settings coming soon'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help with the app',
      onPress: () => Alert.alert('Help', 'Help section coming soon'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => Alert.alert('About', 'Attendance System v1.0\n\nBuilt with React Native & Expo'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.settingsContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingItem}
              onPress={option.onPress}
            >
              <View style={styles.settingLeft}>
                <Ionicons name={option.icon as any} size={24} color="#007AFF" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{option.title}</Text>
                  <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
});

export default SettingsScreen;
