import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon ? (
          <Text style={styles.icon}>{icon}</Text>
        ) : (
          <View style={styles.defaultIcon}>
            <Text style={styles.defaultIconText}>📋</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.title}>{title}</Text>
      
      {message && <Text style={styles.message}>{message}</Text>}
      
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
  },
  defaultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EmptyState;
