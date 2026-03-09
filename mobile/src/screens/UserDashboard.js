import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LineChart } from 'react-native-chart-kit';
import io from 'socket.io-client';
import { getHistoricalData, getLatestData } from '../services/DataService';
import { logoutUser } from '../services/AuthService';

const screenWidth = Dimensions.get('window').width;
const SOCKET_URL = 'https://health-care-app-iot.onrender.com';

const formatDisplayName = (name) => {
    if (!name) return '';
    const formatted = name.charAt(0).toUpperCase() + name.slice(1);
    return formatted.replace(/(\d+)/g, ' $1').trim();
};

const UserDashboard = ({ route, navigation }) => {
    const actualUser = route.params.user.user || route.params.user;
    const userId = actualUser.userId;

    const [liveData, setLiveData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [timeRange, setTimeRange] = useState('10min');
    const [loading, setLoading] = useState(true);

    const handleLogout = async () => {
        await logoutUser(); // clear AsyncStorage
        navigation.replace('Login');
    };

    const fetchData = useCallback(async () => {
    try {
        const history = await getHistoricalData(userId, timeRange);
        // Only update if we got data — keeps chart visible when device is offline
        if (history && history.length > 0) {
            setHistoricalData(history);
        }

        const latest = await getLatestData(userId);
        // Only update if latest has actual data
        if (latest && Object.keys(latest).length > 0) {
            setLiveData(latest);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    } finally {
        setLoading(false);
    }
}, [userId, timeRange]);

    useEffect(() => {
        fetchData();

        // Pass userId in handshake query — matches updated backend
        const newSocket = io(SOCKET_URL, {
            query: { userId },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 3000,
        });

        newSocket.on('connect', () => {
            console.log('✅ User socket connected');
            newSocket.emit('join', userId);
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });

        // Backend emits 'mqtt-message' not 'sensorData'
        newSocket.on('mqtt-message', (data) => {
            console.log('📨 Live data received:', data);
            setLiveData(data);
            setHistoricalData(prev => [...prev, data].slice(-20));
        });

        // Backend sends initial history on connect
        newSocket.on('initial-data', (data) => {
            if (data && data.length > 0) {
                setHistoricalData(data);
                setLiveData(data[0]);
                setLoading(false);
            }
        });

        const interval = setInterval(fetchData, 10000);

        return () => {
            newSocket.disconnect();
            clearInterval(interval);
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
                <Text style={styles.welcomeText}>
                    Welcome, {formatDisplayName(actualUser.name || userId)}
                </Text>
                <TouchableOpacity style={styles.logoutButtonTop} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.liveContainer}>
                <View style={[styles.card, styles.dataCard]}>
                    <Text style={styles.cardLabel}>Heart Rate</Text>
                    <Text style={[styles.cardValue, { color: '#ff4757' }]}>
                        {liveData?.heartRate ?? '--'} <Text style={styles.unit}>BPM</Text>
                    </Text>
                </View>
                <View style={[styles.card, styles.dataCard]}>
                    <Text style={styles.cardLabel}>SpO2</Text>
                    <Text style={[styles.cardValue, { color: '#06ffa5' }]}>
                        {liveData?.spo2 ?? '--'} <Text style={styles.unit}>%</Text>
                    </Text>
                </View>
                <View style={[styles.card, styles.dataCard]}>
                    <Text style={styles.cardLabel}>Temp</Text>
                    <Text style={[styles.cardValue, { color: '#ffa502' }]}>
                        {liveData?.temperature ?? '--'} <Text style={styles.unit}>°C</Text>
                    </Text>
                </View>
            </View>

            <View style={styles.qrCard}>
                <Text style={styles.cardTitle}>Your Patient ID</Text>
                <Text style={styles.cardSubtitle}>Show this code to a nurse or bystander.</Text>
                <View style={styles.qrContainer}>
                    <QRCode value={userId} size={160} color="black" backgroundColor="white" quietZone={10} />
                </View>
                <Text style={styles.userIdText}>
                    Patient ID: {formatDisplayName(actualUser.name || userId)}
                </Text>
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
                <View style={styles.chartsWrapper}>
                    {renderChart('Heart Rate', 'heartRate', '#ff4757')}
                    {renderChart('Oxygen Saturation', 'spo2', '#06ffa5')}
                    {renderChart('Temperature', 'temperature', '#ffa502')}
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f1e' },
    header: { padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#333' },
    welcomeText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    logoutButtonTop: { backgroundColor: '#ff4757', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    logoutText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    liveContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
    card: { backgroundColor: '#1a1a2e', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    dataCard: { padding: 15, width: '31%' },
    qrCard: { backgroundColor: '#1a1a2e', padding: 30, borderRadius: 24, alignItems: 'center', marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: '#333' },
    cardLabel: { color: '#aaa', marginBottom: 5, fontSize: 12 },
    cardValue: { fontSize: 24, fontWeight: 'bold' },
    unit: { fontSize: 12, color: '#aaa', fontWeight: 'normal' },
    cardTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    cardSubtitle: { color: '#888', textAlign: 'center', marginBottom: 20, fontSize: 13 },
    qrContainer: { padding: 15, backgroundColor: 'white', borderRadius: 16, borderWidth: 4, borderColor: '#f0f0f0', overflow: 'hidden' },
    userIdText: { color: '#4361ee', marginTop: 15, fontSize: 16, fontWeight: 'bold' },
    toggleContainerWrapper: { marginBottom: 20, marginHorizontal: 10 },
    toggleContainer: { flexDirection: 'row', padding: 5, backgroundColor: '#1a1a2e', borderRadius: 10 },
    toggleButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginHorizontal: 5 },
    activeToggle: { backgroundColor: '#4361ee' },
    toggleText: { color: 'white', fontWeight: 'bold' },
    chartsWrapper: { paddingBottom: 20 },
    chartContainer: { padding: 10, alignItems: 'center' },
    chartTitle: { color: 'white', fontSize: 16, marginBottom: 10, fontWeight: 'bold' }
});

export default UserDashboard;