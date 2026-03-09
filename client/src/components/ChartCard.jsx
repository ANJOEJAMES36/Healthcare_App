import PropTypes from 'prop-types';
import {
    LineChart, Line, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// Default Y-axis domains for numeric metrics
export const METRIC_DOMAINS = {
    temperature: [35, 42],
    heartRate: [40, 140],
    spo2: [90, 100],
};

// Motion state display config
const MOTION_CONFIG = {
    0: { label: 'Sleep', color: '#74c0fc' },
    1: { label: 'Sit', color: '#ffa94d' },
    2: { label: 'Walk', color: '#a9e34b' },
};

const ChartCard = ({ title, data, dataKey, color, domain, unit, timeRange }) => {

    // Format X-axis tick labels based on the selected time range
    const formatTime = (unixMs) => {
        if (!unixMs) return '';
        const date = new Date(unixMs);
        if (timeRange === '10min' || timeRange === '30min') {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        } else if (timeRange === '1hr' || timeRange === '4hr' || timeRange === '8hr') {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
            return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        }
    };

    // --- Motion chart: custom categorical bar chart ---
    if (dataKey === 'motion') {
        const motionData = data.filter(d => d.motion != null);

        if (motionData.length === 0) {
            return (
                <div style={{
                    background: 'var(--bg-card)', borderRadius: '16px', padding: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '290px'
                }}>
                    <h3 style={{ marginBottom: '20px', color }}>{title}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>No motion data yet</p>
                </div>
            );
        }

        // Custom Y-axis tick for motion labels
        const MotionTick = ({ x, y, payload }) => {
            const cfg = MOTION_CONFIG[payload.value];
            if (!cfg) return null;
            return (
                <text x={x} y={y} dy={4} textAnchor="end" fill={cfg.color} fontSize={12} fontWeight="600">
                    {cfg.label}
                </text>
            );
        };

        // Custom tooltip for motion
        const MotionTooltip = ({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const val = payload[0]?.value;
            const cfg = MOTION_CONFIG[val];
            return (
                <div style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    borderRadius: '8px', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '0.85em'
                }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{formatTime(label)}</div>
                    <div style={{ color: cfg?.color, fontWeight: 'bold' }}>{cfg?.label || '--'}</div>
                </div>
            );
        };

        return (
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                <h3 style={{ marginBottom: '8px', color }}>{title}</h3>
                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {Object.entries(MOTION_CONFIG).map(([k, cfg]) => (
                        <span key={k} style={{ fontSize: '0.8em', color: cfg.color, fontWeight: '600' }}>
                            ● {cfg.label}
                        </span>
                    ))}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={motionData} barCategoryGap="0%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
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
                            type="number"
                            domain={[-0.5, 2.5]}
                            ticks={[0, 1, 2]}
                            tick={<MotionTick />}
                            width={52}
                            stroke="var(--text-secondary)"
                        />
                        <ReferenceLine y={0} stroke={MOTION_CONFIG[0].color} strokeDasharray="4 4" strokeOpacity={0.3} />
                        <ReferenceLine y={1} stroke={MOTION_CONFIG[1].color} strokeDasharray="4 4" strokeOpacity={0.3} />
                        <ReferenceLine y={2} stroke={MOTION_CONFIG[2].color} strokeDasharray="4 4" strokeOpacity={0.3} />
                        <Tooltip content={<MotionTooltip />} />
                        <Bar dataKey="motion" maxBarSize={8} radius={[2, 2, 0, 0]} isAnimationActive={false}>
                            {motionData.map((entry, index) => (
                                <Cell key={index} fill={MOTION_CONFIG[entry.motion]?.color || color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    // --- Standard numeric line charts ---
    const yDomain = domain || METRIC_DOMAINS[dataKey] || ['auto', 'auto'];

    if (!data || data.length === 0) {
        return (
            <div style={{
                background: 'var(--bg-card)', borderRadius: '16px', padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '290px'
            }}>
                <h3 style={{ marginBottom: '20px', color }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>No data available</p>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
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
                        tickFormatter={(v) => unit ? `${v}${unit}` : v}
                        width={55}
                    />
                    <Tooltip
                        labelFormatter={formatTime}
                        formatter={(value) => unit ? [`${value} ${unit}`] : [value]}
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