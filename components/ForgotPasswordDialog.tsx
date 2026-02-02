import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ApiService } from '@/services/api';
import ErrorHandler from '@/utils/errorHandler';

interface ForgotPasswordDialogProps {
  visible: boolean;
  onClose: () => void;
}

const ForgotPasswordDialog: React.FC<ForgotPasswordDialogProps> = ({ visible, onClose }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      // Check if email exists (mock implementation)
      // In real app, you'd call ApiService.checkEmailExists(email)
      const emailExists = await mockCheckEmailExists(email);
      
      if (emailExists) {
        setStep('password');
      } else {
        Alert.alert('Error', 'Email address not found');
      }
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Password cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      // Reset password (mock implementation)
      // In real app, you'd call ApiService.resetPassword(email, newPassword)
      await mockResetPassword(email, newPassword);
      
      Alert.alert('Success', 'Password updated successfully');
      handleClose();
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setNewPassword('');
    setStep('email');
    onClose();
  };

  // Mock functions - replace with actual API calls
  const mockCheckEmailExists = async (email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock validation - in real app, this would check against your database
    return email.includes('@');
  };

  const mockResetPassword = async (email: string, password: string): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock password reset - in real app, this would update the database
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>
            {step === 'email' ? 'Reset Password' : 'New Password'}
          </Text>

          {step === 'email' ? (
            <>
              <Text style={styles.subtitle}>Enter your email address</Text>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleEmailSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Next</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>Enter your new password</Text>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setStep('email')}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handlePasswordSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordDialog;
