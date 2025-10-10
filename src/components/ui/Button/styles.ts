import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../constants';

export const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Variants
  primary: {
    backgroundColor: COLORS.primary.main,
  },
  secondary: {
    backgroundColor: COLORS.secondary.main,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary.main,
  },
  
  // Sizes
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  medium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  large: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  
  // States
  disabled: {
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
  
  // Content
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Text styles
  text: {
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  primaryText: {
    color: COLORS.text.primary,
  },
  secondaryText: {
    color: COLORS.background.primary,
  },
  outlineText: {
    color: COLORS.primary.main,
  },
  smallText: {
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  mediumText: {
    fontSize: TYPOGRAPHY.sizes.md,
  },
  largeText: {
    fontSize: TYPOGRAPHY.sizes.lg,
  },
  disabledText: {
    color: COLORS.text.disabled,
  },
  
  // Icon styles
  icon: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginRight: 0,
    marginLeft: SPACING.sm,
  },
});
