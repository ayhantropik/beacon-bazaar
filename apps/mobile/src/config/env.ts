export const env = {
  apiBaseUrl: __DEV__ ? 'http://192.168.1.93:4000/api/v1' : 'https://api.venividicoop.com/api/v1',
  googleMapsApiKey: '',
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
