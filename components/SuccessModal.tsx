import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type Props = {
  visible: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
};

const SuccessModal: React.FC<Props> = ({
  visible,
  title = 'Success',
  message,
  confirmText = 'OK',
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'dark'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.headerRow}>
            <View style={[styles.iconWrap, { backgroundColor: colors.tint }]}>
              <MaterialIcons name="check" size={18} color={colors.buttonPrimaryText} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>

          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.buttonPrimary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>{confirmText}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    alignItems: 'flex-end',
  },
  button: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});

export default SuccessModal;
