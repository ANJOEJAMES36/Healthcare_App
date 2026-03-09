import axios from 'axios';

// Replace with your actual local IP address when testing on physical device
// For Android Emulator, use 'http://10.0.2.2:5000'
const API_URL = 'https://health-care-app-iot.onrender.com/api';

export const getLatestData = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/data/${userId}/latest`);
        return response.data;
    } catch (error) {
        console.error('Error fetching latest data', error);
        return null;
    }
};

export const getHistoricalData = async (userId, timeRange) => {
    try {
        const response = await axios.get(`${API_URL}/data/${userId}`, { params: { timeRange } });
        return response.data;
    } catch (error) {
        console.error('Error fetching historical data', error);
        return [];
    }
};
