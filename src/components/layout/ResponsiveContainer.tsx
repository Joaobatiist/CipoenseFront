import { SPACING } from '@/constants';
import { useResponsive } from '@/hooks/useResponsive';
import React from 'react';
import { View, ViewStyle } from 'react-native';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  maxWidth?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    largeDesktop?: number;
  };
  padding?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    largeDesktop?: number;
  };
  centered?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth,
  padding,
  centered = false,
}) => {
  const { deviceType } = useResponsive();

  const getResponsiveValue = (values?: Record<string, number>) => {
    if (!values) return undefined;
    return values[deviceType] || values.desktop || values.tablet || values.mobile;
  };

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: getResponsiveValue(maxWidth) || (
      deviceType === 'largeDesktop' ? 1200 :
      deviceType === 'desktop' ? 1024 :
      deviceType === 'tablet' ? 768 :
      '100%'
    ),
    paddingHorizontal: getResponsiveValue(padding) || (
      deviceType === 'largeDesktop' ? SPACING.xxl :
      deviceType === 'desktop' ? SPACING.xl :
      deviceType === 'tablet' ? SPACING.lg :
      SPACING.md
    ),
    alignSelf: centered ? 'center' : 'stretch',
  };

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};