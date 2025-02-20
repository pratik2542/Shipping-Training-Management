const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://shipping-management.vercel.app/api'
  : 'http://localhost:5000/api/notify-admin';

export const getApiUrl = (endpoint) => {
  const url = `${API_URL}${endpoint}`;
  console.log('API Request:', { url, environment: process.env.NODE_ENV });
  return url;
};
