import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Utilitários para diferentes comportamentos por plataforma
export const platformSelect = <T,>(options: {
  web?: T;
  ios?: T;
  android?: T;
  mobile?: T;
  default?: T;
}): T | undefined => {
  if (isWeb && options.web !== undefined) return options.web;
  if (isIOS && options.ios !== undefined) return options.ios;
  if (isAndroid && options.android !== undefined) return options.android;
  if (isMobile && options.mobile !== undefined) return options.mobile;
  return options.default;
};

// Estilos específicos por plataforma
export const createPlatformStyle = <T,>(styles: {
  web?: T;
  ios?: T;
  android?: T;
  mobile?: T;
  default?: T;
}): T | undefined => {
  return platformSelect(styles);
};