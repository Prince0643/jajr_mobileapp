import { ForgotPasswordDialog } from '@/components';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { ApiService } from '@/services/api';
import { procurementService } from '@/services/procurementService';
import { ErrorHandler, SessionManager } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
interface LoginFormData {
  Key: string;
  identifier: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>();

  useEffect(() => {
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    try {
      const shouldAutoLogin = await SessionManager.shouldAutoLogin();
      if (shouldAutoLogin) {
        router.replace('/(tabs)/dashboard');
      }
    } catch (error) {
      console.error('Auto-login check failed:', error);
    }
  };

  
  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    
    console.log('Login data being sent:', data);
    
    try {
      // Step 1: Login to Attendance System (PHP)
      const response = await ApiService.login({
        Key: data.Key || data.identifier,
        identifier: data.identifier,
        password: data.password,
        branch_name: 'Sto. Tomas',
      });
      
      if (response.success && response.user_data) {
        await SessionManager.saveUser(response.user_data, rememberMe);
        
        // Step 2: Auto-login to Procurement System (Node.js)
        try {
          const employeeNo = response.user_data.employee_no || response.user_data.employee_code || data.identifier;
          const procurementResponse = await procurementService.login(employeeNo, data.password);
          console.log('Procurement auto-login successful:', procurementResponse.user.employee_no);
        } catch (procurementError) {
          // Log but don't fail - procurement features will be disabled
          console.log('Procurement auto-login failed (optional):', procurementError);
        }
        
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = () => {
    setShowForgotPassword(true);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Image
            source={require('../jajr-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>JAJR Login</Text>
          
          <Controller
            control={control}
            name="identifier"
            rules={{ 
              required: 'Employee ID is required',
              minLength: { value: 3, message: 'Employee ID must be at least 3 characters' }
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.identifier && styles.inputError]}
                placeholder="Employee ID"
                placeholderTextColor={colors.textSecondary}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}
          />
          {errors.identifier && (
            <Text style={styles.errorText}>{errors.identifier.message}</Text>
          )}

          <Controller
            control={control}
            name="password"
            rules={{ 
              required: 'Password is required',
              minLength: { value: 4, message: 'Password must be at least 4 characters' }
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.passwordRow, errors.password && styles.inputError]}>
                <TextInput
                  key={showPassword ? 'pw_visible' : 'pw_hidden'}
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkboxInner, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Remember Me</Text>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSubmit(onLogin)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.buttonPrimaryText} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPasswordButton} onPress={onForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.kioskButton} 
            onPress={() => router.push('/kiosk')}
          >
            <Ionicons name="scan-outline" size={20} color={colors.tint} style={styles.kioskIcon} />
            <Text style={styles.kioskButtonText}>Switch to Kiosk Mode</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <ForgotPasswordDialog
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: Spacing.lg,
    },
    formContainer: {
      backgroundColor: colors.card,
      padding: Spacing.xl,
      borderRadius: BorderRadius.lg,
      ...Shadows.lg,
    },
    logo: {
      width: '100%',
      height: 140,
      marginBottom: Spacing.md,
    },
    title: {
      ...Typography.h2,
      textAlign: 'center',
      marginBottom: Spacing.xl,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      fontSize: Typography.body.fontSize,
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
      backgroundColor: colors.inputBackground,
    },
    passwordInput: {
      flex: 1,
      padding: Spacing.md,
      fontSize: Typography.body.fontSize,
      color: colors.text,
    },
    eyeButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    inputError: {
      borderColor: '#F44336',
    },
    errorText: {
      color: '#F44336',
      fontSize: Typography.caption.fontSize,
      marginBottom: Spacing.sm,
    },
    pickerContainer: {
      marginBottom: Spacing.sm,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownText: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
    },
    dropdownPlaceholder: {
      ...Typography.body,
      color: colors.textSecondary,
      flex: 1,
    },
    dropdownIcon: {
      ...Typography.body,
      color: colors.textSecondary,
      fontSize: 16,
    },
    dropdownList: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.md,
      zIndex: 1000,
    },
    dropdownItem: {
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dropdownItemText: {
      ...Typography.body,
      color: colors.text,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    checkbox: {
      marginRight: Spacing.sm,
    },
    checkboxInner: {
      width: 20,
      height: 20,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
    },
    checkboxChecked: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    checkmark: {
      color: '#000000',
      fontSize: 12,
      fontWeight: 'bold',
    },
    checkboxLabel: {
      fontSize: Typography.body.fontSize,
      color: colors.text,
    },
    loginButton: {
      backgroundColor: colors.tint,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      marginBottom: Spacing.md,
      ...Shadows.md,
    },
    loginButtonDisabled: {
      backgroundColor: colors.textDisabled,
      shadowOpacity: 0,
      elevation: 0,
    },
    loginButtonText: {
      color: colors.buttonPrimaryText,
      fontSize: Typography.body.fontSize,
      fontWeight: 'bold',
    },
    forgotPasswordButton: {
      alignItems: 'center',
    },
    forgotPasswordText: {
      color: colors.tint,
      fontSize: Typography.caption.fontSize,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.lg,
    },
    kioskButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.tint,
      borderRadius: BorderRadius.md,
      backgroundColor: 'transparent',
    },
    kioskIcon: {
      marginRight: Spacing.sm,
    },
    kioskButtonText: {
      color: colors.tint,
      fontSize: Typography.body.fontSize,
      fontWeight: '600',
    },
  });

export default LoginScreen;
