const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://shipping-management.vercel.app'  // Production API URL
  : 'http://localhost:5000/api/';  // Development API URL

export const getApiUrl = (endpoint) => {
  const url = `${API_URL}${endpoint}`;
  console.log('API Request to:', url); // Debug log
  return url;
};
