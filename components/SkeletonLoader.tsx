import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: any;
  borderRadius?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  style,
  borderRadius = 4,
}) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const shimmerColor = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e0e0e0', '#f0f0f0', '#e0e0e0'],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: shimmerColor,
        },
        style,
      ]}
    />
  );
};

// Predefined skeleton components
export const EmployeeSkeleton: React.FC = () => (
  <View style={styles.employeeSkeleton}>
    <SkeletonLoader width={40} height={40} borderRadius={20} />
    <View style={styles.employeeInfo}>
      <SkeletonLoader width="60%" height={16} style={styles.nameSkeleton} />
      <SkeletonLoader width="40%" height={12} style={styles.codeSkeleton} />
    </View>
    <SkeletonLoader width={80} height={24} borderRadius={12} />
  </View>
);

export const BranchSkeleton: React.FC = () => (
  <View style={styles.branchSkeleton}>
    <View style={styles.branchHeader}>
      <SkeletonLoader width="70%" height={18} style={styles.branchName} />
      <SkeletonLoader width="30%" height={14} />
    </View>
    <EmployeeSkeleton />
    <EmployeeSkeleton />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  employeeSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  employeeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  nameSkeleton: {
    marginBottom: 4,
  },
  codeSkeleton: {},
  branchSkeleton: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  branchName: {
    marginBottom: 4,
  },
});

export default SkeletonLoader;
