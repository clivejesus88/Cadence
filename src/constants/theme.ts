import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

export const GLOW_COLOR = '#fb923c';

export const glowShadow: ViewStyle = Platform.select({
  web: {
    boxShadow: '0 0 90px 20px rgba(251,146,60,0.22)',
  },
  default: {
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 48,
    shadowOpacity: 0.4,
    elevation: 24,
  },
}) as ViewStyle;

export const heroImage = require('../../assets/images/hero.jpg');
export const avatarImage = require('../../assets/images/avatar.jpg');
