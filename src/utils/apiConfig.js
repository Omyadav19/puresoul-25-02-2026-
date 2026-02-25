// src/utils/apiConfig.js
// Centralized configuration for API base URL and endpoints

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://puresoul-25-02-2026.onrender.com';

export const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};
