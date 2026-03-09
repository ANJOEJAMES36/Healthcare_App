import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import io from 'socket.io-client';
import { getHistoricalData, getLatestData } from '../services/DataService';

const screenWidth = Dimensions.get('window').width;

// Replace with your actual local IP address
const SOCKET_URL = 'https://health-care-app-iot.onrender.com';

// Helper to format names like 'user2' to 'User 2'
const formatDisplayName = (name) => {
    if (!name) return '';
    // Capitalize first letter and add space before numbers
    const formatted = name.charAt(0).toUpperCase() + name.slice(1);
    return formatted.replace(/(\d+)/g, ' $1').trim();
};

const BystanderDashboard = ({ route, navigation }) => {
    const { userId } = route.params;
    const [liveData, setLiveData] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);
    const [timeRange, setTimeRange] = useState('10min'); // default to 10 minutes
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial Fetch
        fetchData();

        // Socket Connection
        const newSocket = io(SOCKET_URL);
        newSocket.on('connect', () => {
            console.log('Socket connected');
            newSocket.emit('joinRoom', userId);
        });

        newSocket.on('sensorData', (data) => {
            if (data.userId === userId) {
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
    }, [userId, timeRange]);

    const fetchData = async () => {
        try {
            const history = await getHistoricalData(userId, timeRange);
            setHistoricalData(history);

            const latest = await getLatestData(userId);
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
            return `${date.getHours()}:${date.getMinutes()} `;
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Monitoring: {formatDisplayName(userId)}</Text>
            </View>

            {/* Live Data Cards */}
            <View style={styles.liveContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Heart Rate</Text>
                    <Text style={[styles.cardValue, { color: '#ff4757' }]}>
                        {liveData?.heartRate || '--'} <Text style={styles.unit}>BPM</Text>
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>SpO2</Text>
                    <Text style={[styles.cardValue, { color: '#06ffa5' }]}>
                        {liveData?.spo2 || '--'} <Text style={styles.unit}>%</Text>
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Temp</Text>
                    <Text style={[styles.cardValue, { color: '#ffa502' }]}>
                        {liveData?.temperature || '--'} <Text style={styles.unit}>°C</Text>
                    </Text>
                </View>
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
    container: {
        flex: 1,
        backgroundColor: '#0f0f1e',
    },
    header: {
        padding: 20,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 25,
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#1a1a2e',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    backText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: -3,
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginLeft: 15,
    },
    liveContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
    },
    card: {
        backgroundColor: '#1a1a2e',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        width: '30%',
        borderWidth: 1,
        borderColor: '#333',
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
        fontSize: 16,
        color: '#aaa',
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

export default BystanderDashboard;
