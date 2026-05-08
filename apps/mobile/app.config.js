// Dinamik Expo config — env değişkenlerini bundle'a aktarır.
// Secrets: ../mobile/.env veya EAS Secret olarak verilir.

require('dotenv').config({ path: __dirname + '/.env' });

module.exports = ({ config }) => ({
  ...config,
  name: 'VeniVidiCoop',
  slug: 'venividicoop',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.venividicoop.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Yakınınızdaki mağazaları görmek için konumunuza ihtiyacımız var.',
      NSLocationAlwaysUsageDescription:
        'Konum bazlı bildirimler için konumunuza ihtiyacımız var.',
      NSContactsUsageDescription:
        'Adres formunu otomatik doldurmak için rehbere erişmemiz gerekiyor.',
    },
  },
  android: {
    adaptiveIcon: { backgroundColor: '#1a6b52' },
    package: 'com.venividicoop.app',
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'READ_CONTACTS'],
  },
  scheme: 'venividicoop',
  plugins: ['expo-web-browser'],
  updates: {
    url: 'https://u.expo.dev/PROJECT_ID_PLACEHOLDER',
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: { policy: 'appVersion' },
  extra: {
    apiBaseUrl: process.env.API_BASE_URL,
    apiBaseUrlLocal: process.env.API_BASE_URL_LOCAL,
    useLocalTunnel: process.env.USE_LOCAL_TUNNEL,
    azureMapsKey: process.env.AZURE_MAPS_KEY,
    googleAuthClientId: process.env.GOOGLE_AUTH_CLIENT_ID,
    facebookAppId: process.env.FACEBOOK_APP_ID,
  },
});
