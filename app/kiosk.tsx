import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface QRResult {
  success: boolean;
  message: string;
  already_in?: boolean;
  time_in?: string;
  time_out?: string;
}

export default function KioskScreen(): React.ReactElement {
  const router = useRouter();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QRResult | null>(null);

  const scanCooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanLockRef = useRef(false);
  const lastScanAtRef = useRef(0);
  const SCAN_COOLDOWN_MS = 2000;

  useEffect(() => {
    return () => {
      if (scanCooldownTimeoutRef.current) {
        clearTimeout(scanCooldownTimeoutRef.current);
      }
    };
  }, []);

  const parseEmployeeFromQR = useCallback((text: string): { empId: number; empCode: string } | null => {
    try {
      // Parse URL format: https://.../select_employee.php?auto_timein=1&emp_id=123&emp_code=ABC
      if (text.includes('emp_id=')) {
        const url = new URL(text);
        const params = url.searchParams;
        const empId = parseInt(params.get('emp_id') || '0', 10);
        const empCode = params.get('emp_code') || '';
        if (empId > 0) {
          return { empId, empCode };
        }
      }

      // Try to extract from plain text as employee code
      const cleanText = text.trim();
      if (cleanText.length > 0 && /^[A-Za-z0-9_-]+$/.test(cleanText)) {
        return { empId: 0, empCode: cleanText };
      }

      return null;
    } catch {
      // If URL parsing fails, treat as plain text
      const cleanText = text.trim();
      if (cleanText.length > 0) {
        return { empId: 0, empCode: cleanText };
      }
      return null;
    }
  }, []);

  const processClockIn = useCallback(async (empId: number, empCode: string): Promise<QRResult> => {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}qr_clock_api.php`;

    const formData = new FormData();
    formData.append('action', 'in');
    formData.append('employee_id', String(empId));
    formData.append('employee_code', empCode);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();

    if (data.already_in) {
      // Auto clock-out if already clocked in
      return processClockOut(empId, empCode);
    }

    return data as QRResult;
  }, []);

  const processClockOut = useCallback(async (empId: number, empCode: string): Promise<QRResult> => {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}qr_clock_api.php`;

    const formData = new FormData();
    formData.append('action', 'out');
    formData.append('employee_id', String(empId));
    formData.append('employee_code', empCode);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    return response.json() as Promise<QRResult>;
  }, []);

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    const now = Date.now();
    if (scanLockRef.current || scanned || loading) return;
    if (now - lastScanAtRef.current < SCAN_COOLDOWN_MS) return;

    scanLockRef.current = true;
    lastScanAtRef.current = now;

    if (scanCooldownTimeoutRef.current) {
      clearTimeout(scanCooldownTimeoutRef.current);
    }
    scanCooldownTimeoutRef.current = setTimeout(() => {
      scanLockRef.current = false;
    }, SCAN_COOLDOWN_MS);

    setScanned(true);
    setLoading(true);

    try {
      const employeeData = parseEmployeeFromQR(data);

      if (!employeeData || employeeData.empId === 0) {
        setResult({
          success: false,
          message: 'Invalid QR code format',
        });
        setLoading(false);
        return;
      }

      const qrResult = await processClockIn(employeeData.empId, employeeData.empCode);
      setResult(qrResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process QR code',
      });
    } finally {
      setLoading(false);
    }
  }, [scanned, loading, parseEmployeeFromQR, processClockIn]);

  const handleScanAnother = useCallback(() => {
    setScanned(false);
    setResult(null);
  }, []);

  const handleBackToLogin = useCallback(() => {
    router.replace('/login');
  }, [router]);

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan QR codes for clock-in/out
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kiosk Mode</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Camera or Result */}
      <View style={styles.content}>
        {!scanned ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={handleBarCodeScanned}
            />

            {/* QR Frame Overlay */}
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.qrFrame}>
                  <View style={[styles.corner, styles.cornerTopLeft]} />
                  <View style={[styles.corner, styles.cornerTopRight]} />
                  <View style={[styles.corner, styles.cornerBottomLeft]} />
                  <View style={[styles.corner, styles.cornerBottomRight]} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.instructionText}>
                  Scan employee QR code to clock in/out
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : result ? (
              <View style={styles.resultContent}>
                <View
                  style={[
                    styles.resultIconContainer,
                    { backgroundColor: result.success ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  <Ionicons
                    name={result.success ? 'checkmark' : 'close'}
                    size={64}
                    color="#FFFFFF"
                  />
                </View>
                <Text
                  style={[
                    styles.resultMessage,
                    { color: result.success ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  {result.message}
                </Text>

                <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAnother}>
                  <Ionicons name="scan-outline" size={20} color={colors.tint} />
                  <Text style={styles.scanAgainText}>Scan Another</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: (typeof Colors)[keyof typeof Colors]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backIconButton: {
      padding: Spacing.sm,
    },
    headerTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    headerPlaceholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    cameraContainer: {
      flex: 1,
      position: 'relative',
    },
    camera: {
      flex: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      flexDirection: 'column',
    },
    overlayTop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    overlayMiddle: {
      flexDirection: 'row',
      height: width * 0.7,
    },
    overlaySide: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    qrFrame: {
      width: width * 0.7,
      height: width * 0.7,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderColor: colors.tint,
      borderWidth: 4,
    },
    cornerTopLeft: {
      top: 0,
      left: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
    },
    cornerTopRight: {
      top: 0,
      right: 0,
      borderLeftWidth: 0,
      borderBottomWidth: 0,
    },
    cornerBottomLeft: {
      bottom: 0,
      left: 0,
      borderRightWidth: 0,
      borderTopWidth: 0,
    },
    cornerBottomRight: {
      bottom: 0,
      right: 0,
      borderLeftWidth: 0,
      borderTopWidth: 0,
    },
    overlayBottom: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: Spacing.xl,
    },
    instructionText: {
      color: '#FFFFFF',
      fontSize: Typography.body.fontSize,
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
    },
    resultContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...Typography.body,
      color: colors.text,
      marginTop: Spacing.md,
    },
    resultContent: {
      alignItems: 'center',
      width: '100%',
    },
    resultIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    resultMessage: {
      ...Typography.h3,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    scanAgainButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderWidth: 1,
      borderColor: colors.tint,
      borderRadius: BorderRadius.md,
    },
    scanAgainText: {
      color: colors.tint,
      fontSize: Typography.body.fontSize,
      fontWeight: '600',
      marginLeft: Spacing.sm,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    permissionTitle: {
      ...Typography.h3,
      color: colors.text,
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    permissionText: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    permissionButton: {
      backgroundColor: colors.tint,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      ...Shadows.md,
    },
    permissionButtonText: {
      color: colors.buttonPrimaryText,
      fontSize: Typography.body.fontSize,
      fontWeight: 'bold',
    },
    backButton: {
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
    },
    backButtonText: {
      color: colors.textSecondary,
      fontSize: Typography.body.fontSize,
    },
  });
