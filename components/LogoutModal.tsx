import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const LogoutModal: React.FC<Props> = ({
  visible,
  title = 'Logout',
  message = 'Are you sure you want to logout?',
  cancelText = 'Cancel',
  confirmText = 'Logout',
  onCancel,
  onConfirm,
}) => {
  const colors = Colors.dark;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.headerRow}>
            <View style={[styles.iconWrap, { backgroundColor: '#FF3B30' }]}>
              <MaterialIcons name="logout" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>

          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: colors.buttonSecondary,
                  borderColor: colors.borderLight || colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.secondaryText, { color: colors.buttonSecondaryText }]}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.destructiveButton,
                { backgroundColor: '#FF3B30', opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.destructiveText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h3,
  },
  message: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  actions: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  secondaryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  secondaryText: {
    ...Typography.body,
    fontWeight: '600',
  },
  destructiveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  destructiveText: {
    ...Typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default LogoutModal;
