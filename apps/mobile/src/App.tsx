import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor } from './store';
import RootNavigator from './navigation/RootNavigator';
import { env } from './config/env';

export default function App() {
  // Render free tier spin-down — splash gösterilirken backend'i uyandır.
  useEffect(() => {
    fetch(`${env.apiBaseUrl}/health`).catch(() => {});
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <PaperProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </PaperProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
