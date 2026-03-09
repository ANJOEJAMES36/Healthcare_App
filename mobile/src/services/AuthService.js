import axios from 'axios';

// Replace with your actual local IP address when testing on physical device
// For Android Emulator, use 'http://10.0.2.2:5000'
const API_URL = 'https://health-care-app-iot.onrender.com/api';

export const loginUser = async (userId, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, { username: userId, password }, { timeout: 5000 });
        return response.data;
    } catch (error) {
        console.log('AuthService Error Details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status
        });
        if (error.response) {
            throw error.response.data?.error || `Server Error: ${error.response.status}`;
        } else if (error.request) {
            throw `Network Error: No response received. Check IP ${API_URL}`;
        } else {
            throw error.message || 'Login failed';
        }
    }
};
