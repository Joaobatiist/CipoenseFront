import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../constants';

export const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  input: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  default: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  inputError: {
    borderColor: COLORS.status.error,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.status.error,
    marginTop: SPACING.xs,
  },
});
