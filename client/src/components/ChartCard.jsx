import PropTypes from 'prop-types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ChartCard = ({ title, data, dataKey, color }) => {
    
    // Formats the Unix timestamp into a readable time (e.g., "11:15:35 PM")
    const formatTime = (unixTimestamp) => {
        return new Date(unixTimestamp).toLocaleTimeString();
    };

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
                        type="number"                      // 1. Forces a continuous mathematical scale
                        scale="time"                       // 2. Optimizes the scale for time-series data
                        domain={['dataMin', 'dataMax']}    // 3. Ensures the graph doesn't pad the edges with empty space
                        tickFormatter={formatTime}         // 4. Converts the math number back to a readable string for the screen
                        stroke="var(--text-secondary)"
                        style={{ fontSize: '0.8em' }}
                    />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                        labelFormatter={formatTime}        // Formats the time in the hover tooltip too
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
                        dot={false}                        // Tip: Set this to false for smoother real-time lines without chunky dots
                        isAnimationActive={false}          // Tip: Disable animation for real-time charts to prevent jitter
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
    color: PropTypes.string.isRequired
};

export default ChartCard;