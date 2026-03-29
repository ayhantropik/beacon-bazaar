import type {
  ApiResponse,
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
} from '@beacon-bazaar/shared';
import apiClient from './client';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data).then((res) => res.data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data).then((res) => res.data),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return apiClient.post('/auth/logout');
  },

  refreshToken: (refreshToken: string) =>
    apiClient
      .post<ApiResponse<AuthTokens>>('/auth/refresh-token', { refreshToken })
      .then((res) => res.data),

  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/auth/profile').then((res) => res.data),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>('/auth/profile', data).then((res) => res.data),

  socialLogin: (provider: string, payload: { email: string; name?: string; surname?: string; avatar?: string }) =>
    apiClient.post<ApiResponse<AuthResponse & { provider: string }>>('/auth/social-login', { provider, ...payload }).then((res) => res.data),
};
