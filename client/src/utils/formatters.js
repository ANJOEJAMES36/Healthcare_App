/**
 * Format chart data with intelligent sampling
 */
export const formatChartData = (messages) => {
    if (!messages || messages.length === 0) return [];

    // Always sort ascending (oldest → newest) so chart renders left → right
    const sorted = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const dataPointsTarget = 100;
    const sampleRate = sorted.length > dataPointsTarget
        ? Math.ceil(sorted.length / dataPointsTarget)
        : 1;

    const sampledData = sorted.filter((_, index) => index % sampleRate === 0);

    const MOTION_MAP = { sleep: 1, sit: 2, walk: 3 };

    return sampledData.map(msg => {
        const date = new Date(msg.timestamp);
        const motionNum = msg.motion != null ? (MOTION_MAP[msg.motion] ?? null) : null;
        return {
            time: date.getTime(),          // numeric Unix ms — ChartCard tickFormatter handles display
            temperature: msg.temperature ?? null,
            heartRate: msg.heartRate ?? null,
            spo2: msg.spo2 ?? null,
            motion: motionNum,
            motionLabel: msg.motion ?? null   // raw string for tooltip
        };
    }).filter(d => d.time > 0);  // remove any bad timestamps
};

/**
 * Determine warning status based on value and thresholds
 */
export const getWarningStatus = (value, metric, thresholds) => {
    if (value == null || !thresholds?.[metric]) return 'normal';
    const { low, high } = thresholds[metric];
    if (value < low || value > high) return 'danger';
    if (value <= low + (high - low) * 0.1 || value >= high - (high - low) * 0.1) return 'warning';
    return 'success';
};

/**
 * Get color for status
 */
export const getStatusColor = (status) => {
    switch (status) {
        case 'success': return 'var(--success)';
        case 'warning': return 'var(--warning)';
        case 'danger': return 'var(--danger)';
        default: return 'var(--border-color)';
    }
};