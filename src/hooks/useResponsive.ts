import { DeviceType, getDeviceType } from '@/constants/breakpoints';
import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface WindowDimensions {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

export const useResponsive = (): WindowDimensions => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    const deviceType = getDeviceType(width);
    
    return {
      width,
      height,
      deviceType,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isLargeDesktop: deviceType === 'largeDesktop',
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      const deviceType = getDeviceType(window.width);
      
      setDimensions({
        width: window.width,
        height: window.height,
        deviceType,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isLargeDesktop: deviceType === 'largeDesktop',
      });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};

// Hook para estilos responsivos
export const useResponsiveValue = <T>(values: Partial<Record<DeviceType, T>>): T | undefined => {
  const { deviceType } = useResponsive();
  
  // Prioridade: deviceType específico > desktop > tablet > mobile
  return values[deviceType] || 
         values.desktop || 
         values.tablet || 
         values.mobile;
};

// Utilitário para criar estilos responsivos
export const createResponsiveStyle = <T>(values: Partial<Record<DeviceType, T>>) => {
  return (deviceType: DeviceType): T | undefined => {
    return values[deviceType] || 
           values.desktop || 
           values.tablet || 
           values.mobile;
  };
};