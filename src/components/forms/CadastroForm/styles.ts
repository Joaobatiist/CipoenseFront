import { Platform, StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '../../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  header: {
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: Platform.select({
      ios: 60, // iPhone notch + status bar
      android: 50, // Android status bar
      web: 20, // Web header
      default: 50,
    }),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.secondary.main,
    minHeight: Platform.select({
      ios: 100,
      android: 90,
      web: 70,
      default: 90,
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          transform: 'scale(1.05)',
        },
      },
    }),
  },
  
  backButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ scale: 0.95 }],
  },
  
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.sm,
  },
  
  headerTitle: {
    color: '#ffffff',
    fontSize: Platform.select({
      ios: TYPOGRAPHY.sizes.xl,
      android: TYPOGRAPHY.sizes.lg,
      web: TYPOGRAPHY.sizes.xxl,
      default: TYPOGRAPHY.sizes.lg,
    }),
    fontWeight: TYPOGRAPHY.weights.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  headerSpacer: {
    width: 44, // Same width as back button for centering
  },
  
  headerLoadingIndicator: {
    marginTop: 4,
  },
  
  scrollContainer: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  
  logo: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    resizeMode: 'contain',
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary.main,
    marginTop: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  requiredIndicator: {
    color: COLORS.status.error,
  },
  
  input: {
    width: '100%',
    height: 50,
    borderColor: COLORS.primary.main,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text.primary,
  },
  
  inputFocused: {
    borderColor: COLORS.secondary.main,
    borderWidth: 2,
    elevation: 2,
    shadowColor: COLORS.primary.main,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  inputError: {
    borderColor: COLORS.status.error,
    borderWidth: 2,
  },
  
  dropdown: {
    borderColor: COLORS.primary.main,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.secondary,
    minHeight: 50,
  },
  
  dropdownContainer: {
    borderColor: COLORS.primary.main,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.background.secondary,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  dropdownFocused: {
    borderColor: COLORS.secondary.main,
    borderWidth: 2,
  },
  
  errorText: {
    color: COLORS.status.error,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 4,
    marginLeft: 4,
  },
  
  submitButton: {
    backgroundColor: COLORS.primary.main,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.secondary.main,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  
  submitButtonDisabled: {
    backgroundColor: COLORS.text.disabled,
    borderColor: COLORS.text.disabled,
  },
  
  submitButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  
  submitButtonTextDisabled: {
    color: COLORS.text.secondary,
  },
  
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  loadingText: {
    color: '#ffffff',
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: SPACING.lg,
  },
  
  responsavelSection: {
    backgroundColor: 'rgba(28, 52, 142, 0.05)',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 52, 142, 0.2)',
  },
  
  responsavelTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary.main,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  webScrollView: Platform.select({
    web: {
      maxHeight: 800,
      overflow: 'scroll',
    },
    default: {},
  }),
});
