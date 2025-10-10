import { SPACING } from '@/constants';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: SPACING.lg,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: SPACING.lg,
  },
  loginButton: {
    marginBottom: SPACING.md,
  },
  backButton: {
    marginTop: SPACING.sm,
  },
});
