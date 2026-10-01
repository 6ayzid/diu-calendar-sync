export type DeviceType = 'android' | 'apple' | 'desktop';

export interface DeviceInfo {
  deviceType: DeviceType;
  isAndroid: boolean;
  isApple: boolean;
  isDesktop: boolean;
  isChromeOnAndroid: boolean;
  platformName: string;
  browserName: string;
}

/**
 * Robust device and browser detection prioritizing the modern
 * navigator.userAgentData API, with backwards-compatible fallback
 * to navigator.userAgent and navigator.platform for legacy environments.
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      deviceType: 'desktop',
      isAndroid: false,
      isApple: false,
      isDesktop: true,
      isChromeOnAndroid: false,
      platformName: 'Desktop',
      browserName: 'Unknown',
    };
  }

  // 1. Primary: modern navigator.userAgentData API
  interface NavigatorWithUserAgentData extends Navigator {
    userAgentData?: {
      platform?: string;
      mobile?: boolean;
      brands?: Array<{ brand: string; version: string }>;
    };
  }

  const uad = (navigator as NavigatorWithUserAgentData).userAgentData;
  const uadPlatform = (uad?.platform || '').toLowerCase();
  const uadMobile = uad?.mobile ?? false;
  const uadBrands = uad?.brands || [];
  const isChromeBrand = uadBrands.some((b) =>
    /google chrome|chromium/i.test(b.brand)
  );

  // 2. Fallback: navigator.userAgent and navigator.platform
  const ua = (navigator.userAgent || '').toLowerCase();
  const navPlatform = (navigator.platform || '').toLowerCase();

  // Detect Android
  const isAndroid = uadPlatform.includes('android') || ua.includes('android');

  // Detect Apple (iOS, iPadOS, macOS)
  const isIos =
    /iphone|ipad|ipod/.test(ua) ||
    (navPlatform === 'macintel' && navigator.maxTouchPoints > 1);
  const isMac =
    uadPlatform.includes('mac') ||
    ua.includes('macintosh') ||
    navPlatform.includes('mac');
  const isApple = isIos || isMac;

  // Detect Desktop
  const isDesktop = !isAndroid && (!isApple || (!isIos && !uadMobile));

  // Detect Chrome on Android
  const isNonChromeBrowser =
    /edg|opr|samsungbrowser|firefox|ucbrowser|miuibrowser|opera/i.test(ua);
  const isChromeOnAndroid =
    isAndroid &&
    (isChromeBrand || (ua.includes('chrome') && !isNonChromeBrowser));

  let deviceType: DeviceType = 'desktop';
  if (isAndroid) {
    deviceType = 'android';
  } else if (isApple) {
    deviceType = 'apple';
  } else {
    deviceType = 'desktop';
  }

  const platformName = isAndroid
    ? 'Android'
    : isApple
    ? isIos
      ? 'iOS'
      : 'macOS'
    : 'Desktop';

  const browserName = isChromeOnAndroid
    ? 'Google Chrome'
    : isAndroid
    ? 'Android Browser'
    : isApple
    ? 'Safari/Apple'
    : 'Desktop Browser';

  return {
    deviceType,
    isAndroid,
    isApple,
    isDesktop,
    isChromeOnAndroid,
    platformName,
    browserName,
  };
}
