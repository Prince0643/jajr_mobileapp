import { ForgotPasswordDialog } from '@/components';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { ErrorHandler, SessionManager } from '@/utils';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
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
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'dark'];

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
    
    // Debug: Log the data being sent
    console.log('Login data being sent:', data);
    
    try {
      const response = await ApiService.login({
        Key: data.Key || data.identifier,
        identifier: data.identifier,
        password: data.password,
        branch_name: 'Sto. Tomas',
      });
      
      if (response.success && response.user_data) {
        await SessionManager.saveUser(response.user_data, rememberMe);
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
      style={[styles.container, { backgroundColor: Colors.dark.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Attendance Login</Text>
          
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
                placeholderTextColor={Colors.dark.textSecondary}
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
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                placeholderTextColor={Colors.dark.textSecondary}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
                autoCapitalize="none"
              />
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
              <ActivityIndicator color={Colors.dark.buttonPrimaryText} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPasswordButton} onPress={onForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  formContainer: {
    backgroundColor: Colors.dark.card,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    color: Colors.dark.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.dark.inputBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    fontSize: Typography.body.fontSize,
    backgroundColor: Colors.dark.inputBackground,
    color: Colors.dark.text,
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
    color: Colors.dark.text,
    flex: 1,
  },
  dropdownPlaceholder: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  dropdownIcon: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  dropdownList: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    ...Shadows.md,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  dropdownItemText: {
    ...Typography.body,
    color: Colors.dark.text,
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
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.inputBackground,
  },
  checkboxChecked: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  checkmark: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: Typography.body.fontSize,
    color: Colors.dark.text,
  },
  loginButton: {
    backgroundColor: Colors.dark.tint,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.dark.textDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: Colors.dark.buttonPrimaryText,
    fontSize: Typography.body.fontSize,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: Colors.dark.tint,
    fontSize: Typography.caption.fontSize,
  },
});

export default LoginScreen;
