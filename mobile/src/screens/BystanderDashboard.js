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
                setHistoricalData(prev => {
                    // Keep any socket records newer than the latest REST record
                    const latestRestTime = new Date(history[history.length - 1].timestamp).getTime();
                    const newerSocket = prev.filter(d => new Date(d.timestamp).getTime() > latestRestTime);
                    return [...history, ...newerSocket];
                });
            }

            const latest = await getLatestData(userId);
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
        // Fetch once on mount / when range or user changes
        fetchData();

        const resetLiveTimeout = () => {
            if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
            liveTimeoutRef.current = setTimeout(() => setConnectionStatus('Offline'), 10000);
        };

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
            newSocket.emit('join', userId);
            resetLiveTimeout();
        });

        newSocket.on('connect_error', (err) => console.error('❌ Socket error:', err.message));

        newSocket.on('mqtt-message', (data) => {
            setLiveData(data);
            setHistoricalData(prev => [...prev, data]);
            setConnectionStatus('Live');
            resetLiveTimeout();
        });

        newSocket.on('initial-data', (data) => {
            if (data && data.length > 0) {
                setHistoricalData(data);
                setLiveData(data[data.length - 1]);
                setLoading(false);
            }
        });

        // NO setInterval — polling caused the time oscillation
        return () => {
            newSocket.disconnect();
            if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
        };
    }, [userId, timeRange, fetchData]);

    // ---- Warning thresholds (no motion warning) ----
    const WARNINGS = [
        {
            key: 'heartRate',
            danger: v => v < 50 || v > 120,
            warning: v => v < 60 || v > 100,
            dangerMsg: v => v < 50 ? `⚠️ Critical: Heart Rate ${v} BPM (too low!)` : `⚠️ Critical: Heart Rate ${v} BPM (too high!)`,
            warnMsg: v => v < 60 ? `⚡ Warning: Heart Rate ${v} BPM (low)` : `⚡ Warning: Heart Rate ${v} BPM (elevated)`,
        },
        {
            key: 'temperature',
            danger: v => v < 35.0 || v > 38.5,
            warning: v => v > 37.2 || v < 36.0,
            dangerMsg: v => v < 35.0 ? `⚠️ Critical: Temp ${v}°C (hypothermia risk!)` : `⚠️ Critical: Temp ${v}°C (high fever!)`,
            warnMsg: v => v > 37.2 ? `⚡ Warning: Temp ${v}°C (mild fever)` : `⚡ Warning: Temp ${v}°C (low)`,
        },
        {
            key: 'spo2',
            danger: v => v < 90,
            warning: v => v < 95,
            dangerMsg: v => `⚠️ Critical: SpO2 ${v}% (severe hypoxia!)`,
            warnMsg: v => `⚡ Warning: SpO2 ${v}% (low oxygen)`,
        },
    ];

    const renderWarnings = () => {
        if (!liveData) return null;
        const alerts = [];
        WARNINGS.forEach(w => {
            const v = liveData[w.key];
            if (v == null) return;
            if (w.danger(v)) alerts.push({ msg: w.dangerMsg(v), level: 'danger' });
            else if (w.warning(v)) alerts.push({ msg: w.warnMsg(v), level: 'warning' });
        });
        if (alerts.length === 0) return null;
        return (
            <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
                {alerts.map((a, i) => (
                    <View key={i} style={[
                        styles.alertBanner,
                        a.level === 'danger' ? styles.alertDanger : styles.alertWarning
                    ]}>
                        <Text style={styles.alertText}>{a.msg}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderChart = (label, dataKey, color) => {
        if (!historicalData || historicalData.length === 0) return null;

        const sorted = [...historicalData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Zip data + label together so they always stay in sync
        const pairs = sorted
            .map(d => ({
                val: d[dataKey],
                label: (() => {
                    const date = new Date(d.timestamp);
                    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                })()
            }))
            .filter(p => p.val != null && !isNaN(p.val));

        if (pairs.length === 0) return null;

        const step = Math.max(1, Math.ceil(pairs.length / 8));
        const sampled = pairs.filter((_, i) => i % step === 0).slice(-8).reverse();

        while (sampled.length < 2) sampled.push(sampled[0]);

        const filteredData = sampled.map(p => p.val);
        const filteredLabels = sampled.map(p => p.label);

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>{label}</Text>
                <LineChart
                    data={{ labels: filteredLabels, datasets: [{ data: filteredData }] }}
                    width={screenWidth - 40}
                    height={200}
                    yAxisSuffix={dataKey === 'temperature' ? '°C' : dataKey === 'spo2' ? '%' : ''}
                    chartConfig={{
                        backgroundColor: '#1a1a2e',
                        backgroundGradientFrom: '#1a1a2e',
                        backgroundGradientTo: '#16213e',
                        decimalPlaces: 1,
                        color: (opacity = 1) => color,
                        labelColor: (opacity = 1) => `rgba(200,200,255,${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: { r: '3', strokeWidth: '2', stroke: color },
                        propsForBackgroundLines: { strokeDasharray: '4', stroke: 'rgba(255,255,255,0.1)' }
                    }}
                    bezier
                    style={{ marginVertical: 4, borderRadius: 16 }}
                />
            </View>
        );
    };

    // Motion chart: colored bars per state (newest on left)
    const MOTION_COLORS = { sleep: '#74c0fc', sit: '#ffa94d', walk: '#a9e34b' };
    const MOTION_LABELS_MAP = { sleep: 'Sleep', sit: 'Sit', walk: 'Walk' };

    const renderMotionChart = () => {
        if (!historicalData || historicalData.length === 0) return null;

        const sorted = [...historicalData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const motionPoints = sorted.filter(d => d.motion != null);
        if (motionPoints.length === 0) return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>🏃 Motion</Text>
                <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>No motion data yet</Text>
            </View>
        );

        const recent = motionPoints.slice(-20).reverse();

        return (
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>🏃 Motion</Text>
                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 10, justifyContent: 'center' }}>
                    {Object.entries(MOTION_COLORS).map(([state, col]) => (
                        <View key={state} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col }} />
                            <Text style={{ color: '#ccc', fontSize: 12 }}>{MOTION_LABELS_MAP[state]}</Text>
                        </View>
                    ))}
                </View>
                <View style={{
                    flexDirection: 'row', height: 60, width: screenWidth - 40,
                    borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a2e'
                }}>
                    {recent.map((d, i) => (
                        <View
                            key={i}
                            style={{
                                flex: 1,
                                backgroundColor: MOTION_COLORS[d.motion] || '#333',
                                opacity: 0.85,
                                borderRightWidth: i < recent.length - 1 ? 1 : 0,
                                borderRightColor: '#0f0f1e'
                            }}
                        />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: screenWidth - 40, marginTop: 4 }}>
                    <Text style={{ color: '#888', fontSize: 10 }}>
                        {'← NOW  '}
                        {new Date(recent[0]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={{ color: '#888', fontSize: 10 }}>
                        {new Date(recent[recent.length - 1]?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {'  OLDER →'}
                    </Text>
                </View>
                <Text style={{ color: MOTION_COLORS[recent[0]?.motion], fontWeight: 'bold', marginTop: 8, fontSize: 14 }}>
                    Current: {MOTION_LABELS_MAP[recent[0]?.motion] || '--'}
                </Text>
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

            {/* Warning alerts */}
            {renderWarnings()}

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
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Motion</Text>
                    <Text style={[styles.cardValue, { color: '#a9e34b', fontSize: 16 }]}>
                        {liveData?.motion === 'sit' ? '🪑 Sit'
                            : liveData?.motion === 'walk' ? '🚶 Walk'
                                : liveData?.motion === 'sleep' ? '😴 Sleep'
                                    : '--'}
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
                    {renderChart('❤️ Heart Rate', 'heartRate', '#ff4757')}
                    {renderChart('💧 Oxygen Saturation', 'spo2', '#06ffa5')}
                    {renderChart('🌡️ Temperature', 'temperature', '#ffa502')}
                    {renderMotionChart()}
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
    liveContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 10,
    },
    card: {
        backgroundColor: '#1a1a2e',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        width: '47%',
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#333'
    },
    cardLabel: { color: '#aaa', marginBottom: 5, fontSize: 12 },
    cardValue: { fontSize: 24, fontWeight: 'bold' },
    unit: { fontSize: 16, color: '#aaa', fontWeight: 'bold' },
    toggleContainerWrapper: { marginBottom: 20, marginHorizontal: 10 },
    toggleContainer: { flexDirection: 'row', padding: 5, backgroundColor: '#1a1a2e', borderRadius: 10 },
    toggleButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, marginHorizontal: 5 },
    activeToggle: { backgroundColor: '#4361ee' },
    toggleText: { color: 'white', fontWeight: 'bold' },
    chartContainer: { padding: 10, alignItems: 'center' },
    chartTitle: { color: 'white', fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
    alertBanner: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 10, padding: 12, marginBottom: 8,
        borderLeftWidth: 4,
    },
    alertDanger: { backgroundColor: 'rgba(230,57,70,0.18)', borderLeftColor: '#e63946' },
    alertWarning: { backgroundColor: 'rgba(255,178,0,0.15)', borderLeftColor: '#ffb200' },
    alertText: { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
});

export default BystanderDashboard;