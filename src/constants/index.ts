/**
 * ╔══════════════════════════════════════════════════════╗
 * ║            UNIFIED CONSTANTS – FoodApp            ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  Tất cả design-token và config tập trung tại đây.   ║
 * ║                                                      ║
 * ║  AI Agent – Quy tắc bắt buộc:                        ║
 * ║   • Khi thêm màu mới → thêm vào COLORS bên dưới.    ║
 * ║   • KHÔNG tạo thêm file constants mới.               ║
 * ║   • Import: import { COLORS, API_URL } from          ║
 * ║     '../../src/constants';                           ║
 * ╚══════════════════════════════════════════════════════╝
 */

import { Platform } from 'react-native';

// ─── API / Network ─────────────────────────────────────────────────────────────
// Đọc từ file .env (biến EXPO_PUBLIC_*). Khi đổi mạng WiFi, chỉ cần sửa file .env rồi restart app.
const SERVER_IP_ENV  = process.env.EXPO_PUBLIC_SERVER_IP || '192.168.69.214';
const API_PORT_ENV   = process.env.EXPO_PUBLIC_API_PORT || '5000';

export const SERVER_IP = SERVER_IP_ENV;
export const API_URL   = Platform.OS === 'web'
  ? `http://localhost:${API_PORT_ENV}`
  : `http://${SERVER_IP_ENV}:${API_PORT_ENV}`;

// ─── Brand Colors ──────────────────────────────────────────────────────────────
// Palette chính – xanh lá là màu chủ đạo FoodApp.
// AI Agent: Mọi màu mới PHẢI thêm vào đây, không hardcode trong component.
export const COLORS = {
  // Green brand palette – Sage/Forest green (nhẹ, không chói)
  primary:        '#3D9970',               // Sage Green – màu chính (bớt chói hơn #22C55E)
  primaryDark:    '#2D7A56',               // Forest Green – header, pressed state
  primaryLight:   '#5BAD86',               // Soft Mint – dark mode accent
  primaryLightBg: '#F0FBF5',               // Green tint – light background
  primaryAlpha:   'rgba(61, 153, 112, 0.18)', // overlay / chip active

  // Text
  text:          '#FFFFFF',               // White – trên nền tối
  textDark:      '#212121',               // Near-black – trên nền sáng
  textSecondary: '#E2E8F0',               // Dimmed white – phụ trên nền tối
  textMuted:     '#94A3B8',               // Muted slate – placeholder, timestamp

  // Backgrounds
  background:    '#0D1F18',               // Deep green-dark – Messages screen
  backgroundAlt: '#F5F5F5',               // Light grey – Home / Explore
  card:          '#112A1D',               // Dark green card – Messages item
  cardLight:     '#FFFFFF',               // White card – Explore / Payment

  // Borders
  border:        '#1A3325',               // Subtle green border
  borderLight:   '#E0E0E0',               // Light border

  // Status
  error:   '#F87171',                     // Soft red
  success: '#3D9970',                     // = primary
  warning: '#F9A825',                     // Amber

  // Misc
  overlay: 'rgba(0,0,0,0.5)',
} as const;

// ─── Tab-bar / Theme tokens ─────────────────────────────────────────────────────
// Được useColorScheme() trong hooks/ sử dụng.
// AI Agent: Không sửa key names – chúng được map trực tiếp bởi useThemeColor().
export const Colors = {
  light: {
    text:            COLORS.text,
    background:      COLORS.background,
    tint:            COLORS.primary,
    icon:            COLORS.textMuted,
    tabIconDefault:  COLORS.textMuted,
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text:            COLORS.text,
    background:      '#0A1A0F',
    tint:            COLORS.primaryLight,
    icon:            COLORS.textMuted,
    tabIconDefault:  COLORS.textMuted,
    tabIconSelected: COLORS.primaryLight,
  },
} as const;

// ─── Typography ────────────────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
