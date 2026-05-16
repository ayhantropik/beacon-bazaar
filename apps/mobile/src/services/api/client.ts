import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../../config/env';

// Render free tier 15 dk inaktivite sonrası spin-down yapıyor — ilk istek 50-60 sn alabilir.
// Sonraki istekler hızlı, ama 90 sn timeout cold-start ve genel ağ gecikmelerine kafi.
const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': '1',
    'User-Agent': 'venividicoop-mobile',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${env.apiBaseUrl}/auth/refresh-token`, {
            refreshToken,
          });
          await AsyncStorage.setItem('access_token', data.data.accessToken);
          await AsyncStorage.setItem('refresh_token', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
