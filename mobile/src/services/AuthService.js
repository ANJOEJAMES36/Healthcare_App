import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://health-care-app-iot.onrender.com/api';

export const loginUser = async (userId, password) => {
    try {
        const response = await axios.post(
            `${API_URL}/auth/login`,
            { username: userId, password },
            { timeout: 10000 } // increased to 10s — Render free tier cold starts can be slow
        );

        // Store token and user in AsyncStorage for use across the app
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));

        return response.data;

    } catch (error) {
        console.log('AuthService Error:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status
        });

        if (error.response) {
            throw error.response.data?.error || `Server Error: ${error.response.status}`;
        } else if (error.request) {
            throw 'Network Error: Could not reach server. Check your connection.';
        } else {
            throw error.message || 'Login failed';
        }
    }
};

export const logoutUser = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
};

export const getStoredUser = async () => {
    try {
        const user = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        return user ? { user: JSON.parse(user), token } : null;
    } catch {
        return null;
    }
};