import axios from 'axios';
import { getToken, removeToken, storeToken } from './jwt';
import { CompanySentiment, Company, User } from '@/types';

// Base URL for API requests
const API_BASE_URL = 'http://127.0.0.1:8000';

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
    byCompany: (company: string) => `/api/social-media-data/by-company/${company}/`
  }
} as const;

// Separate type for sentiment data without company info
export interface SentimentData {
  time_period: string;
  sentiment_summary: CompanySentiment['sentiment_summary'];
  sentiment_trend: CompanySentiment['sentiment_trend'];
  top_tweets: CompanySentiment['top_tweets'];
  key_topics: CompanySentiment['key_topics'];
}

// Base API service class
class ApiService {
  protected api;
  private refreshTokenRequest: Promise<string> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
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
      const response = await this.api.post<TokenResponse>(
        API_ENDPOINTS.auth.login,
        credentials
      );

      storeToken(response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      const user = await this.getProfile();
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<any> {
    try {
      const response = await this.api.post<{ id: string; username: string; email: string }>(
        API_ENDPOINTS.auth.register,
        userData
      );
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>(API_ENDPOINTS.auth.profile);
    return response.data;
  }

  async logout(): Promise<void> {
    removeToken();
    localStorage.removeItem('refresh_token');
    delete this.api.defaults.headers.common['Authorization'];
  }

  protected async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  protected async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }
}

// Extended API service with sentiment methods
class ExtendedApiService extends ApiService {
  private extractKeyTopics(tweets: Array<{ text: string; score: number }>): Array<{ topic: string; count: number; sentiment_score: number }> {
    // Create a map to store topic frequencies and sentiment scores
    const topicMap = new Map<string, { count: number; totalScore: number }>();
    
    // Process each tweet
    tweets.forEach(tweet => {
      // Extract words from tweet text
      const words = tweet.text.toLowerCase()
        .replace(/[^a-zA-Z0-9\s#@]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3); // Filter out short words
      
      // Process hashtags and mentions separately
      const hashtags = tweet.text.match(/#\w+/g) || [];
      const mentions = tweet.text.match(/@\w+/g) || [];
      
      // Combine all potential topics
      const potentialTopics = [...words, ...hashtags, ...mentions];
      
      // Update topic map
      const processedTopics = new Set(); // To avoid counting same topic multiple times in one tweet
      potentialTopics.forEach(topic => {
        if (!processedTopics.has(topic)) {
          processedTopics.add(topic);
          
          if (!topicMap.has(topic)) {
            topicMap.set(topic, { count: 0, totalScore: 0 });
          }
          
          const topicData = topicMap.get(topic)!;
          topicData.count += 1;
          topicData.totalScore += tweet.score;
        }
      });
    });
    
    // Convert map to array and calculate average sentiment
    const topics = Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        sentiment_score: Number((data.totalScore / data.count).toFixed(2))
      }))
      .filter(topic => topic.count > 1) // Filter out topics that appear only once
      .sort((a, b) => b.count - a.count) // Sort by frequency
      .slice(0, 10); // Take top 10 topics
    
    return topics;
  }
  async getCompanySentimentData(company: string, timeFilter: string = 'month'): Promise<SentimentData> {
    const response = await this.get<Array<{
      id: string;
      created_at: string;
      sentiment: string;
      score: number;
      text: string;
      likes: number;
    }>>(API_ENDPOINTS.sentiment.byCompany(company));
    console.log(response)
    // Filter data based on timeFilter in memory
    const now = new Date();
    const filterDate = new Date(now);
    
    switch (timeFilter) {
      case 'day':
        filterDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case '6month':
        filterDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        filterDate.setMonth(now.getMonth() - 1); // Default to month
    }

    // Filter data by date
    const filteredData = response.filter(item => {
      const itemDate = new Date(item.created_at * 1000);
      return itemDate >= filterDate;
    });
    console.log(filteredData)
    // Group data by day and calculate averages
    const dailyData = filteredData.reduce((acc, item) => {
      const date = new Date(item.created_at * 1000).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          scores: [],
          count: 0
        };
      }
      acc[date].scores.push(item.score);
      acc[date].count++;
      return acc;
    }, {} as Record<string, { scores: number[]; count: number }>);

    // Calculate sentiment trend
    const sentiment_trend = Object.entries(dailyData).map(([date, data]) => ({
      date,
      average_score: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      tweet_count: data.count
    }));

    // Calculate overall sentiment summary
    const total_tweets = filteredData.length;
    const positive_count = filteredData.filter(item => item.score > 0.6).length;
    const negative_count = filteredData.filter(item => item.score < 0.4).length;
    const neutral_count = total_tweets - positive_count - negative_count;

    const overall_score = filteredData.reduce((acc, item) => acc + item.score, 0) / total_tweets;

    // Return formatted data
    return {
      time_period: timeFilter,
      sentiment_summary: {
        overall_score: Number(overall_score.toFixed(2)),
        positive_percentage: Math.round((positive_count / total_tweets) * 100),
        negative_percentage: Math.round((negative_count / total_tweets) * 100),
        neutral_percentage: Math.round((neutral_count / total_tweets) * 100),
        total_tweets
      },
      sentiment_trend,
      top_tweets: {
        positive: filteredData
          .filter(item => item.score > 0.6)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(tweet => ({
            id: tweet.id,
            text: tweet.text,
            created_at: tweet.created_at,
            sentiment: {
              score: tweet.score,
              label: tweet.score > 0.6 ? 'positive' : tweet.score < 0.4 ? 'negative' : 'neutral',
              confidence: 0.9  // Default confidence since we don't have this in raw data
            },
            user: {
              username: 'user',  // Placeholder since we don't have user data
              name: 'User',
              profile_image_url: 'https://via.placeholder.com/48',
              followers_count: 0
            },
            metrics: {
              retweet_count: 0,  // Default values since we only have likes
              reply_count: 0,
              like_count: tweet.likes,
              quote_count: 0
            }
          })),
        negative: filteredData
          .filter(item => item.score < 0.4)
          .sort((a, b) => a.score - b.score)
          .slice(0, 5)
          .map(tweet => ({
            id: tweet.id,
            text: tweet.text,
            created_at: tweet.created_at,
            sentiment: {
              score: tweet.score,
              label: tweet.score > 0.6 ? 'positive' : tweet.score < 0.4 ? 'negative' : 'neutral',
              confidence: 0.9  // Default confidence since we don't have this in raw data
            },
            user: {
              username: 'user',  // Placeholder since we don't have user data
              name: 'User',
              profile_image_url: 'https://via.placeholder.com/48',
              followers_count: 0
            },
            metrics: {
              retweet_count: 0,  // Default values since we only have likes
              reply_count: 0,
              like_count: tweet.likes,
              quote_count: 0
            }
          }))
      },
      key_topics: this.extractKeyTopics(filteredData)
    };
  }
}

// Create and export a singleton instance
const apiService = new ExtendedApiService();
export default apiService;

// Export types for use in other files
export type {
  LoginCredentials,
  RegisterData,
  TokenResponse,
  RequestConfig
};