import { useEffect, useCallback } from 'react';
import { API_URL } from '../constants/config';

export const useHealthData = (selectedRange, setMessages, userId) => {
    const fetchData = useCallback(() => {
        if (!userId || !selectedRange) return;

        console.log(`📡 Fetching data for user: ${userId}, range: ${selectedRange}`);

        fetch(`${API_URL}/api/data/${userId}?timeRange=${selectedRange}`, {
            headers: {
                'Content-Type': 'application/json',
                // Add auth token if your routes are protected
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                return res.json();
            })
            .then(data => {
    console.log(`✅ Received ${data.length} records for ${selectedRange}`);
    // Only update if we got data — keeps chart visible when device is offline
    if (data && data.length > 0) {
        setMessages(data);
    }
})
            .catch(err => console.error('❌ Error fetching data:', err));
    }, [selectedRange, userId]);

    useEffect(() => {
        // Fetch immediately on mount or range/user change
        fetchData();

        // Auto-refresh every 10 seconds
        // (no need for 3s since Socket.io handles real-time updates)
        const intervalId = setInterval(fetchData, 10000);

        return () => clearInterval(intervalId);
    }, [fetchData]);
};