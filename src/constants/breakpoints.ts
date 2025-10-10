export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export const DEVICE_TYPES = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
  largeDesktop: 'largeDesktop',
} as const;

export type DeviceType = keyof typeof DEVICE_TYPES;

// Utilitários para responsividade
export const isTablet = (width: number): boolean => 
  width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;

export const isDesktop = (width: number): boolean => 
  width >= BREAKPOINTS.desktop;

export const isMobile = (width: number): boolean => 
  width < BREAKPOINTS.tablet;

export const getDeviceType = (width: number): DeviceType => {
  if (width >= BREAKPOINTS.largeDesktop) return 'largeDesktop';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
};