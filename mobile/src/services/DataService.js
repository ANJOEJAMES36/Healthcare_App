import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://health-care-app-iot.onrender.com/api';

// Helper to get auth headers
const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getLatestData = async (userId) => {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/data/${userId}/latest`, { headers, timeout: 10000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching latest data:', error.response?.data || error.message);
        return null;
    }
};

export const getHistoricalData = async (userId, timeRange) => {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_URL}/data/${userId}`, {
            headers,
            params: { timeRange },
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching historical data:', error.response?.data || error.message);
        return [];
    }
};