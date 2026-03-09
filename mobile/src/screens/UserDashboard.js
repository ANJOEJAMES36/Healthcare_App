import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { LineChart } from 'react-native-chart-kit';
import io from 'socket.io-client';
import { getHistoricalData, getLatestData } from '../services/DataService';

const screenWidth = Dimensions.get('window').width;

// Helper to format names like 'user2' to 'User 2'
const formatDisplayName = (name) => {
    if (!name) return '';
    // Capitalize first letter and add space before numbers
    const formatted = name.charAt(0).toUpperCase() + name.slice(1);
    return formatted.replace(/(\d+)/g, ' $1').trim();
};

// Get IP from DataService since we updated it there previously
const SOCKET_URL = 'https://health-care-app-iot.onrender.com';

const UserDashboard = ({ route, navigation }) => {
    // The login success object contains the token and the actual user object nested inside
    const actualUser = route.params.user.user || route.params.user;

    const [liveData, setLiveData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [timeRange, setTimeRange] = useState('10min'); // default to 10 minutes
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        navigation.replace('Login');
    };

    useEffect(() => {
        // Initial Fetch
        fetchData();

        // Socket Connection
        const newSocket = io(SOCKET_URL);
        newSocket.on('connect', () => {
            console.log('User Socket connected');
            newSocket.emit('joinRoom', actualUser.userId);
        });

        newSocket.on('sensorData', (data) => {
            if (data.userId === actualUser.userId) {
                setLiveData(data);
                // Optionally append to historical data for real-time chart update
                setHistoricalData(prev => [...prev, data].slice(-20)); // Keep last 20 points
            }
        });

        // Polling as fallback/supplement for "Live" historical graph if socket only sends current reading
        const interval = setInterval(fetchData, 10000);

        return () => {
            newSocket.disconnect();
            clearInterval(interval);
        };
    }, [actualUser.userId, timeRange]);

    const fetchData = async () => {
        try {
            const history = await getHistoricalData(actualUser.userId, timeRange);
            setHistoricalData(history);

            const latest = await getLatestData(actualUser.userId);
            if (latest) setLiveData(latest);

            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const renderChart = (label, dataKey, color) => {
        if (!historicalData || historicalData.length === 0) return null;

        const dataPoints = historicalData.map(d => d[dataKey]).filter(val => val != null);
        const labels = historicalData.map(d => {
            const date = new Date(d.timestamp);
            return `${date.getHours()}:${date.getMinutes()}`;
        });

        // Downsample for performance on mobile
        const step = Math.ceil(dataPoints.length / 6);
        const filteredData = dataPoints.filter((_, i) => i % step === 0).slice(-6);
        const filteredLabels = labels.filter((_, i) => i % step === 0).slice(-6);

        if (filteredData.length === 0) return <Text style={{ color: 'white' }}>No Data</Text>;

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{label}</Text>
                <LineChart
                    data={{
                        labels: filteredLabels,
                        datasets: [{ data: filteredData }]
                    }}
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
                <Text style={styles.welcomeText}>Welcome, {formatDisplayName(actualUser.name || actualUser.userId)}</Text>
                <TouchableOpacity style={styles.logoutButtonTop} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Live Data Cards */}
            <View style={styles.liveContainer}>
                <View style={[styles.card, styles.dataCard]}>
                    <Text style={styles.cardLabel}>Heart Rate</Text>
                    <Text style={[styles.cardValue, { color: '#ff4757' }]}>
                        {liveData?.heartRate || '--'} <Text style={styles.unit}>BPM</Text>
                    </Text>
                </View>
                <View style={[styles.card, styles.dataCard]}>
                    <Text style={styles.cardLabel}>SpO2</Text>
                    <Text style={[styles.cardValue, { color: '#06ffa5' }]}>
                        {liveData?.spo2 || '--'} <Text style={styles.unit}>%</Text>
                    </Text>
                </View>
                <View style={[styles.card, styles.dataCard]}>
                    <Text style={styles.cardLabel}>Temp</Text>
                    <Text style={[styles.cardValue, { color: '#ffa502' }]}>
                        {liveData?.temperature || '--'} <Text style={styles.unit}>°C</Text>
                    </Text>
                </View>
            </View>

            {/* QR Code Section */}
            <View style={styles.qrCard}>
                <Text style={styles.cardTitle}>Your Patient ID</Text>
                <Text style={styles.cardSubtitle}>
                    Show this code to a nurse or bystander.
                </Text>

                <View style={styles.qrContainer}>
                    <QRCode
                        value={actualUser.userId}
                        size={160}
                        color="black"
                        backgroundColor="white"
                        quietZone={10}
                    />
                </View>
                <Text style={styles.userIdText}>Patient ID: {formatDisplayName(actualUser.name || actualUser.userId)}</Text>
            </View>

            {/* Time Range Selector */}
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
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e',
    },
    header: {
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    welcomeText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    logoutButtonTop: {
        backgroundColor: '#ff4757',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    liveContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    card: {
        backgroundColor: '#1a1a2e',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    dataCard: {
        padding: 15,
        width: '31%',
    },
    qrCard: {
        backgroundColor: '#1a1a2e',
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    cardLabel: {
        color: '#aaa',
        marginBottom: 5,
        fontSize: 12,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    unit: {
        fontSize: 12,
        color: '#aaa',
        fontWeight: 'normal',
    },
    cardTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    cardSubtitle: {
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 13,
    },
    qrContainer: {
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 4,
        borderColor: '#f0f0f0',
        overflow: 'hidden',
    },
    userIdText: {
        color: '#4361ee',
        marginTop: 15,
        fontSize: 16,
        fontWeight: 'bold',
    },
    toggleContainerWrapper: {
        marginBottom: 20,
        marginHorizontal: 10,
    },
    toggleContainer: {
        flexDirection: 'row',
        padding: 5,
        backgroundColor: '#1a1a2e',
        borderRadius: 10,
    },
    toggleButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    activeToggle: {
        backgroundColor: '#4361ee',
    },
    toggleText: {
        color: 'white',
        fontWeight: 'bold',
    },
    chartsWrapper: {
        paddingBottom: 20,
    },
    chartContainer: {
        padding: 10,
        alignItems: 'center',
    },
    chartTitle: {
        color: 'white',
        fontSize: 16,
        marginBottom: 10,
        fontWeight: 'bold',
    }
});

export default UserDashboard;
