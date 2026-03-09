require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDatabase = require('./config/database');
const DataModel = require('./models/DataModel');
const dataRoutes = require('./routes/dataRoutes');
const debugRoutes = require('./routes/debugRoutes');
const authRoutes = require('./routes/authRoutes');
const seedUsers = require('./utils/seedUsers');
const { setupMQTT } = require('./mqtt/mqttClient');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Connect to MongoDB and Seed Users
connectDatabase()
    .then(() => {
        console.log('✅ Database connected successfully');
        seedUsers();
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    });

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/debug', debugRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Setup MQTT
setupMQTT(io);

// Socket.io connection handler
io.on('connection', async (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Get userId from handshake query
    const userId = socket.handshake.query.userId;

    if (userId) {
        // Join personal room so they only receive their own data
        socket.join(userId);
        console.log(`🔐 Socket ${socket.id} joined room: ${userId}`);

        // Send last 50 records for THIS user only
        try {
            const historicalData = await DataModel.find({ userId })
                .sort({ timestamp: -1 })
                .limit(50)
                .lean();
            socket.emit('initial-data', historicalData.reverse());
            console.log(`📦 Sent ${historicalData.length} historical records to ${userId}`);
        } catch (err) {
            console.error('❌ Error fetching history:', err);
            socket.emit('error', { message: 'Failed to fetch historical data' });
        }
    } else {
        console.warn(`⚠️ Socket ${socket.id} connected without userId`);

        // Send last 50 records without user filter as fallback
        try {
            const historicalData = await DataModel.find()
                .sort({ timestamp: -1 })
                .limit(50)
                .lean();
            socket.emit('initial-data', historicalData.reverse());
        } catch (err) {
            console.error('❌ Error fetching history:', err);
            socket.emit('error', { message: 'Failed to fetch historical data' });
        }
    }

    // Allow client to explicitly join a room after connection
    socket.on('join', (roomUserId) => {
        socket.join(roomUserId);
        console.log(`🔐 Socket ${socket.id} joined room: ${roomUserId}`);
    });

    // Allow client to join admin room
    socket.on('join-admin', () => {
        socket.join('admin');
        console.log(`🛡️ Socket ${socket.id} joined admin room`);
    });

    socket.on('disconnect', (reason) => {
        console.log(`❌ User disconnected: ${socket.id} — reason: ${reason}`);
    });

    socket.on('error', (err) => {
        console.error(`❌ Socket error for ${socket.id}:`, err);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});