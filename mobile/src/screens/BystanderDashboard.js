import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import io from 'socket.io-client';
import { getHistoricalData, getLatestData } from '../services/DataService';

const screenWidth = Dimensions.get('window').width;
const SOCKET_URL = 'https://health-care-app-iot.onrender.com';

const formatDisplayName = (name) => {
    if (!name) return '';
    const formatted = name.charAt(0).toUpperCase() + name.slice(1);
    return formatted.replace(/(\d+)/g, ' $1').trim();
};

const BystanderDashboard = ({ route, navigation }) => {
    const { userId, userName } = route.params; // userName now passed from DoctorDashboard
    const [liveData, setLiveData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [timeRange, setTimeRange] = useState('10min');
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const liveTimeoutRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const history = await getHistoricalData(userId, timeRange);
            if (history && history.length > 0) {
                setHistoricalData(prev => JSON.stringify(prev) === JSON.stringify(history) ? prev : history);
            }

            const latest = await getLatestData(userId);
            // Only update if latest has actual data
            if (latest && Object.keys(latest).length > 0) {
                setLiveData(prev => JSON.stringify(prev) === JSON.stringify(latest) ? prev : latest);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, timeRange]);

    useEffect(() => {
        fetchData();

        const resetLiveTimeout = () => {
            if (liveTimeoutRef.current) {
                clearTimeout(liveTimeoutRef.current);
            }
            liveTimeoutRef.current = setTimeout(() => {
                setConnectionStatus('Offline');
            }, 10000);
        };

        // Pass userId in handshake query — matches updated backend
        const newSocket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 3000,
        });

        newSocket.on('connect', () => {
            console.log('✅ Bystander socket connected');
            setConnectionStatus('Waiting for Data');
            // Join the user's room
            newSocket.emit('join', userId);
            resetLiveTimeout();
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });

        // Backend emits 'mqtt-message' not 'sensorData'
        newSocket.on('mqtt-message', (data) => {
            console.log('📨 Live data received:', data);
            setLiveData(data);
            setHistoricalData(prev => [...prev, data]);
            setConnectionStatus('Live');
            resetLiveTimeout();
        });

        // Backend emits 'initial-data' on connection
        newSocket.on('initial-data', (data) => {
            if (data) {
                setHistoricalData(data);
                if (data.length > 0) setLiveData(data[data.length - 1]);
                setLoading(false);
            }
        });

        const interval = setInterval(fetchData, 10000);

        return () => {
            newSocket.disconnect();
            clearInterval(interval);
            if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
        };
    }, [userId, timeRange, fetchData]);

    const renderChart = (label, dataKey, color) => {
        if (!historicalData || historicalData.length === 0) return null;

        const dataPoints = historicalData.map(d => d[dataKey]).filter(val => val != null);
        const labels = historicalData.map(d => {
            const date = new Date(d.timestamp);
            return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        });

        const step = Math.ceil(dataPoints.length / 6);
        const filteredData = dataPoints.filter((_, i) => i % step === 0).slice(-6);
        const filteredLabels = labels.filter((_, i) => i % step === 0).slice(-6);

        if (filteredData.length === 0) return <Text style={{ color: 'white' }}>No Data</Text>;

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{label}</Text>
                <LineChart
                    data={{ labels: filteredLabels, datasets: [{ data: filteredData }] }}
                    width={screenWidth - 40}
                    height={220}
                    yAxisSuffix={dataKey === 'temperature' ? '°C' : ''}
                    chartConfig={{
                        backgroundColor: '#1a1a2e',
                        backgroundGradientFrom: '#1a1a2e',
                        backgroundGradientTo: '#1a1a2e',
                        decimalPlaces: 1,
                        color: (opacity = 1) => color,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: { r: "4", strokeWidth: "2", stroke: color }
                    }}
                    bezier
                    style={{ marginVertical: 8, borderRadius: 16 }}
                />
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Monitoring: {userName || formatDisplayName(userId)}
                </Text>
            </View>

            {/* Connection Status Indicator */}
            <View style={styles.statusContainer}>
                <View style={[styles.statusDot,
                connectionStatus === 'Live' ? { backgroundColor: '#06ffa5' } :
                    connectionStatus === 'Waiting for Data' ? { backgroundColor: '#ffd32a' } :
                        { backgroundColor: '#ff4757' }
                ]} />
                <Text style={styles.statusText}>{connectionStatus}</Text>
            </View>

            <View style={styles.liveContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Heart Rate</Text>
                    <Text style={[styles.cardValue, { color: '#ff4757' }]}>
                        {liveData?.heartRate ?? '--'} <Text style={styles.unit}>BPM</Text>
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>SpO2</Text>
                    <Text style={[styles.cardValue, { color: '#06ffa5' }]}>
                        {liveData?.spo2 ?? '--'} <Text style={styles.unit}>%</Text>
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Temp</Text>
                    <Text style={[styles.cardValue, { color: '#ffa502' }]}>
                        {liveData?.temperature ?? '--'} <Text style={styles.unit}>°C</Text>
                    </Text>
                </View>
            </View>

            <View style={styles.toggleContainerWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toggleContainer}>
                    {[
                        { label: '10 Min', value: '10min' },
                        { label: '30 Min', value: '30min' },
                        { label: '1 Hour', value: '1hr' },
                        { label: '4 Hours', value: '4hr' },
                        { label: '8 Hours', value: '8hr' },
                        { label: '12 Hours', value: '12hr' },
                        { label: '24 Hours', value: '24hr' }
                    ].map((range) => (
                        <TouchableOpacity
                            key={range.value}
                            style={[styles.toggleButton, timeRange === range.value && styles.activeToggle]}
                            onPress={() => setTimeRange(range.value)}
                        >
                            <Text style={styles.toggleText}>{range.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? <ActivityIndicator size="large" color="#4361ee" /> : (
                <View>
                    {renderChart('Heart Rate', 'heartRate', '#ff4757')}
                    {renderChart('Oxygen Saturation', 'spo2', '#06ffa5')}
                    {renderChart('Temperature', 'temperature', '#ffa502')}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f1e' },
    header: { padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', paddingBottom: 25 },
    backButton: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
    backText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: -3 },
    headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginLeft: 15 },
    statusContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: -10, marginBottom: 15 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    statusText: { color: '#ccc', fontSize: 14, fontWeight: 'bold' },
    liveContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
    card: { backgroundColor: '#1a1a2e', padding: 15, borderRadius: 12, alignItems: 'center', width: '30%', borderWidth: 1, borderColor: '#333' },
    cardLabel: { color: '#aaa', marginBottom: 5, fontSize: 12 },
    cardValue: { fontSize: 24, fontWeight: 'bold' },
    unit: { fontSize: 16, color: '#aaa', fontWeight: 'bold' },
    toggleContainerWrapper: { marginBottom: 20, marginHorizontal: 10 },
    toggleContainer: { flexDirection: 'row', padding: 5, backgroundColor: '#1a1a2e', borderRadius: 10 },
    toggleButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginHorizontal: 5 },
    activeToggle: { backgroundColor: '#4361ee' },
    toggleText: { color: 'white', fontWeight: 'bold' },
    chartContainer: { padding: 10, alignItems: 'center' },
    chartTitle: { color: 'white', fontSize: 16, marginBottom: 10, fontWeight: 'bold' }
});

export default BystanderDashboard;