const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://shipping-management.vercel.app/api/notify-admin'  // Direct path to function
  : 'http://localhost:5000/api/notify-admin';

export const getApiUrl = () => {
  console.log('Using API URL:', API_URL);
  return API_URL;
};
