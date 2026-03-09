import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import MetricCard from './MetricCard';
import ChartCard from './ChartCard';
import DataTable from './DataTable';
import { useSocket } from '../hooks/useSocket';
import { useHealthData } from '../hooks/useHealthData';
import { formatChartData } from '../utils/formatters';
import { METRICS, API_URL, TIME_RANGES } from '../constants/config';
import { QRCodeCanvas } from 'qrcode.react';
import '../index.css';

// Time range selector inline (remove if you have a separate component)
const TimeRangeSelector = ({ selectedRange, onRangeChange }) => (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {TIME_RANGES.map(range => (
            <button
                key={range.value}
                onClick={() => onRangeChange(range.value)}
                style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    background: selectedRange === range.value
                        ? 'linear-gradient(90deg, #4361ee, #06ffa5)'
                        : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: selectedRange === range.value ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                }}
            >
                {range.label}
            </button>
        ))}
    </div>
);

const Dashboard = ({ viewingUserId, userName, onBack }) => {
    const [selectedRange, setSelectedRange] = useState('1hr');
    const [thresholds, setThresholds] = useState({
        temperature: { low: 36, high: 37.5 },
        heartRate: { low: 60, high: 100 },
        spo2: { low: 95, high: 100 },
        bloodPressure: { low: 90, high: 140 }
    });

    // Pass viewingUserId so socket joins the correct room
    const { connectionStatus, latestData, messages, setMessages } = useSocket(viewingUserId);
    useHealthData(selectedRange, setMessages, viewingUserId);

    // Fetch thresholds
    useEffect(() => {
        fetch(`${API_URL}/api/thresholds`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                return res.json();
            })
            .then(data => setThresholds(data))
            .catch(err => console.error('Error fetching thresholds:', err));
    }, []); // only fetch once on mount

    const chartData = formatChartData(messages, selectedRange);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
            padding: '20px'
        }}>
            <Header
                userName={userName}
                connectionStatus={connectionStatus}
                onBack={onBack}
            />

            {/* Metric Cards + QR Code */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                {Object.entries(METRICS).map(([key, config]) => (
                    <MetricCard
                        key={key}
                        title={config.title}
                        value={latestData?.[key]}
                        unit={config.unit}
                        emoji={config.emoji}
                        accentColor={config.color}
                        metric={key}
                        thresholds={thresholds}
                    />
                ))}

                {/* QR Code Card */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '16px'
                    }}>
                        <QRCodeCanvas value={viewingUserId} size={120} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: 0, color: 'var(--success)', fontSize: '1.1em' }}>Patient ID Code</h3>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                            Scan for mobile access
                        </p>
                    </div>
                </div>
            </div>

            <TimeRangeSelector
                selectedRange={selectedRange}
                onRangeChange={setSelectedRange}
            />

            {/* Charts */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <ChartCard title="🌡️ Temperature" data={chartData} dataKey="temperature" color="var(--accent-temperature)" />
                <ChartCard title="❤️ Heart Rate" data={chartData} dataKey="heartRate" color="var(--accent-heart)" />
                <ChartCard title="💧 SpO2" data={chartData} dataKey="spo2" color="var(--accent-spo2)" />
                <ChartCard title="🩺 Blood Pressure" data={chartData} dataKey="bloodPressure" color="var(--accent-bp)" />
            </div>

            <DataTable messages={messages} />
        </div>
    );
};

Dashboard.propTypes = {
    viewingUserId: PropTypes.string.isRequired,
    userName: PropTypes.string.isRequired,
    onBack: PropTypes.func
};

export default Dashboard;