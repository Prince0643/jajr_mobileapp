import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
  color = '#007AFF',
}) => {
  return (
    <View style={styles.container} testID="loading-container">
      <ActivityIndicator 
        size={size} 
        color={color} 
        testID="activity-indicator"
      />
      {message && (
        <Text style={[styles.message, { color }]} testID="loading-message">
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingState;
