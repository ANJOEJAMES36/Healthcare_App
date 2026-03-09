// Time range configurations
const TIME_RANGES = {
    '10min': 10 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '1hr': 60 * 60 * 1000,
    '4hr': 4 * 60 * 60 * 1000,
    '8hr': 8 * 60 * 60 * 1000,
    '12hr': 12 * 60 * 60 * 1000,
    '24hr': 24 * 60 * 60 * 1000
};

// Warning thresholds for health metrics
const WARNING_THRESHOLDS = {
    temperature: { low: 36, high: 37.5 },
    heartRate: { low: 60, high: 100 },
    spo2: { low: 95, high: 100 }
};

module.exports = {
    TIME_RANGES,
    WARNING_THRESHOLDS
};
