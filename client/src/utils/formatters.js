/**
 * Format chart data with intelligent sampling and time formatting
 */
export const formatChartData = (messages, selectedRange) => {
    if (!messages || messages.length === 0) return [];

    const dataPointsTarget = 100;
    const sampleRate = messages.length > dataPointsTarget
        ? Math.ceil(messages.length / dataPointsTarget)
        : 1;

    const sampledData = messages.filter((_, index) => index % sampleRate === 0);

    return sampledData.map(msg => {
        const date = new Date(msg.timestamp);
        let timeLabel;

        if (selectedRange === '10min' || selectedRange === '30min') {
            timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } else if (selectedRange === '1hr' || selectedRange === '4hr') {
            timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else {
            timeLabel = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }

        return {
            time: timeLabel,
            temperature: msg.temperature ?? null,
            heartRate: msg.heartRate ?? null,
            spo2: msg.spo2 ?? null,
            bloodPressure: msg.bloodPressure ?? null
        };
    }).reverse();
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