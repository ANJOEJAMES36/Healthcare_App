import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Default Y-axis domains for each vital metric
export const METRIC_DOMAINS = {
    temperature: [35, 42],
    heartRate: [40, 140],
    spo2: [90, 100],
    motion: [-0.5, 2.5],  // sleep=0, sit=1, walk=2
};

// Maps numeric motion values back to readable labels
const MOTION_LABELS = { 0: '😴 Sleep', 1: '🪑 Sit', 2: '🚶 Walk' };

const ChartCard = ({ title, data, dataKey, color, domain, unit, timeRange }) => {

    // Format X-axis tick labels based on the selected time range
    const formatTime = (unixMs) => {
        if (!unixMs) return '';
        const date = new Date(unixMs);
        if (timeRange === '10min' || timeRange === '30min') {
            // Show HH:MM:SS for short ranges so ticks are distinct
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        } else if (timeRange === '1hr' || timeRange === '4hr' || timeRange === '8hr') {
            // Show HH:MM for medium ranges
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
            // Show date + hour for long ranges (12hr, 24hr)
            return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        }
    };

    const formatTooltipValue = (value) => {
        return unit ? `${value} ${unit}` : value;
    };

    // Derive a safe Y-axis domain
    const yDomain = domain || METRIC_DOMAINS[dataKey] || ['auto', 'auto'];

    // For motion chart, only show rows that have an actual motion value
    const chartData = dataKey === 'motion'
        ? data.filter(d => d.motion != null)
        : data;

    if (!chartData || chartData.length === 0) {
        return (
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '290px'
            }}>
                <h3 style={{ marginBottom: '20px', color }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>No data available</p>
            </div>
        );
    }

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
            <h3 style={{ marginBottom: '20px', color }}>{title}</h3>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="time"
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={formatTime}
                        tickCount={6}
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.75em' }}
                        angle={-25}
                        textAnchor="end"
                        height={45}
                    />
                    <YAxis
                        stroke="var(--text-secondary)"
                        domain={yDomain}
                        tickFormatter={dataKey === 'motion'
                            ? (v) => MOTION_LABELS[Math.round(v)] || ''
                            : (v) => unit ? `${v}${unit}` : v}
                        width={dataKey === 'motion' ? 80 : 55}
                        ticks={dataKey === 'motion' ? [0, 1, 2] : undefined}
                    />
                    <Tooltip
                        labelFormatter={formatTime}
                        formatter={(value, name, props) => {
                            if (dataKey === 'motion') {
                                const label = props?.payload?.motionLabel || MOTION_LABELS[Math.round(value)] || value;
                                return [label, 'Motion'];
                            }
                            return unit ? [`${value} ${unit}`, name] : [value, name];
                        }}
                        contentStyle={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <Line
                        type={dataKey === 'motion' ? 'stepAfter' : 'monotone'}
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={3}
                        dot={dataKey === 'motion'}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

ChartCard.propTypes = {
    title: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired,
    dataKey: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    timeRange: PropTypes.string,
    domain: PropTypes.arrayOf(PropTypes.number),
    unit: PropTypes.string,
};

ChartCard.defaultProps = {
    timeRange: '1hr',
    domain: null,
    unit: '',
};

export default ChartCard;