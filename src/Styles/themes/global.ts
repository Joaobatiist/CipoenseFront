import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../constants';

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  
  // Cards
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  

  subtitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  bodyText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
    lineHeight: TYPOGRAPHY.sizes.md * 1.5,
  },
  caption: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text.secondary,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary.main,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text.primary,
  },
  
  // Form Elements
  input: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    marginBottom: SPACING.md,
  },
  inputFocused: {
    borderColor: COLORS.primary.main,
  },
  inputError: {
    borderColor: COLORS.status.error,
  },
  
  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Spacing
  marginTop: {
    marginTop: SPACING.md,
  },
  marginBottom: {
    marginBottom: SPACING.md,
  },
  paddingHorizontal: {
    paddingHorizontal: SPACING.md,
  },
  paddingVertical: {
    paddingVertical: SPACING.md,
  },
});
