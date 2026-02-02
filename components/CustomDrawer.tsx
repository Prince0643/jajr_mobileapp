import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { SessionManager } from '@/utils';

interface CustomDrawerProps extends DrawerContentComponentProps {
  userName?: string;
  userCode?: string;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({
  userName,
  userCode,
  ...props
}) => {
  const handleLogout = async () => {
    await SessionManager.clearSession();
    // Navigation will be handled by the parent component
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName || 'User'}</Text>
            <Text style={styles.userCode}>{userCode || 'EMP001'}</Text>
          </View>
        </View>
      </View>

      {/* Drawer Items */}
      <DrawerContentScrollView 
        {...props}
        contentContainerStyle={styles.drawerContent}
      >
        <DrawerItemList {...props} />
        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Attendance System v1.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userCode: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  drawerContent: {
    flex: 1,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default CustomDrawer;
