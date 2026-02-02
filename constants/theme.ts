/**
 * Dark theme with yellow primary color for the attendance app
 */

import { Platform } from 'react-native';

const tintColorLight = '#FFD700'; // Yellow
const tintColorDark = '#FFD700'; // Yellow

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    textDisabled: '#9AA0A6',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional light colors
    surface: '#F8F9FA',
    card: '#FFFFFF',
    border: '#E0E0E0',
    inputBackground: '#FFFFFF',
    inputBorder: '#E0E0E0',
    inputBorderFocused: tintColorLight,
    buttonPrimary: tintColorLight,
    buttonPrimaryText: '#000000',
    buttonSecondary: '#F1F3F4',
    buttonSecondaryText: '#11181C',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    tint: tintColorDark,
    icon: '#B3B3B3',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorDark,
    // Additional dark colors
    surface: '#1E1E1E',
    card: '#2A2A2A',
    border: '#333333',
    borderLight: '#404040',
    inputBackground: '#2A2A2A',
    inputBorder: '#404040',
    inputBorderFocused: tintColorDark,
    textSecondary: '#B3B3B3',
    textDisabled: '#666666',
    buttonPrimary: tintColorDark,
    buttonPrimaryText: '#000000',
    buttonSecondary: '#2A2A2A',
    buttonSecondaryText: '#FFFFFF',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
