const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://shipping-management.vercel.app' 
  : 'http://localhost:5000';

export const getApiUrl = (endpoint) => `${API_URL}${endpoint}`;
