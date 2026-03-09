import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Default Y-axis domains for each vital metric
export const METRIC_DOMAINS = {
    temperature: [35, 42],
    heartRate:   [40, 140],
    spo2:        [90, 100],
    bp:          [60, 180],
};

const ChartCard = ({ title, data, dataKey, color, domain, unit }) => {

    const formatTime = (unixTimestamp) => {
        return new Date(unixTimestamp).toLocaleTimeString();
    };

    const formatTooltipValue = (value) => {
        return unit ? `${value} ${unit}` : value;
    };

    // Derive a safe domain: use prop if provided, else look up by dataKey, else auto
    const yDomain = domain || METRIC_DOMAINS[dataKey] || ['auto', 'auto'];

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
            <h3 style={{ marginBottom: '20px', color }}>{title}</h3>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="time"
                        type="number"
                        scale="time"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={formatTime}
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.8em' }}
                    />
                    <YAxis
                        stroke="var(--text-secondary)"
                        domain={yDomain}                   // ✅ Fixed: metric-specific Y range
                        tickFormatter={(v) => unit ? `${v}${unit}` : v}
                        width={55}                         // ✅ Prevents label clipping
                    />
                    <Tooltip
                        labelFormatter={formatTime}
                        formatter={formatTooltipValue}     // ✅ Shows unit in hover tooltip
                        contentStyle={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={3}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

ChartCard.propTypes = {
    title:   PropTypes.string.isRequired,
    data:    PropTypes.array.isRequired,
    dataKey: PropTypes.string.isRequired,
    color:   PropTypes.string.isRequired,
    domain:  PropTypes.arrayOf(PropTypes.number), // optional override, e.g. [60, 180]
    unit:    PropTypes.string,                    // optional, e.g. "bpm", "°C", "%"
};

ChartCard.defaultProps = {
    domain: null,
    unit: '',
};

export default ChartCard;