require('dotenv').config();
const mqtt = require('mqtt');

const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    protocol: 'mqtts',
    port: parseInt(process.env.MQTT_PORT || '8883'),
});

const topic = process.env.MQTT_TOPIC || 'esp32/health/data';

// --- Test scenarios that cycle through each user ---
// Each scenario is: { label, heartRate, temperature, spo2, motion }
const SCENARIOS = [
    // ✅ Normal — no alerts
    { label: '✅ Normal', heartRate: 75, temperature: 36.6, spo2: 98, motion: 'sit' },

    // ⚡ WARNING levels
    { label: '⚡ HR Low warn', heartRate: 58, temperature: 36.6, spo2: 98, motion: 'sit' },
    { label: '⚡ HR High warn', heartRate: 105, temperature: 36.6, spo2: 98, motion: 'walk' },
    { label: '⚡ Temp Low warn', heartRate: 75, temperature: 35.8, spo2: 98, motion: 'sit' },
    { label: '⚡ Temp High warn', heartRate: 75, temperature: 37.5, spo2: 98, motion: 'sleep' },
    { label: '⚡ SpO2 warn', heartRate: 75, temperature: 36.6, spo2: 93, motion: 'sit' },

    // 🚨 DANGER / CRITICAL levels
    { label: '🚨 HR Low DANGER', heartRate: 45, temperature: 36.6, spo2: 98, motion: 'sleep' },
    { label: '🚨 HR High DANGER', heartRate: 125, temperature: 36.6, spo2: 98, motion: 'walk' },
    { label: '🚨 Temp Low DANGER', heartRate: 75, temperature: 34.5, spo2: 98, motion: 'sleep' },
    { label: '🚨 Temp High DANGER', heartRate: 75, temperature: 39.2, spo2: 98, motion: 'sit' },
    { label: '🚨 SpO2 DANGER', heartRate: 75, temperature: 36.6, spo2: 87, motion: 'sit' },

    // Multi-warning
    { label: '🚨 MULTI DANGER', heartRate: 130, temperature: 39.5, spo2: 86, motion: 'walk' },

    // Back to normal
    { label: '✅ Normal again', heartRate: 72, temperature: 36.8, spo2: 99, motion: 'sit' },
];

const MOTION_VALUES = ['sit', 'walk', 'sleep'];
let scenarioIndex = { user1: 0, user2: 6 };   // start user2 mid-cycle so they're out of sync

const publishForUser = (userId) => {
    const scenario = SCENARIOS[scenarioIndex[userId] % SCENARIOS.length];
    const payload = JSON.stringify({
        userId,
        heartRate: scenario.heartRate,
        temperature: scenario.temperature,
        spo2: scenario.spo2,
        motion: scenario.motion,
        timestamp: new Date().toISOString()
    });

    client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
            console.error(`❌ Failed to publish for ${userId}:`, err);
        } else {
            console.log(`📤 [${new Date().toLocaleTimeString()}] ${userId} | ${scenario.label}`);
            console.log(`   HR:${scenario.heartRate} | Temp:${scenario.temperature}°C | SpO2:${scenario.spo2}% | Motion:${scenario.motion}`);
        }
    });

    scenarioIndex[userId]++;
};

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    console.log(`📡 Publishing to topic: ${topic}`);
    console.log(`🔄 Cycling through ${SCENARIOS.length} test scenarios (one per 5s interval)\n`);
    console.log('Thresholds being tested:');
    console.log('  Heart Rate — Warning: <60 or >100 BPM | Danger: <50 or >120 BPM');
    console.log('  Temperature — Warning: <36°C or >37.2°C | Danger: <35°C or >38.5°C');
    console.log('  SpO2 — Warning: <95% | Danger: <90%\n');
    console.log('⏹  Press Ctrl+C to stop\n');

    // Publish immediately on connect
    publishForUser('user1');
    publishForUser('user2');

    // Then publish every 5 seconds
    setInterval(() => {
        publishForUser('user1');
        publishForUser('user2');
    }, 5000);
});

client.on('error', (err) => console.error('❌ MQTT Error:', err));
client.on('offline', () => console.warn('⚠️ MQTT client offline — will retry'));
client.on('reconnect', () => console.log('🔄 Reconnecting...'));

process.on('SIGINT', () => {
    console.log('\n🛑 Stopping test publisher...');
    client.end(() => {
        console.log('✅ Disconnected cleanly');
        process.exit(0);
    });
});