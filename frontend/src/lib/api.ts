import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { getToken, removeToken, storeToken } from './jwt';

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
}

interface TokenResponse {
  access: string;
  refresh: string;
}

interface RefreshTokenResponse {
  access: string;
}

// Create a class to manage API requests with JWT authentication
class ApiService {
  private api: AxiosInstance;
  private refreshTokenRequest: Promise<string> | null = null;

  constructor() {
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = getToken();
        if (token && config.headers) {
          // Add token to Authorization header
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // If error is 401 Unauthorized and we haven't already tried to refresh the token
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          getToken() // Only try to refresh if we have a token
        ) {
          originalRequest._retry = true;

          try {
            // Get a new token
            const newToken = await this.refreshToken();
            
            // Update the Authorization header with the new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            } else {
              originalRequest.headers = { Authorization: `Bearer ${newToken}` };
            }
            
            // Retry the original request with the new token
            return this.api(originalRequest);
          } catch (refreshError) {
            // If refresh token fails, log out the user
            console.error('Token refresh failed:', refreshError);
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        // For other errors, just reject the promise
        return Promise.reject(error);
      }
    );
  }

  /**
   * Login user and get JWT tokens
   */
  async login(credentials: LoginCredentials): Promise<AxiosResponse<TokenResponse>> {
    try {
      const response = await axios.post<TokenResponse>(
        `${API_BASE_URL}/api/token/`,
        credentials
      );
      
      // Store the access token
      storeToken(response.data.access);
      
      // Store refresh token in a secure way (httpOnly cookie would be better in production)
      localStorage.setItem('refresh_token', response.data.refresh);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AxiosResponse> {
    return axios.post(`${API_BASE_URL}/api/user/register/`, userData);
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshToken(): Promise<string> {
    // If there's already a refresh request in progress, return that promise
    // This prevents multiple refresh requests if several API calls fail at once
    if (this.refreshTokenRequest) {
      return this.refreshTokenRequest;
    }

    // Create a new refresh token request
    this.refreshTokenRequest = new Promise<string>(async (resolve, reject) => {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}/api/token/refresh/`,
          { refresh: refreshToken }
        );
        
        const newToken = response.data.access;
        storeToken(newToken);
        
        resolve(newToken);
      } catch (error) {
        // If refresh fails, clear tokens and reject
        this.logout();
        reject(error);
      } finally {
        // Clear the refresh request
        this.refreshTokenRequest = null;
      }
    });

    return this.refreshTokenRequest;
  }

  /**
   * Log out the user by removing tokens
   */
  logout(): void {
    removeToken();
    localStorage.removeItem('refresh_token');
    // You might want to redirect to login page or update app state here
  }

  /**
   * Generic GET request with authentication
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  /**
   * Generic POST request with authentication
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  /**
   * Generic PUT request with authentication
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  /**
   * Generic PATCH request with authentication
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.patch<T>(url, data, config);
  }

  /**
   * Generic DELETE request with authentication
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }

  /**
   * Handle API errors in a consistent way
   */
  handleError(error: unknown): { message: string; status?: number } {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Handle specific status codes
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
      
      // Network errors
      if (axiosError.request) {
        return { 
          message: 'Network error: Please check your internet connection' 
        };
      }
    }
    
    // Generic error
    return { 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export types for use in other files
export type { LoginCredentials, RegisterData, TokenResponse };