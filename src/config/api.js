const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://shipping-management.vercel.app/api'  // Production
  : 'http://localhost:5000/api';  // Local server port

export const getApiUrl = (endpoint) => {
  const url = `${API_URL}${endpoint}`;
  console.log('Testing API endpoint:', url); // Debug log
  return url;
};
