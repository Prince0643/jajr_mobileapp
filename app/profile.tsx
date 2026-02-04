import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { ErrorHandler, SessionManager } from '@/utils';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const colors = Colors.dark;

  const [isLoading, setIsLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [employeeCode, setEmployeeCode] = useState<string>('');

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    (async () => {
      const user = await SessionManager.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      setEmployeeId(user.userId);
      setEmployeeCode(user.employeeCode);
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    })();
  }, [router]);

  const validate = (): string | null => {
    if (!employeeId) return 'Missing employee session. Please log in again.';

    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return 'Invalid email format.';
    }

    const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmNewPassword);
    if (wantsPasswordChange) {
      if (!currentPassword) return 'Current password is required.';
      if (!newPassword) return 'New password is required.';
      if (newPassword.length < 4) return 'New password must be at least 4 characters.';
      if (newPassword !== confirmNewPassword) return 'New passwords do not match.';
    }

    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation', err);
      return;
    }

    if (!employeeId) return;

    setIsLoading(true);
    try {
      const payload: any = {
        employee_id: employeeId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      };

      if (middleName.trim()) payload.middle_name = middleName.trim();
      if (email.trim()) payload.email = email.trim();

      const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmNewPassword);
      if (wantsPasswordChange) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await ApiService.updateProfile(payload);
      if (!res?.success) {
        Alert.alert('Update failed', res?.message || 'Unknown error');
        return;
      }

      const session = await SessionManager.getUser();
      const rememberMe = session?.rememberMe ?? false;

      const updatedUser = res?.user_data;
      if (updatedUser?.id) {
        await SessionManager.saveUser(
          {
            id: updatedUser.id,
            employee_code: updatedUser.employee_code || employeeCode,
            first_name: updatedUser.first_name || firstName.trim(),
            last_name: updatedUser.last_name || lastName.trim(),
          },
          rememberMe
        );
      } else {
        await SessionManager.saveUser(
          {
            id: employeeId,
            employee_code: employeeCode,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
          rememberMe
        );
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      Alert.alert('Success', res?.message || 'Profile updated successfully');
    } catch (error) {
      const info = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(info));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Profile</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Employee Code</Text>
              <Text style={styles.value}>{employeeCode}</Text>
            </View>

            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor={colors.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
            />

            <Text style={styles.label}>Middle Name (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Middle name"
              placeholderTextColor={colors.textSecondary}
              value={middleName}
              onChangeText={setMiddleName}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor={colors.textSecondary}
              value={lastName}
              onChangeText={setLastName}
            />

            <Text style={styles.label}>Email (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Change Password (optional)</Text>

            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor={colors.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textSecondary}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={onSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.buttonPrimaryText} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isLoading}>
            <Text style={styles.cancelButtonText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xxl,
    },
    title: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.md,
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    label: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    value: {
      ...Typography.body,
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      fontSize: Typography.body.fontSize,
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.tint,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      ...Shadows.md,
      marginBottom: Spacing.md,
    },
    saveButtonDisabled: {
      backgroundColor: colors.textDisabled,
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonText: {
      color: colors.buttonPrimaryText,
      fontSize: Typography.body.fontSize,
      fontWeight: 'bold',
    },
    cancelButton: {
      backgroundColor: colors.card,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: Typography.body.fontSize,
      fontWeight: '600',
    },
  });

export default ProfileScreen;
