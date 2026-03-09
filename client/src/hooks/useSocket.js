import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL, USER_ID } from '../constants/config';

export const useSocket = (userId = USER_ID) => {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [latestData, setLatestData] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [messages, setMessages] = useState([]);
    const socketRef = useRef(null);
    const liveTimeoutRef = useRef(null); // tracks when data was last received

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 3000,
        });

        socketRef.current = socket;

        const clearLiveTimeout = () => {
            if (liveTimeoutRef.current) {
                clearTimeout(liveTimeoutRef.current);
                liveTimeoutRef.current = null;
            }
        };

        const resetLiveTimeout = () => {
            clearLiveTimeout();
            // If no new data arrives in 15s, mark as no longer live
            liveTimeoutRef.current = setTimeout(() => {
                console.warn('⚠️ No MQTT data received for 15s — marking as not live');
                setIsLive(false);
                setConnectionStatus('No Data');
            }, 15000);
        };

        socket.on('connect', () => {
            console.log(`✅ Connected to backend as ${userId}`);
            setConnectionStatus('Waiting for Data');
            setIsLive(false);
            socket.emit('join', userId);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Connection error:', err.message);
            setConnectionStatus('Disconnected');
            setIsLive(false);
            clearLiveTimeout();
        });

        socket.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 Reconnection attempt ${attempt}`);
            setConnectionStatus('Reconnecting...');
            setIsLive(false);
            clearLiveTimeout();
        });

        socket.on('disconnect', (reason) => {
            console.log(`❌ Disconnected: ${reason}`);
            setConnectionStatus('Disconnected');
            setIsLive(false);
            clearLiveTimeout();
        });

        socket.on('initial-data', (data) => {
            console.log(`📦 Initial data received: ${data ? data.length : 0} records`);
            if (data) {
                setMessages(data);
            }
        });

        socket.on('mqtt-message', (data) => {
            console.log('📨 New MQTT data:', data);
            setMessages((prev) => [data, ...prev].slice(0, 100));
            setLatestData(data);
            setConnectionStatus('Live');
            setIsLive(true);
            resetLiveTimeout(); // restart the 15s countdown every time data arrives
        });

        socket.on('error', (err) => {
            console.error('❌ Socket error:', err);
        });

        return () => {
            socket.disconnect();
            setIsLive(false);
            clearLiveTimeout();
        };
    }, [userId]);

    return { connectionStatus, latestData, isLive, messages, setMessages, socket: socketRef.current };
};