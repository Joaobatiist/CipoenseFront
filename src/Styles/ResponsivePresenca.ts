import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@/constants';
import { DeviceType } from '@/constants/breakpoints';
import { createPlatformStyle } from '@/utils/platform';
import { StyleSheet, TextStyle, ViewStyle } from "react-native";

// Função para criar estilos responsivos
const createResponsiveStyles = (deviceType: DeviceType) => {
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop' || deviceType === 'largeDesktop';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background.primary,
    } as ViewStyle,

    header: {
      backgroundColor: COLORS.primary.main,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      paddingTop: createPlatformStyle({
        web: SPACING.md,
        android: 50,
        ios: 20,
        default: SPACING.md,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.secondary.main,
      // Web específicos
      ...createPlatformStyle({
        web: {
          position: 'sticky' as any,
          top: 0,
          zIndex: 1000,
        },
        default: {},
      }),
    } as ViewStyle,

    btnVoltar: {
      position: 'absolute',
      left: SPACING.md,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      ...createPlatformStyle({
        web: {
          cursor: 'pointer' as any,
        },
        default: {},
      }),
    } as ViewStyle,

    headerTitle: {
      color: COLORS.background.secondary,
      fontSize: isMobile ? TYPOGRAPHY.sizes.lg : TYPOGRAPHY.sizes.xl,
      fontWeight: TYPOGRAPHY.weights.bold,
      textAlign: 'center',
    } as TextStyle,

    calendarButton: {
      position: 'absolute',
      right: SPACING.md,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      ...createPlatformStyle({
        web: {
          cursor: 'pointer' as any,
        },
        default: {},
      }),
    } as ViewStyle,

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background.primary,
      padding: SPACING.xl,
    } as ViewStyle,

    emptyListContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    } as ViewStyle,

    emptyListText: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.text.secondary,
      marginBottom: SPACING.md,
      textAlign: 'center',
    } as TextStyle,

    reloadButton: {
      backgroundColor: COLORS.secondary.main,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      marginTop: SPACING.md,
      ...createPlatformStyle({
        web: {
          cursor: 'pointer' as any,
        },
        default: {},
      }),
    } as ViewStyle,

    reloadButtonText: {
      color: COLORS.primary.main,
      fontWeight: TYPOGRAPHY.weights.bold,
      fontSize: TYPOGRAPHY.sizes.md,
    } as TextStyle,

    listContent: {
      padding: isMobile ? SPACING.md : SPACING.lg,
      maxWidth: isDesktop ? 1200 : '100%',
      alignSelf: 'center',
      width: '100%',
    } as ViewStyle,

    alunoItem: {
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'stretch' : 'center',
      backgroundColor: COLORS.background.secondary,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border.light,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      // Web específicos
      ...createPlatformStyle({
        web: {
          transition: 'all 0.2s ease',
          cursor: 'default' as any,
        },
        default: {},
      }),
    } as ViewStyle,

    alunoNome: {
      fontSize: TYPOGRAPHY.sizes.md,
      color: COLORS.text.primary,
      flex: 1,
      marginBottom: isMobile ? SPACING.sm : 0,
      fontWeight: TYPOGRAPHY.weights.medium,
    } as TextStyle,

    iconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isMobile ? 'center' : 'flex-end',
      gap: SPACING.md,
    } as ViewStyle,

    saveButton: {
      backgroundColor: COLORS.primary.main,
      paddingVertical: SPACING.md,
      marginHorizontal: SPACING.md,
      marginTop: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      ...createPlatformStyle({
        web: {
          cursor: 'pointer' as any,
          transition: 'all 0.2s ease',
        },
        default: {},
      }),
    } as ViewStyle,

    saveButtonText: {
      color: COLORS.background.secondary,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: TYPOGRAPHY.weights.bold,
    } as TextStyle,

    saveButtonDisabled: {
      backgroundColor: COLORS.text.disabled,
      ...createPlatformStyle({
        web: {
          cursor: 'not-allowed' as any,
        },
        default: {},
      }),
    } as ViewStyle,

    previousListsButton: {
      backgroundColor: COLORS.secondary.main,
      paddingVertical: SPACING.md,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.xl,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      ...createPlatformStyle({
        web: {
          cursor: 'pointer' as any,
          transition: 'all 0.2s ease',
        },
        default: {},
      }),
    } as ViewStyle,

    previousListsButtonText: {
      color: COLORS.primary.main,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: TYPOGRAPHY.weights.bold,
    } as TextStyle,

    // Modal styles
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    } as ViewStyle,

    datePickerContainer: {
      backgroundColor: COLORS.background.secondary,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.lg,
      margin: SPACING.md,
      minWidth: isTablet ? 400 : 300,
    } as ViewStyle,

    confirmButton: {
      backgroundColor: COLORS.primary.main,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      alignItems: 'center',
      marginTop: SPACING.md,
      ...createPlatformStyle({
        web: {
          cursor: 'pointer' as any,
        },
        default: {},
      }),
    } as ViewStyle,

    confirmButtonText: {
      color: COLORS.background.secondary,
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: TYPOGRAPHY.weights.bold,
    } as TextStyle,

    // Histórico específico
    diaCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.background.secondary,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: COLORS.border.light,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
      ...createPlatformStyle({
        web: {
          cursor: 'pointer' as any,
          transition: 'all 0.2s ease',
        },
        default: {},
      }),
    } as ViewStyle,

    diaCardContent: {
      flex: 1,
    } as ViewStyle,

    diaCardTitle: {
      fontSize: TYPOGRAPHY.sizes.md,
      fontWeight: TYPOGRAPHY.weights.bold,
      color: COLORS.text.primary,
      marginBottom: SPACING.xs,
    } as TextStyle,

    diaCardSummary: {
      fontSize: TYPOGRAPHY.sizes.sm,
      color: COLORS.text.secondary,
    } as TextStyle,
  });
};

// Exportar estilos que se adaptam ao dispositivo
export const createPresencaStyles = (deviceType: DeviceType) => 
  createResponsiveStyles(deviceType);

// Estilos padrão para compatibilidade
export const styles = createResponsiveStyles('mobile');