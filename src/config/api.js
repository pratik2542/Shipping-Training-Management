const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://shipping-management.vercel.app/api'  // Production API URL
  : 'http://localhost:5000/api';  // Development API URL

export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_URL}/${cleanEndpoint}`;
  console.log('Making API request to:', url);
  return url;
};
