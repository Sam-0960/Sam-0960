import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 30000;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error retrieving auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await AsyncStorage.removeItem('authToken');
      // Optionally redirect to login
    }
    return Promise.reject(error);
  }
);

// Pothole API functions
export const potholeAPI = {
  // Upload a new pothole report
  uploadPothole: async (data) => {
    const formData = new FormData();
    
    // Add image
    if (data.image) {
      formData.append('image', {
        uri: data.image.uri,
        type: data.image.type || 'image/jpeg',
        name: data.image.fileName || 'pothole.jpg',
      });
    }
    
    // Add other fields
    formData.append('longitude', data.longitude.toString());
    formData.append('latitude', data.latitude.toString());
    formData.append('roadType', data.roadType);
    
    if (data.description) {
      formData.append('description', data.description);
    }
    
    if (data.severity) {
      formData.append('severity', data.severity);
    }

    const response = await api.post('/potholes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get all potholes with filtering and sorting
  getPotholes: async (params = {}) => {
    const response = await api.get('/potholes', { params });
    return response.data;
  },

  // Get a specific pothole by ID
  getPotholeById: async (id) => {
    const response = await api.get(`/potholes/${id}`);
    return response.data;
  },

  // Update pothole status (admin only)
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/potholes/${id}/status`, statusData);
    return response.data;
  },

  // Get pothole statistics
  getStatistics: async () => {
    const response = await api.get('/potholes/stats');
    return response.data;
  },

  // Delete a pothole (admin only)
  deletePothole: async (id) => {
    const response = await api.delete(`/potholes/${id}`);
    return response.data;
  },
};

// Helper functions for API calls
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'An error occurred';
    return {
      success: false,
      message,
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: -1,
    };
  }
};

// Retry wrapper for API calls
export const withRetry = async (apiCall, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry for client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
};

// Upload progress tracker
export const uploadWithProgress = async (data, onProgress) => {
  const formData = new FormData();
  
  // Add image
  if (data.image) {
    formData.append('image', {
      uri: data.image.uri,
      type: data.image.type || 'image/jpeg',
      name: data.image.fileName || 'pothole.jpg',
    });
  }
  
  // Add other fields
  formData.append('longitude', data.longitude.toString());
  formData.append('latitude', data.latitude.toString());
  formData.append('roadType', data.roadType);
  
  if (data.description) {
    formData.append('description', data.description);
  }
  
  if (data.severity) {
    formData.append('severity', data.severity);
  }

  const response = await api.post('/potholes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const progress = (progressEvent.loaded / progressEvent.total) * 100;
      onProgress?.(Math.round(progress));
    },
  });
  
  return response.data;
};

export default api;