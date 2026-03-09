import PropTypes from 'prop-types';

// Warning thresholds — no motion
const WARNINGS = [
    {
        key: 'heartRate', label: 'Heart Rate',
        danger: v => v < 50 || v > 120,
        warning: v => v < 60 || v > 100,
        dangerMsg: v => v < 50
            ? `⚠️ Critical: Heart Rate ${v} BPM — dangerously low!`
            : `⚠️ Critical: Heart Rate ${v} BPM — dangerously high!`,
        warnMsg: v => v < 60
            ? `⚡ Warning: Heart Rate ${v} BPM — below normal range`
            : `⚡ Warning: Heart Rate ${v} BPM — above normal range`,
    },
    {
        key: 'temperature', label: 'Temperature',
        danger: v => v < 35.0 || v > 38.5,
        warning: v => v < 36.0 || v > 37.2,
        dangerMsg: v => v < 35.0
            ? `⚠️ Critical: Temp ${v}°C — hypothermia risk!`
            : `⚠️ Critical: Temp ${v}°C — high fever!`,
        warnMsg: v => v < 36.0
            ? `⚡ Warning: Temp ${v}°C — below normal`
            : `⚡ Warning: Temp ${v}°C — mild fever`,
    },
    {
        key: 'spo2', label: 'SpO2',
        danger: v => v < 90,
        warning: v => v < 95,
        dangerMsg: v => `⚠️ Critical: SpO2 ${v}% — severe hypoxia!`,
        warnMsg: v => `⚡ Warning: SpO2 ${v}% — low oxygen saturation`,
    },
];

const WarningBanner = ({ latestData }) => {
    if (!latestData) return null;

    const alerts = [];
    WARNINGS.forEach(w => {
        const v = latestData[w.key];
        if (v == null) return;
        if (w.danger(v)) alerts.push({ msg: w.dangerMsg(v), level: 'danger' });
        else if (w.warning(v)) alerts.push({ msg: w.warnMsg(v), level: 'warning' });
    });

    if (alerts.length === 0) return null;

    return (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((a, i) => (
                <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    borderLeft: `5px solid ${a.level === 'danger' ? '#e63946' : '#ffb200'}`,
                    background: a.level === 'danger'
                        ? 'rgba(230, 57, 70, 0.15)'
                        : 'rgba(255, 178, 0, 0.12)',
                    boxShadow: `0 2px 12px ${a.level === 'danger' ? 'rgba(230,57,70,0.2)' : 'rgba(255,178,0,0.15)'}`,
                    animation: 'fadeInAlert 0.3s ease',
                }}>
                    <span style={{ fontSize: '1.4em', flexShrink: 0 }}>
                        {a.level === 'danger' ? '🚨' : '⚡'}
                    </span>
                    <span style={{
                        color: a.level === 'danger' ? '#ff6b6b' : '#ffd166',
                        fontWeight: '700',
                        fontSize: '0.95em',
                        letterSpacing: '0.01em',
                    }}>
                        {a.msg}
                    </span>
                </div>
            ))}
        </div>
    );
};

WarningBanner.propTypes = {
    latestData: PropTypes.object,
};

export default WarningBanner;
