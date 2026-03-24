const mqtt = require('mqtt');
const DataModel = require('../models/DataModel');

let mqttClient = null;

const VALID_USERS = ['user1', 'user2'];

const setupMQTT = (io) => {
    const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
    const MQTT_TOPIC = process.env.MQTT_TOPIC || 'esp32/health/data';

    if (!MQTT_BROKER_URL) {
        console.error('MQTT_BROKER_URL is not set in environment variables');
        return null;
    }

    const MQTT_OPTIONS = {
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        protocol: 'mqtts',
        port: parseInt(process.env.MQTT_PORT || '8883'),
        rejectUnauthorized: true,
        reconnectPeriod: 5000,   // retry every 5s if disconnected
        connectTimeout: 30000,   // 30s connection timeout
    };

    mqttClient = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

    mqttClient.on('connect', () => {
        console.log(`✅ Connected to MQTT Broker: ${MQTT_BROKER_URL}`);
        mqttClient.subscribe([MQTT_TOPIC, 'health/#'], { qos: 1 }, (err) => {
            if (!err) {
                console.log(`✅ Subscribed to topics: ${MQTT_TOPIC} and health/#`);
            } else {
                console.error('❌ Failed to subscribe:', err);
            }
        });
    });

    mqttClient.on('reconnect', () => {
        console.log('🔄 Reconnecting to MQTT Broker...');
    });

    mqttClient.on('offline', () => {
        console.warn('⚠️ MQTT client is offline');
    });

    mqttClient.on('close', () => {
        console.warn('⚠️ MQTT connection closed');
    });

    mqttClient.on('message', async (topic, message) => {
        try {
            const msgString = message.toString();
            console.log(`📨 Received on [${topic}]: ${msgString}`);

            // Parse JSON
            let parsedData;
            try {
                parsedData = JSON.parse(msgString);
            } catch (parseErr) {
                console.error('❌ Invalid JSON received:', msgString);
                return;
            }

            // Map ESP32 payload format to standard
            if (parsedData.id !== undefined && !parsedData.userId) {
                parsedData.userId = parsedData.id === 1 ? 'user1' : (parsedData.id === 2 ? 'user2' : 'unknown');
            }
            if (parsedData.temp !== undefined && parsedData.temperature === undefined) {
                parsedData.temperature = parseFloat(parsedData.temp);
            }
            if (parsedData.hr !== undefined && parsedData.heartRate === undefined) {
                parsedData.heartRate = parseInt(parsedData.hr);
            }
            if (parsedData.motion && typeof parsedData.motion === 'string') {
                const m = parsedData.motion.toLowerCase();
                if (m === 'still') parsedData.motion = 'sit';
                else if (m === 'move') parsedData.motion = 'walk';
                else parsedData.motion = m;
            }

            // Validate userId
            const userId = parsedData.userId;
            if (!userId || !VALID_USERS.includes(userId)) {
                console.warn(`⚠️ Rejected message — unknown userId: "${userId}"`);
                return;
            }

            // Validate required fields
            if (
                parsedData.temperature === undefined ||
                parsedData.heartRate === undefined ||
                parsedData.spo2 === undefined
            ) {
                console.warn(`⚠️ Rejected message — missing required fields:`, parsedData);
                return;
            }

            // Save to MongoDB
            const newData = new DataModel({
                userId,
                temperature: parsedData.temperature,
                heartRate: parsedData.heartRate,
                spo2: parsedData.spo2,
                motion: parsedData.motion || 'sit',
                timestamp: parsedData.timestamp ? new Date(parsedData.timestamp) : new Date()
            });

            const savedData = await newData.save();
            const plainData = savedData.toObject();
            console.log(`💾 Saved data for ${userId}:`, plainData);

            // Emit to user's personal room only
            io.to(userId).emit('mqtt-message', plainData);

            // Also broadcast to admins if needed
            io.to('admin').emit('mqtt-message', plainData);

        } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
        }
    });

    mqttClient.on('error', (error) => {
        console.error('❌ MQTT Error:', error);
    });

    return mqttClient;
};

const getMQTTClient = () => mqttClient;

module.exports = { setupMQTT, getMQTTClient };