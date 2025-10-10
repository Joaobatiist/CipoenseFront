import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';
import { Platform, StatusBar, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + SPACING.sm : SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#fff',
    flex: 1,
  },
});
