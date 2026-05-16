import Constants from 'expo-constants';

// Tüm secret/config değerleri app.config.js > extra'dan gelir.
// .env'de iki URL tutulabilir:
//   API_BASE_URL          — kalıcı production URL (Render vs.) - ana
//   API_BASE_URL_LOCAL    — opsiyonel dev tunnel (Cloudflare quick tunnel)
//   USE_LOCAL_TUNNEL=true ise dev URL'i kullan, aksi halde kalıcı URL
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const PROD_FALLBACK = 'https://venividicoop-api.onrender.com/api/v1';

const useLocal = (extra.useLocalTunnel || '').toString().toLowerCase() === 'true';
const localUrl = extra.apiBaseUrlLocal || '';
const prodUrl = extra.apiBaseUrl || PROD_FALLBACK;

export const env = {
  apiBaseUrl: useLocal && localUrl ? localUrl : prodUrl,
  azureMapsKey: extra.azureMapsKey || '',
  googleMapsApiKey: '',
  // iOS native scheme için (standalone EAS Build)
  googleAuthClientIdIos: extra.googleAuthClientIdIos || '',
  // Expo Auth proxy için (Expo Go ve dev)
  googleAuthClientIdWeb: extra.googleAuthClientIdWeb || '',
  facebookAppId: extra.facebookAppId || '',
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    messagingSenderId: '',
    appId: '',
  },
  beaconUUID: '00000000-0000-0000-0000-000000000000',
  appName: 'VeniVidiCoop',
  appVersion: '1.0.0',
} as const;
