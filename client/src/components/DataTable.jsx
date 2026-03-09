import PropTypes from 'prop-types';

const DataTable = ({ messages }) => {
    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            overflow: 'auto'
        }}>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>📋 Historical Data</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Time</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Temperature (°C)</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Heart Rate (bpm)</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>SpO2 (%)</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Blood Pressure</th>
                    </tr>
                </thead>
                <tbody>
                    {messages.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                No data available for selected time range
                            </td>
                        </tr>
                    ) : (
                        messages.slice(0, 20).map((msg) => (
                            <tr key={msg._id || msg.timestamp} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                                    {new Date(msg.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--accent-temperature)', fontWeight: '600' }}>
                                    {msg.temperature !== undefined ? `${msg.temperature}°C` : '--'}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--accent-heart)', fontWeight: '600' }}>
                                    {msg.heartRate !== undefined ? `${msg.heartRate} bpm` : '--'}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--accent-spo2)', fontWeight: '600' }}>
                                    {msg.spo2 !== undefined ? `${msg.spo2}%` : '--'}
                                </td>
                                <td style={{ padding: '12px', color: 'var(--accent-bp)', fontWeight: '600' }}>
                                    {msg.bloodPressure !== undefined ? `${msg.bloodPressure} mmHg` : '--'}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

DataTable.propTypes = {
    messages: PropTypes.array.isRequired
};

export default DataTable;