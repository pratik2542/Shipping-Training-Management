const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://shipping-management.vercel.app/api'
  : 'http://localhost:5000/api';

export const getApiUrl = (endpoint) => {
  // Remove any leading slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${BASE_URL}/${cleanEndpoint}`;
  console.log('Making API request to:', url);
  return url;
};
