import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL, USER_ID } from '../constants/config';

export const useSocket = (userId = USER_ID) => {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [latestData, setLatestData] = useState(null);
    const [messages, setMessages] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        // Pass userId in handshake query — backend uses this to join the right room
        const socket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 3000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log(`✅ Connected to backend as ${userId}`);
            setConnectionStatus('Connected');

            // Explicitly join personal room after connect
            socket.emit('join', userId);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Connection error:', err.message);
            setConnectionStatus('Error');
        });

        socket.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 Reconnection attempt ${attempt}`);
            setConnectionStatus('Reconnecting...');
        });

        socket.on('disconnect', (reason) => {
            console.log(`❌ Disconnected: ${reason}`);
            setConnectionStatus('Disconnected');
        });

        // initial-data is already filtered by userId on the backend
        socket.on('initial-data', (data) => {
            console.log(`📦 Initial data received: ${data.length} records`);
            setMessages(data);
            if (data.length > 0) {
                setLatestData(data[0]);
            }
        });

        // mqtt-message is sent only to this user's room — no need to filter
        socket.on('mqtt-message', (data) => {
            console.log('📨 New MQTT data:', data);
            setMessages((prev) => [data, ...prev].slice(0, 100));
            setLatestData(data);
        });

        socket.on('error', (err) => {
            console.error('❌ Socket error:', err);
        });

        return () => {
            socket.disconnect();
        };
    }, [userId]); // re-run if userId changes

    return { connectionStatus, latestData, messages, setMessages, socket: socketRef.current };
};