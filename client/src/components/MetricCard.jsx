import PropTypes from 'prop-types';
import { getWarningStatus, getStatusColor } from '../utils/formatters';

// Map motion strings to display labels
const MOTION_DISPLAY = { sit: '🪑 Still', walk: '🚶 Motion', sleep: '😴 Sleep' };

const MetricCard = ({ title, value, unit, emoji, accentColor, metric, thresholds, isOffline }) => {
    const status = typeof value === 'number' ? getWarningStatus(value, metric, thresholds) : 'normal';
    const borderColor = getStatusColor(status);

    // For motion, map the string to a readable label
    const isMotion = metric === 'motion';
    const displayValue = isMotion
        ? (value ? MOTION_DISPLAY[value] || value : '--')
        : (value != null ? value : '--');

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '24px',
            border: `2px solid ${borderColor}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden',
            opacity: isOffline ? 0.7 : 1,
            transition: 'opacity 0.3s'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: accentColor
            }}></div>
            <div style={{ fontSize: '2.5em', marginBottom: '8px' }}>{emoji}</div>
            <h3 style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9em',
                marginBottom: '12px',
                fontWeight: '500'
            }}>
                {title}
                {isOffline && value != null && (
                    <span style={{ marginLeft: '6px', fontSize: '0.8em', color: 'var(--warning)' }}>(last known)</span>
                )}
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                    fontSize: isMotion ? '1.8em' : '3em',
                    fontWeight: 'bold',
                    color: accentColor
                }}>
                    {displayValue}
                </span>
                {!isMotion && (
                    <span style={{ fontSize: '1.2em', color: 'var(--text-secondary)' }}>{unit}</span>
                )}
            </div>
            {status !== 'success' && typeof value === 'number' && (
                <div style={{
                    marginTop: '12px',
                    padding: '6px 12px',
                    background: status === 'danger' ? 'rgba(230, 57, 70, 0.2)' : 'rgba(255, 210, 63, 0.2)',
                    borderRadius: '8px',
                    fontSize: '0.85em',
                    fontWeight: '600',
                    color: status === 'danger' ? 'var(--danger)' : 'var(--warning)'
                }}>
                    {status === 'danger' ? '⚠️ Out of Range' : '⚡ Near Limit'}
                </div>
            )}
        </div>
    );
};

MetricCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    unit: PropTypes.string.isRequired,
    emoji: PropTypes.string.isRequired,
    accentColor: PropTypes.string.isRequired,
    metric: PropTypes.string.isRequired,
    thresholds: PropTypes.object.isRequired,
    isOffline: PropTypes.bool
};

MetricCard.defaultProps = {
    isOffline: false
};

export default MetricCard;
