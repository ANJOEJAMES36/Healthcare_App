import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL, USER_ID } from '../constants/config';

export const useSocket = (userId = USER_ID) => {
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const [latestData, setLatestData] = useState(null);
    const [isLive, setIsLive] = useState(false); // true only when fresh MQTT data arrives
    const [messages, setMessages] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
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
            setIsLive(false); // connected but not live yet until MQTT data arrives
            socket.emit('join', userId);
        });

        socket.on('connect_error', (err) => {
            console.error('❌ Connection error:', err.message);
            setConnectionStatus('Disconnected');
            setIsLive(false);
        });

        socket.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 Reconnection attempt ${attempt}`);
            setConnectionStatus('Reconnecting...');
            setIsLive(false);
        });

        socket.on('disconnect', (reason) => {
            console.log(`❌ Disconnected: ${reason}`);
            setConnectionStatus('Disconnected');
            setIsLive(false);
        });

        // initial-data — historical records, don't mark as live
        socket.on('initial-data', (data) => {
            console.log(`📦 Initial data received: ${data.length} records`);
            if (data && data.length > 0) {
                setMessages(data);
                // Don't set latestData here — keeps metric cards showing '--'
                // until real live data arrives
            }
        });

        // mqtt-message — only this marks the connection as truly live
        socket.on('mqtt-message', (data) => {
            console.log('📨 New MQTT data:', data);
            setMessages((prev) => [data, ...prev].slice(0, 100));
            setLatestData(data);
            setConnectionStatus('Live');
            setIsLive(true);
        });

        socket.on('error', (err) => {
            console.error('❌ Socket error:', err);
        });

        return () => {
            socket.disconnect();
            setIsLive(false);
        };
    }, [userId]);

    return { connectionStatus, latestData, isLive, messages, setMessages, socket: socketRef.current };
};