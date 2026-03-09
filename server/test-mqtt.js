require('dotenv').config();
const mqtt = require('mqtt');

const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    protocol: 'mqtts',
    port: parseInt(process.env.MQTT_PORT || '8883'),
});

const topic = process.env.MQTT_TOPIC || 'esp32/health/data';

const baseData = {
    user1: { temperature: 36.5, heartRate: 72, spo2: 98, bloodPressure: 120 },
    user2: { temperature: 37.1, heartRate: 88, spo2: 95, bloodPressure: 135 }
};

const randomVariation = (base, range) => {
    return +(base + (Math.random() * range * 2 - range)).toFixed(1);
};

const publishForUser = (userId) => {
    const base = baseData[userId];
    const payload = JSON.stringify({
        userId,
        temperature: randomVariation(base.temperature, 0.3),
        heartRate: Math.round(randomVariation(base.heartRate, 3)),
        spo2: Math.min(100, Math.round(randomVariation(base.spo2, 1))),
        bloodPressure: Math.round(randomVariation(base.bloodPressure, 3)),
        timestamp: new Date().toISOString()
    });

    client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) {
            console.error(`❌ Failed to publish for ${userId}:`, err);
        } else {
            console.log(`📤 [${new Date().toLocaleTimeString()}] ${userId}:`, payload);
        }
    });
};

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    console.log(`📡 Publishing to topic: ${topic}`);
    console.log('⏹  Press Ctrl+C to stop\n');

    // Publish for both users immediately on connect
    publishForUser('user1');
    publishForUser('user2');

    // Then publish every 5 seconds for both users simultaneously
    setInterval(() => {
        publishForUser('user1');
        publishForUser('user2');
    }, 5000);
});

client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
});

client.on('offline', () => {
    console.warn('⚠️ MQTT client offline — will retry automatically');
});

client.on('reconnect', () => {
    console.log('🔄 Reconnecting to broker...');
});

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping test publisher...');
    client.end(() => {
        console.log('✅ Disconnected cleanly');
        process.exit(0);
    });
});