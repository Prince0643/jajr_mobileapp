import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import React, { useMemo } from 'react';
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
  color,
}) => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const finalColor = useMemo(() => color || colors.tint, [color, colors.tint]);

  return (
    <View style={styles.container} testID="loading-container">
      <ActivityIndicator 
        size={size} 
        color={finalColor} 
        testID="activity-indicator"
      />
      {message && (
        <Text style={[styles.message, { color: finalColor }]} testID="loading-message">
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
