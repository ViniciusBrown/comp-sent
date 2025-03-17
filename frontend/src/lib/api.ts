import axios from 'axios';
import { getToken, removeToken, storeToken } from './jwt';
import { User } from '@/types';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:8000';

// Types
interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

interface RefreshTokenResponse {
  access: string;
}

// Extended request configuration type
interface RequestConfig {
  headers?: Record<string, string>;
  _retry?: boolean;
  [key: string]: any;
}

// API Endpoints configuration
const API_ENDPOINTS = {
  auth: {
    login: '/api/token/',  // JWT token endpoint
    register: '/api/user/register/',
    refresh: '/api/token/refresh/',
    profile: '/api/user/profile/',
    csrf: '/api/csrf/'  // CSRF token endpoint
  },
  sentiment: {
    all: '/api/social-media-data/',
    byCompany: (company: string) => `/api/social-media-data/by-company/${company}/`,
    process: '/api/social-media-data/etl/',
    mockData: '/api/social-media-data/create-new-mocked-data/'
  }
} as const;

// Base API service class
class ApiService {
  private api;
  private refreshTokenRequest: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for sending/receiving cookies
    });

    // Add request interceptor to ensure Authorization header
    this.api.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
          };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (!error.config || !error.response) {
          return Promise.reject(error);
        }

        const originalRequest = error.config;

        // If error is 401 and it's not a refresh token request
        if (
          error.response.status === 401 &&
          !originalRequest._retry &&
          originalRequest.url !== API_ENDPOINTS.auth.refresh
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.api.post<RefreshTokenResponse>(
              API_ENDPOINTS.auth.refresh,
              { refresh: refreshToken }
            );

            const newToken = response.data.access;
            storeToken(newToken);

            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // If refresh fails, logout
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Get JWT tokens
      const response = await this.api.post<TokenResponse>(
        API_ENDPOINTS.auth.login,
        credentials
      );

      // Store tokens
      storeToken(response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // After successful login, get the user profile
      const user = await this.getProfile();
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<any> {
    try {
      // Make registration request
      const response = await this.api.post<{ id: string; username: string; email: string }>(
        API_ENDPOINTS.auth.register,
        userData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // After successful registration, return the response
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            data?: Record<string, string[]> 
          } 
        };
        
        if (axiosError.response?.data) {
          // Django sends validation errors as an object with field names as keys
          const errorMessages = Object.entries(axiosError.response.data)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join('; ');
          throw new Error(errorMessages);
        }
      }
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>(API_ENDPOINTS.auth.profile);
    return response.data;
  }

  async logout(): Promise<void> {
    // For JWT, we just need to remove the tokens
    removeToken();
    localStorage.removeItem('refresh_token');

    // Clear Authorization header
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Generic request methods
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }

  handleError(error: unknown): { message: string; status?: number } {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number; data?: { message?: string } } };
      
      if (axiosError.response) {
        const status = axiosError.response.status;
        
        switch (status) {
          case 401:
            return { 
              message: 'Unauthorized: Please log in again', 
              status 
            };
          case 403:
            return { 
              message: 'Forbidden: You do not have permission to access this resource', 
              status 
            };
          case 404:
            return { 
              message: 'Not found: The requested resource does not exist', 
              status 
            };
          case 500:
            return { 
              message: 'Server error: Something went wrong on our end', 
              status 
            };
          default:
            return { 
              message: axiosError.response.data?.message || 'An error occurred', 
              status 
            };
        }
      }
    }
    
    if (error instanceof Error) {
      return { message: error.message };
    }
    
    return { message: 'An unknown error occurred' };
  }
}

// Extended API service with sentiment-specific methods
class SentimentApiService extends ApiService {
  async getAllSentimentData() {
    return this.get(API_ENDPOINTS.sentiment.all);
  }

  async getCompanySentimentData(company: string) {
    return this.get(API_ENDPOINTS.sentiment.byCompany(company));
  }

  async processSentimentData() {
    return this.post(API_ENDPOINTS.sentiment.process);
  }

  async generateMockData() {
    return this.post(API_ENDPOINTS.sentiment.mockData);
  }
}

// Create and export a singleton instance
const apiService = new SentimentApiService();
export default apiService;

// Export types for use in other files
export type {
  LoginCredentials,
  RegisterData,
  TokenResponse,
  RequestConfig
};