export const COLORS = {
  primary: {
    main: '#1c348e',
    light: '#4d5db5',
    dark: '#0f1a4c',
  },
  secondary: {
    main: '#e5c228',
    light: '#f0d966',
    dark: '#b8971c',
  },
  background: {
    primary: '#f0f0f0',
    secondary: '#fff',
    card: '#fff',
  },
  text: {
    primary: '#333',
    secondary: '#666',
    disabled: '#999',
  },
  status: {
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8',
  },
  border: {
    light: '#ddd',
    medium: '#ccc',
    dark: '#bbb',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
} as const;
