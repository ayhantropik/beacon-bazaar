import type {
  ApiResponse,
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
} from '@beacon-bazaar/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './client';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    const { tokens } = response.data.data;
    await AsyncStorage.setItem('access_token', tokens.accessToken);
    await AsyncStorage.setItem('refresh_token', tokens.refreshToken);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    const { tokens } = response.data.data;
    await AsyncStorage.setItem('access_token', tokens.accessToken);
    await AsyncStorage.setItem('refresh_token', tokens.refreshToken);
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
  },

  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/auth/profile').then((res) => res.data),
};
