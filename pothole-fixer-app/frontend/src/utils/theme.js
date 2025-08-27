import { DefaultTheme } from 'react-native-paper';

export const colors = {
  primary: '#1e3a8a',
  primaryLight: '#3b82f6',
  primaryDark: '#1e40af',
  secondary: '#f59e0b',
  secondaryLight: '#fbbf24',
  secondaryDark: '#d97706',
  accent: '#10b981',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  error: '#ef4444',
  errorLight: '#f87171',
  warning: '#f59e0b',
  success: '#10b981',
  info: '#3b82f6',
  
  // Status colors
  notFixed: '#ef4444', // Red
  underProgress: '#f59e0b', // Yellow
  fixed: '#10b981', // Green
  
  // Road type colors
  highway: '#dc2626',
  mainRoad: '#ea580c',
  innerRoad: '#ca8a04',
  alley: '#65a30d',
  
  // Gradients
  primaryGradient: ['#1e3a8a', '#3b82f6'],
  secondaryGradient: ['#f59e0b', '#fbbf24'],
  dangerGradient: ['#ef4444', '#f87171'],
  successGradient: ['#10b981', '#34d399'],
  
  // Dark mode colors
  dark: {
    primary: '#3b82f6',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    error: colors.error,
    notification: colors.secondary,
  },
  roundness: borderRadius.md,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
};