// Create a dedicated helper for Firebase Auth API calls

import { getApiKey } from '../firebase/config';

// Base endpoints
const AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

/**
 * Makes a secure call to Firebase Auth REST API
 * @param {string} endpoint - The endpoint to call
 * @param {Object} data - The data to send
 * @returns {Promise<Object>} - The API response
 */
export const callFirebaseAuthApi = async (endpoint, data) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('API key not available');
    
    const url = `${AUTH_BASE_URL}:${endpoint}?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return await response.json();
  } catch (error) {
    console.error(`Firebase Auth API error (${endpoint}):`, error);
    throw error;
  }
};

// API methods for specific operations
export const createUser = (email, password) => {
  return callFirebaseAuthApi('signUp', {
    email,
    password,
    returnSecureToken: false
  });
};

export const verifyEmail = (email) => {
  return callFirebaseAuthApi('createAuthUri', {
    identifier: email,
    continueUri: window.location.href
  });
};

export const sendPasswordReset = (email) => {
  return callFirebaseAuthApi('sendOobCode', {
    requestType: 'PASSWORD_RESET',
    email
  });
};

export const verifyPassword = (email, password) => {
  return callFirebaseAuthApi('signInWithPassword', {
    email,
    password,
    returnSecureToken: true
  });
};
