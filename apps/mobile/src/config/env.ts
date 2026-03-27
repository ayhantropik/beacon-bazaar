export const env = {
  apiBaseUrl: __DEV__ ? 'http://localhost:4000/api/v1' : 'https://api.beaconbazaar.com/api/v1',
  googleMapsApiKey: '',
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    messagingSenderId: '',
    appId: '',
  },
  beaconUUID: '00000000-0000-0000-0000-000000000000',
  appName: 'Beacon Bazaar',
  appVersion: '1.0.0',
} as const;
