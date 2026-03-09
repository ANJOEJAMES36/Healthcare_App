const mongoose = require('mongoose');

// MongoDB Schema with 4th value and userId
const DataSchema = new mongoose.Schema({
    userId: { type: String, default: 'user1' },
    temperature: Number,
    heartRate: Number,
    spo2: Number,
    motion: { type: String, enum: ['sit', 'walk', 'sleep'] },
    timestamp: { type: Date, default: Date.now, expires: 604800 } // TTL: 7 days
});

// Create TTL index for automatic cleanup after 1 week
DataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

const DataModel = mongoose.model('Data', DataSchema, 'Data');

module.exports = DataModel;
