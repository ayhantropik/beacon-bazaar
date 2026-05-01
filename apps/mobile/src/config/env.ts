export const env = {
  apiBaseUrl: __DEV__ ? 'https://pens-urban-guidance-cleveland.trycloudflare.com/api/v1' : 'https://api.venividicoop.com/api/v1',
  azureMapsKey: '***REDACTED_AZURE_MAPS_KEY***',
  googleMapsApiKey: '',
  googleAuthClientId: '', // Google Cloud Console > OAuth 2.0 Client ID (iOS)
  facebookAppId: '',      // developers.facebook.com > Apps > App ID
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
