import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  fps: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = __DEV__,
  onMetricsUpdate,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
  });
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;

    const measurePerformance = () => {
      const now = Date.now();
      const delta = now - lastTime.current;
      
      frameCount.current++;
      
      if (delta >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / delta);
        
        setMetrics(prev => {
          const newMetrics = {
            ...prev,
            fps,
          };
          
          if (onMetricsUpdate) {
            onMetricsUpdate(newMetrics);
          }
          
          return newMetrics;
        });
        
        frameCount.current = 0;
        lastTime.current = now;
      }
    };

    const animationFrame = requestAnimationFrame(measurePerformance);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled, onMetricsUpdate]);

  // Measure render time
  useEffect(() => {
    if (!enabled) return;
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100,
      }));
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.metricText}>
        FPS: {metrics.fps}
      </Text>
      <Text style={styles.metricText}>
        Render: {metrics.renderTime}ms
      </Text>
      {metrics.memoryUsage && (
        <Text style={styles.metricText}>
          Memory: {Math.round(metrics.memoryUsage / 1024 / 1024)}MB
        </Text>
      )}
    </View>
  );
};

// Performance optimization utilities
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedCallback = (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay) as unknown as NodeJS.Timeout;
  };
  
  return debouncedCallback as T;
};

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef<number>(Date.now());
  
  const throttledCallback = (...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  };
  
  return throttledCallback as T;
};

export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return React.useCallback(callback, deps);
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
  });

  const startTiming = useRef<number | null>(null);
  const endTiming = useRef<number | null>(null);

  const startMeasure = () => {
    startTiming.current = performance.now();
  };

  const endMeasure = () => {
    if (startTiming.current) {
      endTiming.current = performance.now();
      const duration = endTiming.current - startTiming.current;
      
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(duration * 100) / 100,
      }));
    }
  };

  return {
    metrics,
    startMeasure,
    endMeasure,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
  },
  metricText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default PerformanceMonitor;
