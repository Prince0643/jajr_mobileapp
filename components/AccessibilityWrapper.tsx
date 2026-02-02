import React from 'react';
import {
    AccessibilityInfo,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AccessibilityWrapperProps {
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessible?: boolean;
  onAccessibilityTap?: () => void;
}

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  style?: any;
}

interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: any;
}

export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  accessible = true,
  onAccessibilityTap,
}) => {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole as any}
    >
      {children}
    </View>
  );
};

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.accessibleButton, disabled && styles.disabledButton, style]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint || `Double tap to ${title.toLowerCase()}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.buttonText, disabled && styles.disabledText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel} accessible={false}>
        {label}
      </Text>
      <TextInput
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        accessible={true}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint || `Enter ${label.toLowerCase()}`}
        accessibilityRole={secureTextEntry ? ("password" as any) : ("textbox" as any)}
      />
    </View>
  );
};

// Accessibility utilities
export const announceForAccessibility = (message: string) => {
  if (Platform.OS === 'ios') {
    AccessibilityInfo.announceForAccessibility(message);
  } else {
    // Android alternative
    AccessibilityInfo.isScreenReaderEnabled().then(enabled => {
      if (enabled) {
        // For Android, you might need to use a different approach
        console.log('Screen reader announcement:', message);
      }
    });
  }
};

export const focusElement = (elementRef: any) => {
  if (elementRef && elementRef.current) {
    elementRef.current.focus();
  }
};

// Custom hook for accessibility
export const useAccessibility = () => {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = React.useState(false);

  React.useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled: boolean) => {
        setIsScreenReaderEnabled(enabled);
      }
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  const announce = (message: string) => {
    announceForAccessibility(message);
  };

  return {
    isScreenReaderEnabled,
    announce,
  };
};

// Accessibility constants
export const ACCESSIBILITY_LABELS = {
  login: 'Login button',
  logout: 'Logout button',
  markPresent: 'Mark employee as present',
  markAbsent: 'Mark employee as absent',
  expandBranch: 'Expand branch to view employees',
  collapseBranch: 'Collapse branch list',
  syncNow: 'Sync attendance data now',
  refresh: 'Refresh data',
  settings: 'Settings',
  attendance: 'Attendance',
  salary: 'Salary',
  procurement: 'Procurement',
};

export const ACCESSIBILITY_HINTS = {
  login: 'Double tap to login to your account',
  logout: 'Double tap to logout from your account',
  markPresent: 'Double tap to mark this employee as present',
  markAbsent: 'Double tap to mark this employee as absent',
  expandBranch: 'Double tap to expand and view employees in this branch',
  collapseBranch: 'Double tap to collapse the employee list',
  syncNow: 'Double tap to synchronize attendance data with server',
  refresh: 'Double tap to refresh the data from server',
  settings: 'Double tap to open settings menu',
  attendance: 'Double tap to go to attendance screen',
  salary: 'Double tap to go to salary screen',
  procurement: 'Double tap to go to procurement screen',
};

const styles = StyleSheet.create({
  accessibleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#999',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 48,
  },
});

export default AccessibilityWrapper;
